#!/bin/bash

# Script pour soumettre le build à TestFlight avec suivi de progression
# Usage: ./submit_testflight.sh

set -e

echo "📱 Soumission du build à TestFlight..."
echo ""

# Récupérer le dernier build terminé
echo "🔍 Recherche du dernier build terminé..."
LATEST_BUILD=$(eas build:list --platform ios --limit 1 --non-interactive --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$LATEST_BUILD" ]; then
    echo "❌ Aucun build terminé trouvé. Veuillez attendre que le build soit terminé."
    exit 1
fi

echo "✅ Build trouvé: $LATEST_BUILD"
echo ""

# Afficher les notes de release
echo "📝 Notes de release qui seront utilisées:"
echo "----------------------------------------"
cat testflight_release_notes.txt
echo "----------------------------------------"
echo ""

# Soumettre à TestFlight avec suivi
echo "🚀 Soumission en cours..."
echo ""

eas submit --platform ios --profile production --latest --non-interactive

echo ""
echo "✅ Soumission terminée!"
echo ""
echo "📋 Vous pouvez suivre la progression dans App Store Connect:"
echo "   https://appstoreconnect.apple.com/apps/6753813377/testflight"
