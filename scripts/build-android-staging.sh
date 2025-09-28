#!/bin/bash

# Build Android staging AAB for closed beta testing
set -e

echo "🔨 Building Android staging AAB..."

# Clean previous builds
cd android
./gradlew clean

# Build staging release AAB
./gradlew bundleStagingRelease

echo "✅ Staging AAB built successfully!"
echo "📱 AAB location: android/app/build/outputs/bundle/stagingRelease/app-staging-release.aab"

# Optional: Install on connected device
if [ "$1" = "--install" ]; then
    echo "📲 Installing staging APK on connected device..."
    ./gradlew installStagingRelease
    echo "✅ Staging app installed!"
fi

cd ..
