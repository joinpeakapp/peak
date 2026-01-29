# Implémentation des Permissions Notifications

## Vue d'ensemble

Cette implémentation déplace la demande de permission notifications de l'onboarding vers un moment plus contextuel : **après la création du premier workout**.

## Changements effectués

### 1. Nouveau Bottom Sheet de Permission

**Fichier créé :** `src/components/common/NotificationPermissionBottomSheet.tsx`

- Bottom sheet élégant et cohérent avec le design existant de l'app
- Apparaît après la création du premier workout
- Utilise les mêmes animations et styles que les autres modales
- Propose deux options :
  - "Enable notifications" : demande la permission
  - "Maybe later" : ferme le bottom sheet
- Stocke l'état "déjà affiché" dans AsyncStorage pour ne jamais redemander

### 2. Hook de Tracking

**Fichier créé :** `src/hooks/useFirstWorkoutTracker.ts`

- Détecte automatiquement quand le premier workout est créé
- Vérifie si la permission a déjà été demandée
- Affiche le bottom sheet au bon moment (800ms après retour sur homepage)
- Gère l'état de visibilité du modal

### 3. Modifications de l'Onboarding

**Fichier modifié :** `src/screens/onboarding/NewOnboardingNavigator.tsx`

- Suppression des imports de `NotificationPermissionScreen` et `CameraPermissionScreen`
- Suppression des étapes 'notifications' et 'camera' du flow
- Simplification du parcours : splash → carousel → profile → success
- Remplacement de `console.error` par `logger.error`

**Fichiers supprimés :**
- `src/screens/onboarding/NotificationPermissionScreen.tsx`
- `src/screens/onboarding/CameraPermissionScreen.tsx`

### 4. Intégration dans App.tsx

**Fichier modifié :** `App.tsx`

- Import du nouveau `NotificationPermissionBottomSheet`
- Import du hook `useFirstWorkoutTracker`
- Ajout du bottom sheet en overlay de l'application
- Le bottom sheet s'affiche automatiquement après la création du premier workout

### 5. Amélioration des Permissions Caméra/Galerie

**Fichier modifié :** `src/workout/screens/WorkoutPhotoScreen.tsx`

Amélioration de l'UX pour les permissions caméra et galerie :

#### Permission Caméra
- Si refusée, propose 3 options :
  1. "Choose from Gallery" : ouvre directement la galerie
  2. "Retry" : redemande la permission caméra
  3. "Skip Photo" : continue sans photo vers WorkoutSummary

#### Permission Galerie
- Si refusée, propose 2 options :
  1. "Skip Photo" : continue sans photo vers WorkoutSummary
  2. "OK" : ferme l'alerte

#### Messages d'erreur
- Tous les messages traduits en anglais pour cohérence
- Messages plus clairs et informatifs
- Toujours une option de continuer sans photo

## Flow utilisateur

### Nouveau parcours onboarding
1. **Splash Screen** (logo animé)
2. **Carousel** (3 écrans d'introduction)
3. **Profile Setup** (nom + photo optionnelle)
4. **Profile Success** (confirmation)
5. ✅ **Fin de l'onboarding** → Homepage

### Demande de permission notifications
1. Utilisateur crée son premier workout
2. Retour sur la homepage
3. ⏱️ Délai de 800ms
4. 🔔 **Bottom sheet apparaît** avec explication claire
5. Utilisateur choisit "Enable" ou "Maybe later"
6. Permission stockée comme "demandée" (ne redemandera jamais)

### Gestion des permissions photo
1. Utilisateur arrive sur WorkoutPhotoScreen
2. Permission caméra demandée automatiquement
3. Si refusée : 3 options claires (galerie / réessayer / skip)
4. Si galerie choisie mais permission refusée : option de skip
5. Toujours possible de continuer sans photo

## Avantages de cette approche

1. **Meilleur contexte** : L'utilisateur comprend pourquoi on demande les notifications (il vient de créer un workout)
2. **Moins intrusif** : Pas de demandes de permissions pendant l'onboarding
3. **Onboarding plus rapide** : Moins d'étapes, plus fluide
4. **UX améliorée** : Toujours une option de continuer, pas de blocage
5. **Cohérent avec les guidelines Apple** : Demander les permissions au moment où elles ont du sens

## Clé AsyncStorage

- `@peak_notification_permission_shown` : Indique si le bottom sheet a déjà été affiché

## Notes techniques

- Le hook `useFirstWorkoutTracker` utilise `useRef` pour tracker le nombre précédent de workouts
- Détection automatique du passage de 0 à 1 workout
- Aucun appel manuel nécessaire depuis les écrans
- Le bottom sheet utilise les mêmes animations que `StickerInfoBottomSheet`
- Gestion propre du cycle de vie avec `isMounted` ref dans WorkoutPhotoScreen

## Tests recommandés

1. ✅ Vérifier que le bottom sheet apparaît après le premier workout
2. ✅ Vérifier qu'il n'apparaît qu'une seule fois
3. ✅ Vérifier que "Enable notifications" demande bien la permission
4. ✅ Vérifier que "Maybe later" ferme le modal et ne redemande pas
5. ✅ Vérifier le flow onboarding simplifié (sans permissions)
6. ✅ Vérifier les options de skip photo dans WorkoutPhotoScreen
7. ✅ Vérifier que l'app fonctionne même si toutes les permissions sont refusées
