# Nouvelles Fonctionnalités - Implémentation

Date : 30 janvier 2026

## 📱 Fonctionnalités Implémentées

### 1. Demande de Note sur l'App Store

#### Description
Après le premier workout validé, l'application demande automatiquement à l'utilisateur de noter l'app sur l'App Store.

#### Implémentation

**Dépendance ajoutée :**
- `expo-store-review` (SDK 54.0.0 compatible)

**Fichiers créés :**
- `src/services/storeReviewService.ts` - Service pour gérer les demandes de note

**Fichiers modifiés :**
- `src/workout/hooks/useWorkoutHandlers.ts` - Intégration dans le workflow de completion

#### Comportement

1. **Compteur de workouts** : Le service maintient un compteur du nombre de workouts complétés
2. **Demande unique** : La demande de note est faite une seule fois (après le premier workout)
3. **Limitation Apple** : Apple limite naturellement l'affichage à ~3 fois par an maximum
4. **Non-bloquant** : Si la demande échoue, le workflow continue normalement

#### Utilisation

```typescript
// Après la sauvegarde d'un workout complété
await StoreReviewService.incrementCompletedWorkouts();
await StoreReviewService.checkAndRequestReview();
```

#### Fonctions disponibles

- `incrementCompletedWorkouts()` : Incrémente le compteur de workouts
- `checkAndRequestReview()` : Vérifie et demande une note si conditions remplies
- `resetForTesting()` : Réinitialise le compteur (pour tests uniquement)
- `getCompletedWorkoutsCount()` : Obtient le nombre de workouts complétés (debug)

---

### 2. Notification d'Inactivité pour Workouts Oubliés

#### Description
Envoie une notification de rappel si l'utilisateur a un workout en cours mais est inactif depuis un certain temps.

#### Règles de Déclenchement

- **Durée minimale de séance** : 1 heure
- **Temps d'inactivité minimal** : 30 minutes
- **Nombre maximum de notifications** : 1 par workout
- **Annulation automatique** : Quand l'utilisateur revient sur l'app ou valide le workout

#### Implémentation

**Fichiers modifiés :**
- `src/services/notificationService.ts` - Ajout des fonctions de notification d'inactivité
- `src/workout/contexts/ActiveWorkoutContext.tsx` - Détection et gestion de l'inactivité
- `src/types/notifications.ts` - Ajout du type `inactive_workout_reminder`

#### Comportement

1. **Détection d'inactivité** :
   - Un timer vérifie toutes les 5 minutes l'état d'inactivité
   - Le compteur d'activité est réinitialisé à chaque interaction (mise à jour de sets, temps, etc.)

2. **Planification de la notification** :
   - Si durée de séance ≥ 1h ET inactivité ≥ 30min
   - Une seule notification est planifiée par workout

3. **Annulation de la notification** :
   - Quand l'utilisateur revient sur l'app (AppState change)
   - Quand l'utilisateur interagit avec le workout
   - Quand le workout est validé ou abandonné

#### Fonctions ajoutées

**Dans NotificationService :**
```typescript
// Planifier une notification d'inactivité
await NotificationService.scheduleInactiveWorkoutReminder(activeWorkout, lastActivityTime);

// Annuler la notification pour un workout spécifique
await NotificationService.cancelInactiveWorkoutReminder(workoutId);

// Annuler toutes les notifications d'inactivité
await NotificationService.cancelAllInactiveWorkoutReminders();
```

**Dans ActiveWorkoutContext :**
- Tracking automatique de la dernière activité via `lastActivityTimeRef`
- Réinitialisation automatique du compteur lors des interactions
- Vérification périodique toutes les 5 minutes

#### Interactions déclenchant la réinitialisation

- Mise à jour des sets (`updateTrackingData`)
- Mise à jour des temps (`updateTrackingTimeData`)
- Retour de l'app en premier plan (AppState change)
- Démarrage d'un nouveau workout

---

## 🧪 Tests Recommandés

### Test 1 : Demande de Note App Store

1. Réinitialiser le compteur (dev mode) : `StoreReviewService.resetForTesting()`
2. Compléter un premier workout
3. Vérifier que la popup de note apparaît
4. Compléter un second workout
5. Vérifier que la popup n'apparaît plus

### Test 2 : Notification d'Inactivité

**Scénario 1 : Conditions non remplies**
1. Démarrer un workout
2. Attendre 30 minutes (sans 1h de séance)
3. Vérifier qu'aucune notification n'est planifiée

**Scénario 2 : Conditions remplies**
1. Démarrer un workout
2. Attendre 1h05 (pour dépasser 1h de séance)
3. Ne pas interagir pendant 30 minutes
4. Vérifier qu'une notification est planifiée/reçue

**Scénario 3 : Annulation par interaction**
1. Démarrer un workout
2. Attendre 1h05
3. Ne pas interagir pendant 20 minutes
4. Interagir avec le workout (compléter un set)
5. Vérifier que le compteur est réinitialisé et la notification annulée

**Scénario 4 : Annulation par retour sur l'app**
1. Démarrer un workout
2. Attendre 1h05
3. Mettre l'app en arrière-plan
4. Attendre 30 minutes
5. Revenir sur l'app
6. Vérifier que la notification est annulée

**Scénario 5 : Annulation par validation**
1. Démarrer un workout
2. Attendre 1h05
3. Ne pas interagir pendant 30 minutes
4. Valider le workout
5. Vérifier que la notification est annulée

---

## 📝 Notes Techniques

### Permissions Requises

- **Notifications** : L'utilisateur doit avoir autorisé les notifications push
- **Store Review** : Disponible uniquement sur appareil physique (pas sur simulateur)

### Limitations

- **Apple Store Review** : Limité à ~3 affichages par an par Apple
- **Notifications en arrière-plan** : Les vérifications d'inactivité ne fonctionnent que quand l'app est active ou en arrière-plan récent

### Stockage

**StoreReviewService :**
- `@peak_has_requested_review` : Boolean indiquant si la demande a été faite
- `@peak_completed_workouts_count` : Nombre de workouts complétés

**Pas de stockage supplémentaire** pour les notifications d'inactivité (géré en mémoire)

---

## 🔧 Maintenance

### Ajuster les Seuils d'Inactivité

Dans `src/services/notificationService.ts` :

```typescript
const MIN_WORKOUT_DURATION = 60 * 60; // 1 heure (en secondes)
const MIN_INACTIVE_TIME = 30 * 60; // 30 minutes (en secondes)
```

### Ajuster la Fréquence de Vérification

Dans `src/workout/contexts/ActiveWorkoutContext.tsx` :

```typescript
// Vérifier toutes les X minutes
inactivityCheckRef.current = setInterval(checkInactivity, 5 * 60 * 1000);
```

### Désactiver les Fonctionnalités

**Store Review :**
Commenter l'appel dans `useWorkoutHandlers.ts` :

```typescript
// await StoreReviewService.incrementCompletedWorkouts();
// await StoreReviewService.checkAndRequestReview();
```

**Notifications d'Inactivité :**
Commenter l'effet dans `ActiveWorkoutContext.tsx` (lignes ~350-370)

---

## 📚 Ressources

- [Expo Store Review Documentation](https://docs.expo.dev/versions/latest/sdk/storereview/)
- [Apple Store Review Guidelines](https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
