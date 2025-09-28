#!/bin/bash

# Build Android production AAB for Google Play Store
set -e

echo "🚀 Building Android production AAB..."

# Clean previous builds
cd android
./gradlew clean

# Build production release AAB
./gradlew bundleProductionRelease

echo "✅ Production AAB built successfully!"
echo "📱 AAB location: android/app/build/outputs/bundle/productionRelease/app-production-release.aab"

# Verify bundle (requires bundletool)
if command -v bundletool &> /dev/null; then
    echo "🔍 Verifying AAB with bundletool..."
    bundletool build-apks --bundle=app/build/outputs/bundle/productionRelease/app-production-release.aab --output=app-production-release.apks --mode=universal
    echo "✅ AAB verification completed!"
fi

cd ..
