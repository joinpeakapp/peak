#!/bin/bash

# Script pour monitorer un build EAS et le soumettre automatiquement à TestFlight

BUILD_ID=$1

if [ -z "$BUILD_ID" ]; then
    echo "Usage: $0 <build-id>"
    echo "Or run without args to get latest build ID"
    
    # Récupérer le dernier build
    echo ""
    echo "Fetching latest build..."
    LATEST_BUILD=$(eas build:list --platform ios --limit 1 --non-interactive 2>/dev/null | grep -E "buildNumber|id" | head -2)
    echo "$LATEST_BUILD"
    exit 0
fi

echo "📱 Monitoring build: $BUILD_ID"
echo "🔗 URL: https://expo.dev/accounts/hugz/projects/peak-app/builds/$BUILD_ID"
echo ""

MAX_WAIT=1200  # 20 minutes
ELAPSED=0
CHECK_INTERVAL=60

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
    
    echo "[$((ELAPSED / 60))min] Checking build status..."
    
    BUILD_INFO=$(eas build:view --id "$BUILD_ID" --non-interactive 2>/dev/null)
    
    if echo "$BUILD_INFO" | grep -qi "finished\|completed"; then
        echo "✅ Build completed successfully!"
        echo ""
        echo "📤 Submitting to TestFlight..."
        eas submit --platform ios --profile production --non-interactive --latest
        echo ""
        echo "✅ Submitted to TestFlight!"
        exit 0
    elif echo "$BUILD_INFO" | grep -qi "errored\|failed\|canceled"; then
        echo "❌ Build failed!"
        echo "$BUILD_INFO"
        exit 1
    fi
done

echo "⏱️  Timeout reached. Please check manually."
