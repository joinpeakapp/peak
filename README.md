# Peak - Mobile Workout Tracking App

A mobile application built with Expo and React Native for tracking workouts, displaying workout details, rewards, photos, and progress journal.

## Features

- Track workouts and exercises
- View workout history and details
- Add photos to workouts
- Track progress over time
- Modern and intuitive UI

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac users) or Android Studio (for Android development)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your device:
   - Install the Expo Go app on your iOS or Android device
   - Scan the QR code that appears in the terminal
   - Or press 'i' for iOS simulator or 'a' for Android emulator

## Project Structure

```
src/
├── assets/         # Images, fonts, and other static files
├── components/     # Reusable UI components
├── constants/      # App-wide constants and configuration
├── hooks/          # Custom React hooks
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── services/       # API and other services
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Development

- The app uses TypeScript for type safety
- Follow the established project structure for new features
- Use functional components with hooks
- Implement proper error handling
- Add tests for new features

## Testing

Run tests:
```bash
npm test
```

## Building for Production

1. Configure app.json with your app details
2. Build for iOS:
```bash
expo build:ios
```

3. Build for Android:
```bash
expo build:android
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 