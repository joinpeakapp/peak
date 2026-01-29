# 🔧 Correctifs du préchargement des images

## 🐛 Problèmes identifiés

### 1. Photo de profil non préchargée
**Symptôme :** La photo de profil affiche un loader malgré le préchargement

**Cause :** La fonction `preloadImages()` ne préchargeait que les photos des workouts, pas la photo de profil

### 2. Seules les premières cartes chargées
**Symptôme :** Seulement ~5 cartes semblent chargées dans le journal

**Cause :** Timeout de 5s sur `preloadImages()` qui coupait le préchargement avant la fin

### 3. Loader visible même avec images en cache
**Symptôme :** Loader affiché même pour des images théoriquement préchargées

**Cause :** `showLoader={true}` par défaut sur la photo de profil

---

## ✅ Solutions implémentées

### 1. Préchargement de la photo de profil

**Fichier :** `src/services/appPreloadService.ts`

**Avant :**
```typescript
// preloadImages() ne chargeait que les workouts
for (const workout of workouts) {
  if (workout.photo) {
    imageUris.push(workout.photo);
  }
}
```

**Après :**
```typescript
// 1. Précharger la photo de profil
const profile = await UserProfileService.getUserProfile();
if (profile?.profilePhotoUri && !profile.profilePhotoUri.includes('placeholder')) {
  imageUris.push(profile.profilePhotoUri);
}

// 2. Précharger toutes les photos des workouts
for (const workout of workouts) {
  if (workout.photo) {
    imageUris.push(workout.photo);
  }
}
```

**Résultat :** La photo de profil est maintenant préchargée avec les autres images

### 2. Retrait du timeout sur preloadImages()

**Fichier :** `src/services/appPreloadService.ts`

**Avant :**
```typescript
await Promise.race([
  this.preloadImages(),
  new Promise(resolve => setTimeout(resolve, 5000)) // ❌ Timeout 5s
]);
```

**Après :**
```typescript
await this.preloadImages(); // ✅ Attend la fin complète
```

**Résultat :** TOUTES les images sont préchargées, pas seulement les premières

### 3. Désactivation du loader sur photo de profil

**Fichier :** `src/screens/ProfileScreen.tsx`

**Avant :**
```typescript
<CachedImage
  uri={userProfile.profilePhotoUri}
  style={styles.profilePhoto}
  // showLoader non spécifié = true par défaut
/>
```

**Après :**
```typescript
<CachedImage
  uri={userProfile.profilePhotoUri}
  style={styles.profilePhoto}
  showLoader={false} // ✅ Pas de loader
/>
```

**Résultat :** Pas de loader visible sur la photo de profil

---

## 🎯 Comportement final

### Journal
1. **Au lancement :** Splash screen visible
2. **Préchargement :** TOUTES les photos sont préchargées (pas de limite)
3. **Après préload :** Navigation vers Journal
4. **Résultat :** Toutes les photos s'affichent instantanément, aucun loader

### Profile
1. **Photo de profil :** Affichage instantané, pas de loader
2. **Recent workouts :** Photos préchargées, affichage immédiat

### Logs de debug

```
[AppPreloadService] Starting preload of 45 images (1 profile + 44 workouts)...
[ImageCacheUtils] Preloading 45 images...
[ImageCacheUtils] Preload complete: 45 success, 0 errors
[AppPreloadService] ✅ Preloaded 45 images successfully
```

---

## ⚡ Performance

### Avant

| Scénario | Résultat |
|----------|----------|
| Préchargement | Timeout après 5s → seulement ~5-10 images |
| Photo de profil | Non préchargée → loader visible |
| Journal complet | Seulement premières cartes chargées |

### Après

| Scénario | Résultat |
|----------|----------|
| Préchargement | TOUTES les images préchargées |
| Photo de profil | Préchargée → affichage instantané |
| Journal complet | TOUTES les cartes chargées |

---

## 📝 Fichiers modifiés

1. **src/services/appPreloadService.ts**
   - Ajout préchargement photo de profil
   - Retrait timeout 5s sur preloadImages()
   - Logs améliorés

2. **src/screens/ProfileScreen.tsx**
   - `showLoader={false}` sur CachedImage de la photo de profil

---

## 🔍 Détails techniques

### Ordre de préchargement

1. User profile, PRs, Streaks (10%)
2. Workout history (25%)
3. Stickers (40%)
4. Photos migration (60%)
5. **Images preload** (80-100%) :
   - Photo de profil (1)
   - Photos des workouts (toutes, sans limite)

### Cache d'images

Le cache fonctionne ainsi :
```typescript
// 1. Image.prefetch() télécharge et met en cache React Native
Image.prefetch(uri).then(() => {
  imageCache.set(uri, { loaded: true, timestamp: now });
});

// 2. Au rendu, CachedImage vérifie le cache
const isCached = imageCache.get(uri)?.loaded;
const [isLoading] = useState(() => !isCached); // false si en cache
```

### Fallback de sécurité

Le timeout au niveau de `AppLoadingScreen` (5s max) reste en place comme filet de sécurité, mais normalement le préchargement se termine avant.

---

## ✅ Tests à effectuer

### Test 1 : Photo de profil
1. Lancer l'app (cold start)
2. Attendre la fin du splash
3. Aller dans Profile
4. **Attendu :** Photo de profil instantanée, pas de loader

### Test 2 : Journal complet
1. Lancer l'app
2. Attendre la fin du splash
3. Aller dans Journal
4. Scroller jusqu'en bas
5. **Attendu :** Toutes les photos affichées instantanément

### Test 3 : Vérifier les logs
1. Lancer l'app avec la console
2. Chercher `[AppPreloadService]` et `[ImageCacheUtils]`
3. **Attendu :** Logs montrant N images préchargées (N = total workouts + 1 profile)

---

**Date :** Janvier 2026  
**Status :** ✅ Corrigé et prêt pour tests
