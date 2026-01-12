#!/bin/bash

# Script pour suivre la progression du build sur TestFlight
# Usage: ./watch_testflight.sh

set -e

SUBMISSION_ID="388426b9-8d60-4e29-bf01-b3fadc3415d3"
APP_ID="6753813377"

echo "📱 Suivi de la progression sur TestFlight"
echo "=========================================="
echo ""
echo "Submission ID: $SUBMISSION_ID"
echo "App ID: $APP_ID"
echo ""
echo "⏳ Vérification du statut..."
echo ""

# Fonction pour afficher le statut
check_status() {
    echo "🔄 $(date '+%H:%M:%S') - Vérification du statut..."
    
    # Vérifier le statut de la soumission
    STATUS=$(eas submit:list --platform ios --limit 1 --non-interactive 2>/dev/null | grep -A 5 "Status" | head -2 | tail -1 | xargs || echo "Unknown")
    
    echo "   Statut: $STATUS"
    echo ""
    
    if [[ "$STATUS" == *"finished"* ]] || [[ "$STATUS" == *"completed"* ]]; then
        echo "✅ Le build est maintenant disponible sur TestFlight!"
        echo ""
        echo "🔗 Liens utiles:"
        echo "   - TestFlight: https://appstoreconnect.apple.com/apps/$APP_ID/testflight/ios"
        echo "   - App Store Connect: https://appstoreconnect.apple.com/apps/$APP_ID"
        echo ""
        return 0
    elif [[ "$STATUS" == *"error"* ]] || [[ "$STATUS" == *"failed"* ]]; then
        echo "❌ Erreur lors du traitement"
        echo ""
        echo "🔗 Vérifiez les détails:"
        echo "   - Expo Dashboard: https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
        echo ""
        return 1
    fi
    
    return 2
}

# Boucle de vérification
COUNTER=0
MAX_CHECKS=60  # 10 minutes max (vérification toutes les 10 secondes)

while [ $COUNTER -lt $MAX_CHECKS ]; do
    check_status
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 1 ]; then
        exit $EXIT_CODE
    fi
    
    COUNTER=$((COUNTER + 1))
    echo "   Prochaine vérification dans 10 secondes... ($COUNTER/$MAX_CHECKS)"
    sleep 10
done

echo ""
echo "⏱️  Temps maximum atteint. Le traitement peut prendre jusqu'à 10-15 minutes."
echo ""
echo "🔗 Vérifiez manuellement:"
echo "   - TestFlight: https://appstoreconnect.apple.com/apps/$APP_ID/testflight/ios"
echo "   - Expo Dashboard: https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
echo ""
