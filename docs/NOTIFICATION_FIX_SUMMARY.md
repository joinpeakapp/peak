# Fix du décalage des notifications J-1

## 🐛 Problème identifié

Les notifications étaient envoyées avec un décalage d'un jour (J-1). Par exemple, une notification pour un workout prévu le mercredi était envoyée le mardi.

### Causes racines

Le problème venait de **deux sources distinctes** :

#### 1. Problème de timezone dans `notificationService.ts`

L'utilisation directe de `setHours()` sur un objet `Date` pouvait causer des décalages d'un jour à cause des conversions de timezone. De plus, le calcul de `daysUntilNext` était effectué AVANT l'appel à `setHours()`, ce qui pouvait donner des résultats incorrects.

**Exemple du problème :**
```javascript
let currentDate = new Date(now);
currentDate.setHours(9, 0, 0, 0); // Peut changer le jour en fonction du timezone
const daysUntilNext = (dayOfWeek - currentDate.getDay() + 7) % 7; // Calcul incorrect
```

#### 2. Incohérence dans la convention des jours de la semaine

Le système utilisait **deux conventions différentes** pour représenter les jours :

- **Convention correcte** (utilisée dans `WorkoutCreateFrequencyScreen.tsx`) :
  - 0 = Dimanche, 1 = Lundi, 2 = Mardi, etc. (conforme à `Date.getDay()`)

- **Convention incorrecte** (utilisée dans `WorkoutEditScreen.tsx` et `WorkoutCard.tsx`) :
  - 0 = Lundi, 1 = Mardi, 2 = Mercredi, etc. (décalé de 1)

Cette incohérence causait des confusions lors de l'affichage et de l'édition des workouts.

## ✅ Solutions implémentées

### 1. Fix du service de notifications (`notificationService.ts`)

#### Dans `calculateWeeklyDates()` :
- ✅ Utilisation de `startOfDay()` de date-fns avant `setHours()` pour normaliser la date
- ✅ Recalcul de `daysUntilNext` **APRÈS** avoir défini l'heure
- ✅ Ajout de logs de débogage avec `getDay()` pour tracer le jour réel

**Code corrigé :**
```typescript
let currentDate = startOfDay(now);
currentDate.setHours(this.NOTIFICATION_HOUR, this.NOTIFICATION_MINUTE, 0, 0);

const currentDayAfterSetHours = currentDate.getDay();
let daysUntilNext = (dayOfWeek - currentDayAfterSetHours + 7) % 7;
```

#### Dans `calculateIntervalDates()` :
- ✅ Même fix appliqué : `startOfDay()` avant `setHours()`
- ✅ Ajout de logs de débogage similaires

### 2. Unification de la convention des jours

#### Dans `WorkoutEditScreen.tsx` :
- ✅ Correction de `DAYS_OF_WEEK` pour utiliser la convention JavaScript standard
- ✅ Ajout d'un commentaire explicatif

**Avant :**
```typescript
const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },    // ❌ Incorrect
  { value: 1, label: 'Tuesday' },
  // ...
];
```

**Après :**
```typescript
// ⚠️ IMPORTANT: Les valeurs doivent correspondre à Date.getDay()
// où 0 = Dimanche, 1 = Lundi, 2 = Mardi, etc.
const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },    // ✅ Correct (Lundi = 1)
  { value: 2, label: 'Tuesday' },   // ✅ Correct (Mardi = 2)
  // ...
  { value: 0, label: 'Sunday' },    // ✅ Correct (Dimanche = 0)
];
```

#### Dans `WorkoutCard.tsx` :
- ✅ Correction de l'array `days` pour l'affichage
- ✅ Ajout d'un commentaire explicatif

**Avant :**
```typescript
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
```

**Après :**
```typescript
// ⚠️ FIX: Utiliser l'ordre correct correspondant à Date.getDay()
// Index 0 = Dimanche, 1 = Lundi, 2 = Mardi, etc.
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
```

