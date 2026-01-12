#!/bin/bash

# Script pour vérifier le statut du dernier build et le soumettre automatiquement

echo "🔍 Checking latest iOS build status..."
echo ""

# Récupérer le dernier build (on utilise eas build:list avec format simple)
LATEST_BUILD_INFO=$(eas build:list --platform ios --limit 1 --non-interactive 2>&1)

# Extraire l'ID du build depuis la sortie
BUILD_ID=$(echo "$LATEST_BUILD_INFO" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)

if [ -z "$BUILD_ID" ]; then
    echo "⚠️  Could not find build ID. Checking build status page..."
    echo "🔗 https://expo.dev/accounts/hugz/projects/peak-app/builds"
    echo ""
    echo "You can manually submit with:"
    echo "  ./submit_latest_build.sh"
    exit 0
fi

echo "📱 Found build ID: $BUILD_ID"
echo "🔗 Build URL: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
echo ""

# Vérifier le statut
BUILD_STATUS=$(eas build:view --id "$BUILD_ID" --non-interactive 2>&1 | grep -i "status" | head -1 || echo "unknown")

echo "📊 Build status: $BUILD_STATUS"
echo ""

if echo "$BUILD_STATUS" | grep -qi "finished\|completed"; then
    echo "✅ Build is finished! Submitting to TestFlight..."
    echo ""
    eas submit --platform ios --profile production --non-interactive --latest
    echo ""
    echo "✅ Submitted to TestFlight successfully!"
elif echo "$BUILD_STATUS" | grep -qi "in progress\|queued\|started"; then
    echo "⏳ Build is still in progress..."
    echo "   Run this script again later to check status and submit automatically"
    echo "   Or monitor at: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
elif echo "$BUILD_STATUS" | grep -qi "errored\|failed"; then
    echo "❌ Build failed. Check details at the URL above."
    exit 1
else
    echo "ℹ️  Unknown status. Check manually at the URL above."
fi
