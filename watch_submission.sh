#!/bin/bash

# Script pour surveiller la progression de la soumission TestFlight
# Usage: ./watch_submission.sh

SUBMISSION_ID="388426b9-8d60-4e29-bf01-b3fadc3415d3"
APP_ID="6753813377"
BUILD_ID="c991ab34-4c23-45f2-9df1-56e464fabc9a"

echo "📱 Surveillance de la soumission TestFlight"
echo "============================================="
echo ""
echo "Build ID: $BUILD_ID"
echo "Submission ID: $SUBMISSION_ID"
echo ""
echo "⏳ Vérification du statut toutes les 30 secondes..."
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""
echo "🔗 Dashboard: https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
echo ""

COUNTER=0
CHECK_INTERVAL=30  # Vérifier toutes les 30 secondes
MAX_CHECKS=20      # Maximum 10 minutes (20 * 30s)

while [ $COUNTER -lt $MAX_CHECKS ]; do
    COUNTER=$((COUNTER + 1))
    TIMESTAMP=$(date '+%H:%M:%S')
    
    echo "[$TIMESTAMP] Vérification #$COUNTER..."
    
    # Vérifier le statut du build
    BUILD_STATUS=$(eas build:view "$BUILD_ID" --non-interactive 2>&1 | grep -i "status\|finished\|error" | head -3 || echo "")
    
    if [ ! -z "$BUILD_STATUS" ]; then
        echo "   $BUILD_STATUS"
    fi
    
    echo ""
    echo "💡 Le build est en cours de traitement par Apple."
    echo "   Cela peut prendre 5-10 minutes."
    echo ""
    echo "   Vérifiez manuellement:"
    echo "   - Dashboard Expo: https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
    echo "   - TestFlight: https://appstoreconnect.apple.com/apps/$APP_ID/testflight/ios"
    echo ""
    
    if [ $COUNTER -lt $MAX_CHECKS ]; then
        echo "   ⏱️  Prochaine vérification dans $CHECK_INTERVAL secondes..."
        echo ""
        sleep $CHECK_INTERVAL
    fi
done

echo ""
echo "✅ Surveillance terminée"
echo ""
echo "📋 Le build devrait être disponible sous peu sur TestFlight."
echo "   Vous recevrez un email de confirmation d'Apple."
echo ""
echo "🔗 Vérifiez maintenant:"
echo "   https://appstoreconnect.apple.com/apps/$APP_ID/testflight/ios"
echo ""
