#!/bin/bash

# Script pour suivre la progression du build sur TestFlight
# Usage: ./follow_testflight.sh

SUBMISSION_ID="388426b9-8d60-4e29-bf01-b3fadc3415d3"
APP_ID="6753813377"
BUILD_ID="c991ab34-4c23-45f2-9df1-56e464fabc9a"

echo "📱 Suivi de la progression sur TestFlight"
echo "=========================================="
echo ""
echo "✅ Build soumis avec succès!"
echo ""
echo "📊 Informations:"
echo "   - Build ID: $BUILD_ID"
echo "   - Submission ID: $SUBMISSION_ID"
echo "   - App ID: $APP_ID"
echo "   - Version: 1.0.0"
echo "   - Build Number: 26"
echo ""
echo "⏳ Le build est en cours de traitement par Apple..."
echo "   Cela prend généralement 5-10 minutes."
echo ""
echo "🔗 Liens pour suivre la progression:"
echo ""
echo "   1. Dashboard Expo (détails de la soumission):"
echo "      https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
echo ""
echo "   2. TestFlight (une fois le traitement terminé):"
echo "      https://appstoreconnect.apple.com/apps/$APP_ID/testflight/ios"
echo ""
echo "   3. App Store Connect:"
echo "      https://appstoreconnect.apple.com/apps/$APP_ID"
echo ""
echo "📝 Notes de release à ajouter dans TestFlight:"
echo "----------------------------------------------"
cat testflight_release_notes.txt
echo "----------------------------------------------"
echo ""
echo "💡 Astuce:"
echo "   - Vous recevrez un email quand le traitement sera terminé"
echo "   - Une fois disponible, vous pourrez ajouter les notes de release dans TestFlight"
echo "   - Le build sera alors disponible pour vos testeurs"
echo ""

# Option pour ouvrir les liens dans le navigateur
read -p "Voulez-vous ouvrir le dashboard Expo dans votre navigateur? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://expo.dev/accounts/hugz/projects/peak-app/submissions/$SUBMISSION_ID"
fi
