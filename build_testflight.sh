#!/bin/bash

# Script pour lancer un build iOS pour TestFlight
# Usage: ./build_testflight.sh

set -e

echo "🚀 Démarrage du build iOS pour TestFlight..."
echo ""
echo "📝 Notes de release:"
echo "-------------------"
cat testflight_release_notes.txt
echo ""
echo "-------------------"
echo ""

# Vérifier l'authentification
echo "🔐 Vérification de l'authentification EAS..."
if ! eas whoami &>/dev/null; then
    echo "❌ Vous n'êtes pas authentifié. Veuillez exécuter: eas login"
    exit 1
fi

echo "✅ Authentifié"
echo ""

# Lancer le build
echo "📦 Lancement du build..."
echo "   Profile: production"
echo "   Platform: ios"
echo ""

eas build --platform ios --profile production

echo ""
echo "✅ Build lancé avec succès!"
echo ""
echo "📋 Notes de release à copier dans TestFlight:"
echo "--------------------------------------------"
cat testflight_release_notes.txt
echo "--------------------------------------------"
