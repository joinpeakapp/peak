# 🚀 Guide de Build TestFlight - Optimisations Préchargement

## 📋 Prérequis

- ✅ EAS CLI installé et configuré
- ✅ Compte Apple Developer actif
- ✅ Certificats iOS configurés dans EAS
- ✅ Modifications commitées (ou prêtes à être commitées)

---

## 🔍 Vérifications avant le build

### 1. Vérifier les changements

```bash
git status
git diff
```

### 2. Vérifier la version dans app.json

La version actuelle est `1.0.0`. EAS va auto-incrémenter le build number.

---

## 🏗️ Option 1 : Build Preview (Recommandé pour TestFlight)

Le profil `preview` est optimisé pour les builds internes/TestFlight.

### Commande

```bash
npm run build:ios:preview
```

**Ou directement :**

```bash
eas build --platform ios --profile preview
```

### Avantages
- ✅ Distribution interne (TestFlight)
- ✅ Build plus rapide
- ✅ Pas de soumission automatique à l'App Store

---

## 🏗️ Option 2 : Build Production

Si vous voulez un build production avec auto-increment.

### Commande

```bash
npm run build:ios
```

**Ou directement :**

```bash
eas build --platform ios --profile production
```

### Avantages
- ✅ Auto-increment du build number
- ✅ Configuration Release optimisée
- ✅ Prêt pour soumission App Store si besoin

---

## 📤 Soumission à TestFlight

### Option A : Soumission automatique après build

Ajoutez `--auto-submit` à la commande :

```bash
eas build --platform ios --profile preview --auto-submit
```

### Option B : Soumission manuelle

1. **Attendre la fin du build** (vous recevrez un email ou notification)

2. **Soumettre manuellement :**

```bash
npm run submit:ios
```

**Ou directement :**

```bash
eas submit --platform ios --profile production
```

---

## 🔄 Workflow complet recommandé

### Étape 1 : Commit des changements

```bash
git add .
git commit -m "feat: Optimize image preloading and splash screen

- Add profile photo to preload
- Remove timeout on image preload (load all images)
- Fix loader visibility on profile photo
- Optimize FlatList rendering in Journal
- Simplify splash screen (logo only)"
```

### Étape 2 : Build Preview

```bash
npm run build:ios:preview
```

**Ou avec auto-submit :**

```bash
eas build --platform ios --profile preview --auto-submit
```

### Étape 3 : Suivre le build

- Le build démarre sur les serveurs EAS
- Vous recevrez un email quand c'est prêt
- Ou suivez sur : https://expo.dev/accounts/[votre-compte]/projects/peak-app/builds

### Étape 4 : Vérifier sur TestFlight

1. Aller sur App Store Connect
2. Vérifier que le build apparaît dans TestFlight
3. Ajouter des testeurs si nécessaire
4. Tester !

---

## 📝 Notes importantes

### Version et Build Number

- **Version** (`app.json`): `1.0.0` (version de l'app)
- **Build Number**: Auto-incrémenté par EAS (1, 2, 3...)

Si vous voulez changer la version :

```json
// app.json
{
  "expo": {
    "version": "1.0.1" // Incrémenter ici
  }
}
```

### Profil Preview vs Production

| Aspect | Preview | Production |
|--------|--------|------------|
| Distribution | Internal (TestFlight) | App Store + TestFlight |
| Build time | Plus rapide | Normal |
| Auto-increment | Non | Oui |
| Optimisations | Standard | Release optimisé |

**Recommandation :** Utilisez `preview` pour TestFlight, `production` pour App Store.

---

## 🧪 Tests à effectuer sur TestFlight

### Test 1 : Splash Screen
- [ ] Logo s'affiche correctement
- [ ] Pas de messages/barre de progression
- [ ] Fermeture rapide après préchargement

### Test 2 : Photo de profil
- [ ] Photo affichée instantanément
- [ ] Pas de loader visible
- [ ] Photo correcte (pas de placeholder)

### Test 3 : Journal
- [ ] Toutes les photos s'affichent (pas seulement les 5 premières)
- [ ] Scroll fluide
- [ ] Pas de blank spaces
- [ ] Anciennes photos visibles au scroll

### Test 4 : Performance
- [ ] Préchargement complet avant fermeture du splash
- [ ] Pas de timeout prématuré
- [ ] Logs console montrent toutes les images préchargées

---

## 🐛 En cas de problème

### Build échoue

```bash
# Voir les logs détaillés
eas build:list
eas build:view [build-id]
```

### Soumission échoue

```bash
# Vérifier les certificats
eas credentials

# Re-soumettre
eas submit --platform ios --profile production
```

### Build trop long

- Les builds iOS prennent généralement 10-20 minutes
- Si > 30 minutes, vérifier les logs

---

## 📊 Checklist finale

- [ ] Code commité
- [ ] Version vérifiée dans app.json
- [ ] Build lancé (`npm run build:ios:preview`)
- [ ] Build terminé avec succès
- [ ] Soumission à TestFlight (auto ou manuelle)
- [ ] Build visible dans App Store Connect
- [ ] Tests effectués sur TestFlight

---

## 🎯 Commandes rapides

```bash
# Build Preview + Auto-submit
eas build --platform ios --profile preview --auto-submit

# Build Production
npm run build:ios

# Soumission manuelle
npm run submit:ios

# Voir les builds
eas build:list

# Voir les logs d'un build
eas build:view [build-id]
```

---

**Date :** Janvier 2026  
**Build pour :** Optimisations préchargement images  
**Status :** ✅ Prêt pour build
