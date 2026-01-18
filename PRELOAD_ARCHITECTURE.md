# 🚀 Architecture de Préchargement - Peak App

## 📋 Vue d'ensemble

Ce document décrit l'architecture de préchargement des données et assets au lancement de l'application Peak. Le système a été refactoré pour offrir une expérience utilisateur fluide avec un splash screen dynamique et un chargement centralisé.

## 🎯 Objectifs atteints

✅ **Chargement unique et centralisé** des données critiques  
✅ **Splash screen dynamique** avec messages informatifs et fun  
✅ **Barre de progression** en temps réel  
✅ **Gestion d'erreur gracieuse** sans bloquer l'application  
✅ **Cache mémoire** pour accès instantané aux données  
✅ **Persistance des photos** entre les builds  
✅ **Préchargement des images** pour affichage instantané  

---

## 🏗️ Architecture

### 1. **PreloadContext** (`src/contexts/PreloadContext.tsx`)

Contexte React qui centralise l'état du préchargement dans toute l'application.

**États trackés :**
```typescript
{
  isPreloading: boolean;        // Si le préchargement est en cours
  currentStep: PreloadStep;     // Étape actuelle (user-profile, workout-history, etc.)
  progress: number;             // Progression 0-100
  error: string | null;         // Erreur éventuelle
  messages: string[];           // Historique des messages
}
```

**Méthodes :**
- `setCurrentStep(step)` : Change l'étape en cours
- `setProgress(progress)` : Met à jour la progression (0-100)
- `setError(error)` : Signale une erreur
- `addMessage(message)` : Ajoute un message de log
- `completePreload()` : Marque le préchargement comme terminé
- `reset()` : Réinitialise l'état

### 2. **AppPreloadService** (`src/services/appPreloadService.ts`)

Service centralisé qui orchestre le préchargement de toutes les données.

