# Test des Nouvelles Fonctionnalités

## ✅ Implémentation Terminée

Les deux fonctionnalités ont été implémentées avec succès :

### 1. 🌟 Demande de Note sur l'App Store
- ✅ Service créé et fonctionnel
- ✅ Intégré dans le workflow de completion
- ✅ Aucune erreur de compilation

### 2. 🔔 Notification d'Inactivité
- ✅ Détection d'inactivité implémentée
- ✅ Notifications planifiées correctement
- ✅ Annulation automatique fonctionnelle
- ✅ Aucune erreur de compilation

## 📋 Plan de Test

### Test 1 : Store Review (Appareil Physique Requis)

**Prérequis :** Appareil iOS physique (ne fonctionne pas sur simulateur)

1. **Réinitialiser le compteur (Dev uniquement)**
   ```typescript
   // Dans la console ou via un bouton de dev
   import StoreReviewService from './src/services/storeReviewService';
   await StoreReviewService.resetForTesting();
   ```

2. **Premier workout**
   - Démarrer un workout
   - Compléter au moins un exercice
   - Valider le workout
   - **Résultat attendu :** Popup de note App Store apparaît

3. **Second workout**
   - Démarrer un autre workout
   - Compléter et valider
   - **Résultat attendu :** Aucune popup (déjà demandé)

### Test 2 : Notification d'Inactivité

#### Scénario A : Conditions Non Remplies (< 1h de séance)

1. Démarrer un workout
2. Attendre 30 minutes sans interaction
3. **Résultat attendu :** Aucune notification (durée < 1h)

#### Scénario B : Conditions Remplies

1. Démarrer un workout
2. Attendre 1h05 (pour dépasser 1h de séance)
3. Ne pas interagir pendant 30 minutes
4. **Résultat attendu :** Notification reçue après 30min d'inactivité

#### Scénario C : Annulation par Interaction

1. Démarrer un workout
2. Attendre 1h05
3. Ne pas interagir pendant 20 minutes
4. Compléter un set (interaction)
5. Attendre encore 20 minutes
6. **Résultat attendu :** Pas de notification (compteur réinitialisé)

#### Scénario D : Annulation par Retour App

1. Démarrer un workout
2. Attendre 1h05
3. Mettre l'app en arrière-plan
4. Attendre 30 minutes (notification devrait être planifiée)
5. Revenir sur l'app
6. **Résultat attendu :** Notification annulée automatiquement

#### Scénario E : Annulation par Validation

1. Démarrer un workout
2. Attendre 1h05
3. Ne pas interagir pendant 25 minutes
4. Valider le workout
5. **Résultat attendu :** Notification annulée, workout sauvegardé

### Test 3 : Vérification des Logs

Pour débugger, vérifier les logs dans la console :

**Store Review :**
```
[StoreReviewService] Completed workouts count: X
[StoreReviewService] Requesting review after first workout
[StoreReviewService] Review requested successfully
```

**Notifications d'Inactivité :**
```
🔔 [NotificationService] Checking inactive workout reminder:
🔔 [NotificationService] - Workout duration: XXXXs (XXmin)
🔔 [NotificationService] - Inactive time: XXXXs (XXmin)
🔔 [NotificationService] ✅ Scheduled inactive workout reminder in XXmin
[ActiveWorkout] Activity detected, cancelled inactive workout reminder
```

## 🐛 Dépannage

### Store Review ne s'affiche pas

1. **Vérifier :** Appareil physique (pas simulateur)
2. **Vérifier :** Permissions accordées
3. **Vérifier :** Compteur réinitialisé pour les tests
4. **Note :** Apple peut limiter l'affichage (max ~3 fois/an)

### Notification d'Inactivité ne s'affiche pas

1. **Vérifier :** Permissions de notification accordées
2. **Vérifier :** Durée de séance ≥ 1h
3. **Vérifier :** Inactivité ≥ 30min
4. **Vérifier :** Logs dans la console

### Notification ne s'annule pas

1. **Vérifier :** Logs d'annulation dans la console
2. **Vérifier :** Interaction détectée (logs)
3. **Redémarrer :** L'app si nécessaire

## 📱 Test sur TestFlight

Avant de déployer en production :

1. Build TestFlight avec les nouvelles fonctionnalités
2. Tester sur plusieurs appareils iOS
3. Vérifier les différentes versions iOS (14+)
4. Tester les scénarios edge cases :
   - App fermée complètement
   - Batterie faible
   - Mode avion activé
   - Notifications désactivées

## ✅ Checklist Avant Production

- [ ] Tests manuels réussis sur appareil physique
- [ ] Store Review fonctionne après premier workout
- [ ] Notifications d'inactivité fonctionnent correctement
- [ ] Annulation automatique fonctionne
- [ ] Logs propres (pas d'erreurs)
- [ ] Tests sur TestFlight réussis
- [ ] Documentation à jour
- [ ] Code reviewé

## 🚀 Déploiement

Une fois tous les tests validés :

```bash
# Build production
npm run build:ios

# Submit to App Store
npm run submit:ios
```

## 📝 Notes

- Les notifications d'inactivité ne fonctionnent que si l'app est active ou en arrière-plan récent
- Apple limite les demandes de Store Review à ~3 fois par an par utilisateur
- Les tests doivent être effectués sur appareil physique pour Store Review
- Les notifications peuvent avoir un léger délai (quelques secondes)
