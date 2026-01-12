#!/bin/bash

# Script pour soumettre le dernier build à TestFlight

echo "📤 Submitting latest iOS build to TestFlight..."

eas submit --platform ios --profile production --non-interactive --latest

echo ""
echo "✅ Submission completed!"
echo "🎉 Check App Store Connect for processing status"
