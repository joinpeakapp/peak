# Peak App

Une application mobile de suivi d'entraînement construite avec React Native et Expo.

## Fonctionnalités

- 📱 Interface utilisateur moderne et intuitive
- 💪 Suivi des workouts et des exercices
- 🔥 Système de streak pour motiver la régularité
- 📊 Suivi des records personnels
- 🎯 Catégorisation des exercices par partie du corps
- 💾 Stockage local des données

## Technologies Utilisées

- React Native
- Expo
- TypeScript
- Redux Toolkit
- Jest & React Testing Library

## Installation

1. Cloner le repository :
```bash
git clone https://github.com/votre-username/peak-app.git
cd peak-app
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer l'application :
```bash
npm start
```

## Structure du Projet

```
src/
├── components/     # Composants réutilisables
├── hooks/         # Custom hooks
├── navigation/    # Configuration de la navigation
├── screens/       # Écrans de l'application
├── store/         # Configuration Redux
├── types/         # Types TypeScript
└── utils/         # Fonctions utilitaires
```

## Tests

L'application utilise Jest et React Testing Library pour les tests unitaires et d'intégration.

Pour lancer les tests :
```bash
npm test
```

Pour lancer les tests en mode watch :
```bash
npm run test:watch
```

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 