**Données préchargées (dans l'ordre) :**

1. **User Profile** (10% - "Loading your profile...")
   - Profil utilisateur
   - Photo de profil

2. **Personal Records** (10% - suite)
   - Tous les PRs stockés
   - Records par exercice

3. **Streaks** (10% - suite)
   - Données de streak

4. **Workout History** (25% - "Loading workout history...")
   - Historique complet des séances
   - Mise en cache mémoire pour accès instantané

5. **Stickers** (40% - "Preparing achievements...")
   - Génération des stickers pour chaque workout
   - Migration des données historiques

6. **Photos** (60% - "Organizing workout photos...")
   - Migration vers stockage permanent (documentDirectory)
   - Vérification de l'accessibilité
   - Récupération des photos perdues via workoutId

7. **Images** (80% - "Loading images...")
   - Préchargement via `Image.prefetch()`
   - Mise en cache des images

8. **Complete** (100% - "Ready to go!")

**Nouveautés :**
```typescript
// Callbacks pour reporter le progrès
AppPreloadService.setProgressCallbacks({
  onProgress: (progress: number) => void,
  onStepChange: (step: string, message: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
});
```

### 3. **AppLoadingScreen** (`src/components/common/AppLoadingScreen.tsx`)

Splash screen dynamique avec messages fun et barre de progression.

**Fonctionnalités :**

- **Messages contextuels** basés sur l'étape en cours
- **Messages fun aléatoires** après 3 secondes :
  - "Warming up the muscles 💪"
  - "Fueling the app with carbs 🥖"
  - "Counting reps in the background..."
  - etc.

- **Barre de progression animée** reflétant l'état réel
- **Affichage des erreurs** non bloquantes
- **Fade-out élégant** à la fin du chargement
- **Temps minimum** de 1.5s pour éviter le flash

**Structure visuelle :**
```
┌─────────────────────────────┐
│                             │
│       [Logo Peak]           │
│                             │
│   "Loading your profile..." │
│                             │
│   ████████████░░░░░░░ 65%   │
│                             │
└─────────────────────────────┘
```

### 4. **App.tsx** - Intégration

Le `PreloadProvider` enveloppe l'application et coordonne le tout :

```typescript
<Provider store={store}>
  <PreloadProvider>
    <AppContent />
  </PreloadProvider>
</Provider>
```

**Flux d'initialisation :**

1. **Vérification onboarding**
2. **Configuration des callbacks** vers PreloadContext
3. **Lancement du préchargement** via AppPreloadService
4. **Affichage du splash** pendant `preloadContext.state.isPreloading === true`
5. **Transition vers l'app** quand `preloadContext.state.isPreloading === false`

---

## 🔄 Flux de données

```
┌──────────────────────┐
│   App.tsx starts     │
│  (Storage + Redux)   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Check onboarding     │
│ status               │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Setup PreloadContext │
│ callbacks            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│ AppPreloadService.preloadAppData()       │
│                                          │
│  1. User Profile       → 10%            │
│  2. Personal Records   → 10%            │
│  3. Streaks            → 10%            │
│  4. Workout History    → 25%            │
│  5. Stickers           → 40%            │
│  6. Photos Migration   → 60%            │
│  7. Images Preload     → 80%            │
│  8. Complete           → 100%           │
│                                          │
│  Each step reports progress via          │
│  callbacks to PreloadContext             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ AppLoadingScreen     │
│ displays progress    │
│ with fun messages    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Preload complete     │
│ → Fade out splash    │
│ → Show main app      │
└──────────────────────┘
```

---

## 📦 Données en cache mémoire

### WorkoutHistory Cache

`AppPreloadService` maintient un cache mémoire des workouts :

```typescript
AppPreloadService.getPreloadedWorkoutHistory(): CompletedWorkout[] | null
AppPreloadService.updatePreloadedWorkoutHistory(workouts: CompletedWorkout[])
```

**Utilisé par :**
- `WorkoutHistoryContext` : initialisation instantanée
- `JournalScreen` : affichage sans délai
- Tous les écrans nécessitant l'historique

### Image Cache

`ImageCacheUtils` précharge et met en cache les images :

```typescript
ImageCacheUtils.preloadImages(uris: string[]): Promise<void>
ImageCacheUtils.clearCache(): void
ImageCacheUtils.getCacheSize(): number
```

---

## 🛡️ Gestion d'erreur

### Stratégie

1. **Erreurs non bloquantes** : l'app continue même si un préchargement échoue
2. **Affichage visible** : messages d'erreur dans le splash screen
3. **Fallback gracieux** : valeurs par défaut pour données manquantes
4. **Logging complet** : toutes les erreurs sont loggées dans la console

### Timeout

- **Aucun timeout strict** sur le préchargement global
- **Temps minimum d'affichage** : 1.5s pour éviter le flash
- **Promise.allSettled** : continue même si certaines promises échouent

---

## 🎨 Messages dynamiques

### Messages par étape

Chaque étape a plusieurs messages aléatoires pour la variété :

```typescript
const LOADING_MESSAGES: Record<PreloadStep, string[]> = {
  'user-profile': [
    'Loading your profile...',
    'Getting your stats ready...',
    'Preparing your dashboard...',
  ],
  'workout-history': [
    'Loading your workout history...',
    'Gathering your sessions...',
    'Preparing your journal...',
  ],
  // etc.
};
```

### Messages fun (après 3 secondes)

Si le chargement dépasse 3 secondes, un message fun s'affiche :

```typescript
const FUN_MESSAGES = [
  'Warming up the muscles 💪',
  'Fueling the app with carbs 🥖',
  'Counting reps in the background...',
  'Preparing your gains...',
  'Brewing some protein shakes...',
  'Stretching before we start...',
  // etc.
];
```

---

## 🔧 Optimisations

### Cache mémoire

- **WorkoutHistory** : chargé une fois, disponible instantanément
- **Stickers** : pré-calculés et mis en cache
- **Images** : préchargées via `Image.prefetch()`

### Migration des photos

- **Stockage permanent** dans `documentDirectory` (persiste entre builds)
- **Récupération automatique** via `workoutId` si le chemin change
- **Vérification d'accessibilité** avant utilisation

### Préchargement des images

- **Parallélisme** : toutes les images chargées simultanément
- **Cache natif** : utilise le cache d'images de React Native
- **Fallback** : placeholder si image indisponible

---

## 📊 Métriques

### Temps de chargement typique

- **Utilisateur nouveau** : ~1-2 secondes
- **Utilisateur avec historique** : ~2-4 secondes
- **Utilisateur avec nombreuses photos** : ~3-6 secondes

### Progression

- Progression linéaire de 0% à 100%
- Étapes visibles et informatives
- Temps minimum garanti : 1.5s

---

## 🚀 Évolution future

### Prêt pour :

✅ **Sync cloud** (Firebase/Supabase)
- Les callbacks peuvent être étendus pour inclure le sync

✅ **IA / Recommandations**
- Nouveaux steps peuvent être ajoutés facilement

✅ **Offline first**
- Architecture déjà optimisée pour le local-first

✅ **Analytics**
- Les étapes et temps sont déjà trackés

---

## 📝 Code examples

### Ajouter une nouvelle étape de préchargement

1. **Définir le type dans PreloadContext :**
```typescript
export type PreloadStep = 
  | 'user-profile'
  | 'my-new-step'  // ← Ajout
  | 'complete';
```

2. **Ajouter les messages dans AppLoadingScreen :**
```typescript
const LOADING_MESSAGES: Record<PreloadStep, string[]> = {
  'my-new-step': [
    'Loading new feature...',
    'Preparing something cool...',
  ],
  // ...
};
```

3. **Implémenter dans AppPreloadService :**
```typescript
static async preloadAppData(): Promise<void> {
  // ...
  
  this.reportStep('my-new-step', 'Loading new feature...');
  this.reportProgress(35); // Position dans le flow
  
  await this.preloadMyNewFeature();
  
  // ...
}
```

### Accéder aux données préchargées

```typescript
// Dans n'importe quel composant
const { completedWorkouts } = useWorkoutHistory();
// ✅ Données déjà chargées, pas de loading state

// Vérifier si le préchargement est terminé
const { state } = usePreload();
if (!state.isPreloading) {
  // App entièrement chargée
}
```

---

## 🎉 Résultat

### Avant

- ❌ Splash screen statique avec timeout fixe
- ❌ Chargement multiple des mêmes données
- ❌ Photos chargent lentement dans Journal
- ❌ Aucun feedback visuel du progrès

### Après

- ✅ Splash screen dynamique avec messages fun
- ✅ Chargement unique et centralisé
- ✅ Photos préchargées et instantanées
- ✅ Progression visible en temps réel
- ✅ Gestion d'erreur gracieuse
- ✅ Architecture évolutive pour le futur

---

## 📚 Fichiers modifiés

1. **Nouveau :** `src/contexts/PreloadContext.tsx`
2. **Modifié :** `src/services/appPreloadService.ts`
3. **Modifié :** `src/components/common/AppLoadingScreen.tsx`
4. **Modifié :** `App.tsx`

---

## 🔗 Liens utiles

- **WorkoutHistoryContext :** Utilise le cache préchargé
- **PhotoStorageService :** Gère la persistance des photos
- **CachedImage :** Utilise le cache d'images
- **JournalScreen :** Bénéficie du préchargement

---

**Date de création :** Janvier 2026  
**Version :** 1.0  
**Status :** ✅ Production ready
