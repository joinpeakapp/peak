#!/bin/bash

# Script simple pour vérifier rapidement le statut sur TestFlight
# Usage: ./check_testflight_status.sh

echo "📱 Statut du build sur TestFlight"
echo "=================================="
echo ""

# Vérifier les soumissions récentes
echo "📋 Dernières soumissions:"
eas submit:list --platform ios --limit 3 --non-interactive 2>&1 | grep -A 10 "Submission\|Status\|Build" || echo "Aucune soumission trouvée"

echo ""
echo "🔗 Liens utiles:"
echo "   - TestFlight: https://appstoreconnect.apple.com/apps/6753813377/testflight/ios"
echo "   - Expo Dashboard: https://expo.dev/accounts/hugz/projects/peak-app/submissions"
echo ""
