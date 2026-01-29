# Guide de Test - Permissions Notifications

Ce guide explique comment tester la nouvelle implémentation des permissions notifications sur Expo.

## 🚀 Prérequis

- Expo CLI installé (`npm install -g expo-cli`)
- Expo Go installé sur votre téléphone iOS/Android
- Mode développement activé (`__DEV__ = true`)

## 📱 Démarrage de l'application

### 1. Démarrer Expo

```bash
cd /Users/hugolabbe/Documents/Peak/peak
npm start
# ou
expo start
```

### 2. Scanner le QR code

- **iOS** : Ouvrir l'app Camera et scanner le QR code
- **Android** : Ouvrir l'app Expo Go et scanner le QR code

## 🔧 Outil de Reset Dev

Un outil de développement a été ajouté pour faciliter les tests. Il permet de réinitialiser complètement le compte à zéro.

### Accès à l'outil

1. Ouvrir l'application
2. Aller dans **Profile** (onglet en bas)
3. Cliquer sur l'icône **menu** (⋮) en haut à droite
4. Dans le menu contextuel, vous verrez **"Reset Account (Dev)"** (visible uniquement en mode développement)
5. Cliquer sur **"Reset Account (Dev)"**

### Utilisation

1. Cliquer sur **"Reset Account"**
2. Confirmer l'action dans l'alerte
3. L'app va automatiquement :
   - Supprimer toutes les données utilisateur
   - Réinitialiser le profil
   - Supprimer tous les workouts
   - Supprimer l'historique
   - Réinitialiser les permissions notifications
   - Redémarrer l'app avec l'onboarding

## ✅ Scénarios de Test

### Test 1 : Flow Onboarding Complet

**Objectif** : Vérifier que l'onboarding ne demande plus les permissions

**Étapes** :
1. Reset le compte via Dev Tools
2. L'app redémarre et affiche l'onboarding
3. ✅ **Vérifier** : Pas d'écran de permission notifications
4. ✅ **Vérifier** : Pas d'écran de permission caméra
5. Compléter l'onboarding :
   - Splash screen
   - Carousel (3 écrans)
   - Profile setup (nom + photo optionnelle)
   - Profile success
6. ✅ **Vérifier** : Arrivée sur la homepage sans demandes de permissions

### Test 2 : Bottom Sheet Notifications après Premier Workout

**Objectif** : Vérifier que le bottom sheet apparaît après la création du premier workout

**Étapes** :
1. Reset le compte via Dev Tools
2. Compléter l'onboarding
3. Créer votre premier workout :
   - Aller dans l'onglet **Workouts**
   - Créer un nouveau workout
   - Ajouter des exercices
   - Sauvegarder
4. ✅ **Vérifier** : Retour sur la homepage
5. ✅ **Vérifier** : Après ~800ms, le bottom sheet de permission notifications apparaît
6. ✅ **Vérifier** : Le bottom sheet a un design élégant avec :
   - Icône notifications
   - Titre "Stay on track with reminders"
   - Description claire
   - Bouton "Enable notifications"
   - Bouton "Maybe later"

### Test 3 : Accepter les Notifications

**Objectif** : Vérifier que l'acceptation fonctionne correctement

**Étapes** :
1. Suivre les étapes du Test 2 jusqu'à l'apparition du bottom sheet
2. Cliquer sur **"Enable notifications"**
3. ✅ **Vérifier** : La permission système iOS/Android apparaît
4. Accepter la permission
5. ✅ **Vérifier** : Le bottom sheet se ferme
6. ✅ **Vérifier** : Les notifications sont activées dans Settings

### Test 4 : Refuser les Notifications

**Objectif** : Vérifier que le refus fonctionne correctement

**Étapes** :
1. Suivre les étapes du Test 2 jusqu'à l'apparition du bottom sheet
2. Cliquer sur **"Maybe later"**
3. ✅ **Vérifier** : Le bottom sheet se ferme
4. ✅ **Vérifier** : Le bottom sheet ne réapparaît plus même après redémarrage de l'app
5. Créer un deuxième workout
6. ✅ **Vérifier** : Le bottom sheet ne réapparaît pas

