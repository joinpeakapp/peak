#!/bin/bash

# Script autonome pour créer un build et le soumettre à TestFlight

set -e

echo "🚀 Starting automated TestFlight build process..."
echo ""

# Générer les notes de release
RELEASE_NOTES="Refactor notification system:
- Dynamic notifications for scheduled workouts
- Interval workout notifications scheduled on completion
- Mixed notifications for multiple workouts same day
- Improved notification messages with pop culture references

Workout photo screen improvements:
- Full screen camera view
- Floating buttons
- Gallery photo selection
- Front camera by default

Bug fixes:
- Fixed WorkoutDetailModal icon types
- Improved notification scheduling logic"

echo "📝 Release notes prepared"
echo ""

# Lancer le build en arrière-plan et capturer l'ID
echo "🔨 Starting EAS build..."
BUILD_COMMAND="eas build --platform ios --profile production --non-interactive"

# Lancer le build et capturer la sortie
BUILD_OUTPUT=$($BUILD_COMMAND 2>&1 | tee /tmp/eas_build.log)

# Extraire l'ID du build depuis les logs ou la sortie
BUILD_ID=$(grep -o 'builds/[a-f0-9-]*' /tmp/eas_build.log | head -1 | cut -d'/' -f2 || echo "")

if [ -z "$BUILD_ID" ]; then
    # Essayer de trouver l'ID dans la sortie JSON si disponible
    BUILD_ID=$(echo "$BUILD_OUTPUT" | grep -oP '"id"\s*:\s*"[^"]*' | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$BUILD_ID" ]; then
    echo "⚠️  Could not extract build ID automatically"
    echo "📋 Build output saved to /tmp/eas_build.log"
    echo "🔗 Please check: https://expo.dev/accounts/hugz/projects/peak-app/builds"
    echo ""
    echo "Once the build is finished, run:"
    echo "  eas submit --platform ios --profile production --non-interactive --latest"
    exit 0
fi

echo "✅ Build started!"
echo "📱 Build ID: $BUILD_ID"
echo "🔗 Build URL: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
echo ""

# Fonction pour vérifier le statut
check_build_status() {
    eas build:view --id "$1" --non-interactive 2>/dev/null | grep -i "status\|finished\|errored" || echo "checking..."
}

# Attendre que le build soit terminé
echo "⏳ Waiting for build to complete (this may take 10-20 minutes)..."
echo "   You can check progress at: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
echo ""

MAX_WAIT=1200  # 20 minutes max
ELAPSED=0
CHECK_INTERVAL=60  # Vérifier toutes les minutes

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
    
    STATUS=$(check_build_status "$BUILD_ID" 2>/dev/null || echo "unknown")
    
    if echo "$STATUS" | grep -qi "finished\|completed"; then
        echo "✅ Build completed!"
        break
    elif echo "$STATUS" | grep -qi "errored\|failed\|canceled"; then
        echo "❌ Build failed!"
        echo "Check details at: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
        exit 1
    fi
    
    echo "   Still building... ($((ELAPSED / 60)) minutes elapsed)"
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "⏱️  Timeout reached. Build may still be in progress."
    echo "Check manually at: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
    exit 0
fi

# Soumettre à TestFlight
echo ""
echo "📤 Submitting to TestFlight..."
eas submit --platform ios --profile production --non-interactive --latest

echo ""
echo "✅ Build submitted to TestFlight successfully!"
echo "🎉 Check App Store Connect for processing status"
