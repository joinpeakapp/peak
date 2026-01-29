# ⚡ Build TestFlight - Commandes Rapides

## 🚀 Option 1 : Script automatique (Recommandé)

```bash
./build-testflight.sh
```

Le script va :
- ✅ Vérifier l'état Git
- ✅ Proposer de commiter les changements
- ✅ Lancer le build avec auto-submit

---

## 🚀 Option 2 : Commandes manuelles

### Étape 1 : Commiter (optionnel mais recommandé)

```bash
git add .
git commit -m "feat: Optimize image preloading and splash screen

- Add profile photo to preload
- Remove timeout on image preload (load all images)
- Fix loader visibility on profile photo
- Optimize FlatList rendering in Journal
- Simplify splash screen (logo only)"
```

### Étape 2 : Build + Auto-submit

```bash
eas build --platform ios --profile preview --auto-submit
```

**Ou avec npm :**

```bash
npm run build:ios:preview
# Puis après le build :
npm run submit:ios
```

---

## ⏱️ Timeline

1. **Build démarre** → 0 min
2. **Build en cours** → 10-20 min
3. **Email de notification** → Build terminé
4. **Soumission TestFlight** → Automatique (si --auto-submit)
5. **Disponible sur TestFlight** → ~30 min après soumission

---

## 📧 Notifications

Vous recevrez un email quand :
- ✅ Le build démarre
- ✅ Le build est terminé
- ✅ La soumission à TestFlight est terminée

---

## 🔗 Suivre le build

- **Dashboard EAS** : https://expo.dev
- **App Store Connect** : https://appstoreconnect.apple.com

---

## ✅ Checklist après le build

- [ ] Build terminé avec succès
- [ ] Email de notification reçu
- [ ] Build visible dans App Store Connect > TestFlight
- [ ] Tester le splash screen (logo uniquement)
- [ ] Tester la photo de profil (instantanée, pas de loader)
- [ ] Tester le journal (toutes les photos chargées)
- [ ] Vérifier les logs console pour le préchargement

---

**Prêt à lancer ?** Exécutez `./build-testflight.sh` ou les commandes ci-dessus ! 🚀