### Test 5 : Bottom Sheet N'apparaît Qu'Une Seule Fois

**Objectif** : Vérifier que le bottom sheet ne s'affiche qu'une seule fois

**Étapes** :
1. Reset le compte
2. Compléter l'onboarding
3. Créer le premier workout
4. Le bottom sheet apparaît → Cliquer "Maybe later"
5. Fermer complètement l'app
6. Rouvrir l'app
7. ✅ **Vérifier** : Le bottom sheet ne réapparaît pas
8. Créer un deuxième workout
9. ✅ **Vérifier** : Le bottom sheet ne réapparaît toujours pas

### Test 6 : Permissions Photo (WorkoutPhotoScreen)

**Objectif** : Vérifier les améliorations des permissions photo

**Étapes** :
1. Créer un workout et le compléter
2. À la fin, choisir de prendre une photo
3. **Si permission caméra refusée** :
   - ✅ **Vérifier** : Alerte avec 3 options :
     - "Choose from Gallery"
     - "Retry"
     - "Skip Photo"
4. Tester chaque option
5. **Si permission galerie refusée** :
   - ✅ **Vérifier** : Alerte avec option "Skip Photo"
6. ✅ **Vérifier** : Toujours possible de continuer sans photo

## 🐛 Points de Vérification

### Onboarding
- [ ] Pas d'écran de permission notifications
- [ ] Pas d'écran de permission caméra
- [ ] Flow fluide : Splash → Carousel → Profile → Success
- [ ] Onboarding se termine correctement

### Bottom Sheet Notifications
- [ ] Apparaît uniquement après le premier workout
- [ ] N'apparaît qu'une seule fois
- [ ] Design cohérent avec l'app
- [ ] Animation fluide
- [ ] Boutons fonctionnent correctement
- [ ] Permission système apparaît si "Enable" cliqué
- [ ] Ne réapparaît pas après "Maybe later"

### Permissions Photo
- [ ] Options claires si permission refusée
- [ ] Possibilité de continuer sans photo
- [ ] Messages en anglais
- [ ] Pas de blocage de l'utilisateur

### Reset Dev Tool
- [ ] Visible uniquement en mode développement dans le menu Profile
- [ ] Apparaît dans le ContextMenu avec une icône destructive (rouge)
- [ ] Reset complet fonctionne
- [ ] App redémarre correctement après reset
- [ ] Onboarding réapparaît après reset

## 📝 Notes Importantes

1. **Mode Développement** : L'outil Dev Tools n'est visible que si `__DEV__ = true`. En production, il sera automatiquement caché.

2. **AsyncStorage** : Le flag `@peak_notification_permission_shown` est stocké dans AsyncStorage. Le reset le supprime.

3. **Détection Automatique** : Le hook `useFirstWorkoutTracker` détecte automatiquement le passage de 0 à 1 workout. Aucune action manuelle nécessaire.

4. **Timing** : Le bottom sheet apparaît 800ms après le retour sur la homepage pour laisser le temps à l'animation de se terminer.

## 🔍 Debug

Si le bottom sheet n'apparaît pas :

1. Vérifier dans les logs Expo :
   ```
   [useFirstWorkoutTracker] ...
   [DevResetService] ...
   ```

2. Vérifier AsyncStorage :
   - Le flag `@peak_notification_permission_shown` ne doit pas exister
   - Le nombre de workouts doit être exactement 1

3. Vérifier le timing :
   - Attendre au moins 1 seconde après le retour sur la homepage

4. Vérifier le mode développement :
   - Le bottom sheet ne fonctionne qu'en mode dev/test

## 🎯 Résultat Attendu

Après tous ces tests, vous devriez avoir :
- ✅ Un onboarding simplifié sans demandes de permissions
- ✅ Un bottom sheet élégant qui apparaît au bon moment
- ✅ Une meilleure UX pour les permissions photo
- ✅ Un outil dev pratique pour tester rapidement