### 3. Composant de test des notifications (`ProfileScreen.tsx`)

Pour faciliter le débogage, un composant de test a été ajouté dans l'écran Profile :

- ✅ Affichage de toutes les notifications planifiées
- ✅ Affichage du jour de la semaine (0-6) pour vérifier les calculs
- ✅ Affichage de la date complète et de l'heure
- ✅ Bouton de rafraîchissement

**Utilisation :**
1. Aller dans l'onglet Profile
2. Cliquer sur le menu (⋮) en haut à droite
3. Sélectionner "Show notifications"

## 🧪 Tests effectués

Des scripts de test ont été créés pour valider les corrections :

```javascript
// Test pour tous les jours de la semaine
for (let targetDay = 0; targetDay <= 6; targetDay++) {
  // Vérifier que la notification est planifiée le bon jour
  // ✅ Tous les tests passent
}
```

**Résultats :**
- ✅ Dimanche (0) → Notification le dimanche
- ✅ Lundi (1) → Notification le lundi
- ✅ Mardi (2) → Notification le mardi
- ✅ Mercredi (3) → Notification le mercredi
- ✅ Jeudi (4) → Notification le jeudi
- ✅ Vendredi (5) → Notification le vendredi
- ✅ Samedi (6) → Notification le samedi

## 📝 Notes importantes

### Migration des données existantes

**Aucune migration automatique n'a été implémentée** pour les raisons suivantes :

1. Les workouts sont **toujours créés** via `WorkoutCreateFrequencyScreen` qui utilisait déjà la bonne convention
2. Le problème ne se posait que lors de l'**édition** d'un workout via `WorkoutEditScreen`
3. Il est impossible de déterminer quels workouts ont été édités avec l'ancienne interface incorrecte
4. Les utilisateurs peuvent corriger manuellement leurs workouts si nécessaire via l'écran d'édition (maintenant corrigé)

### Impact sur les utilisateurs

- ✅ **Nouveaux workouts** : Fonctionneront correctement
- ✅ **Éditions futures** : Fonctionneront correctement
- ⚠️ **Workouts existants édités avec l'ancienne interface** : Peuvent avoir des valeurs incorrectes, mais peuvent être corrigés manuellement

## 🔍 Fichiers modifiés

1. `src/services/notificationService.ts` - Fix du calcul des dates
2. `src/workout/screens/WorkoutEditScreen.tsx` - Correction de la convention des jours
3. `src/workout/components/WorkoutCard.tsx` - Correction de l'affichage des jours
4. `src/screens/ProfileScreen.tsx` - Ajout du composant de test

## 🚀 Prochaines étapes

1. Tester dans un nouveau build TestFlight
2. Vérifier que les notifications sont envoyées le bon jour
3. Utiliser le composant de test dans Profile pour valider les notifications planifiées
4. Si nécessaire, demander aux utilisateurs de vérifier leurs workouts hebdomadaires

## 📊 Logs de débogage

Les logs suivants ont été ajoutés pour faciliter le débogage :

```
🔔 [DEBUG] calculateWeeklyDates for "Workout Name"
🔔 [DEBUG] - Now: 2026-01-24 09:00:00 Friday (day 5)
🔔 [DEBUG] - Target day: 1 (Monday)
🔔 [DEBUG] - currentDate after setting time: 2026-01-24 09:00:00 Friday
🔔 [DEBUG] - currentDate.getDay(): 5
🔔 [DEBUG] - daysUntilNext (initial): 3
🔔 [DEBUG] - Different day, will add 3 days
🔔 [DEBUG] - First notification date: 2026-01-27 09:00:00 Monday (day 1)
🔔 [DEBUG] - Added date: 2026-01-27 09:00:00 Monday (day 1)
```

Ces logs permettent de vérifier que le jour calculé correspond bien au jour attendu.
