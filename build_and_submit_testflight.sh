#!/bin/bash

# Script pour créer un build et le soumettre automatiquement à TestFlight

set -e

echo "🚀 Starting EAS build for TestFlight..."

# Lancer le build
BUILD_OUTPUT=$(eas build --platform ios --profile production --non-interactive --json 2>&1)
BUILD_ID=$(echo "$BUILD_OUTPUT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$BUILD_ID" ]; then
    echo "❌ Failed to get build ID. Output:"
    echo "$BUILD_OUTPUT"
    exit 1
fi

echo "✅ Build started with ID: $BUILD_ID"
echo "📱 Build URL: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"

# Attendre que le build soit terminé
echo "⏳ Waiting for build to complete..."
while true; do
    BUILD_STATUS=$(eas build:view --id "$BUILD_ID" --json 2>/dev/null | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "unknown")
    
    if [ "$BUILD_STATUS" = "finished" ]; then
        echo "✅ Build completed successfully!"
        break
    elif [ "$BUILD_STATUS" = "errored" ] || [ "$BUILD_STATUS" = "canceled" ]; then
        echo "❌ Build failed with status: $BUILD_STATUS"
        exit 1
    fi
    
    echo "   Current status: $BUILD_STATUS"
    sleep 30
done

# Soumettre à TestFlight
echo "📤 Submitting to TestFlight..."
eas submit --platform ios --profile production --non-interactive --latest

echo "✅ Build submitted to TestFlight successfully!"
echo "🎉 You can check the status on App Store Connect"
