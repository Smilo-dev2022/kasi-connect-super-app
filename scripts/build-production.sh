#!/bin/bash

# iKasiLink Production Build Script
# This script builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting iKasiLink Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf build/
rm -rf android/app/build/
rm -rf ios/build/

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Run type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Run linting
print_status "Running ESLint..."
npm run lint

# Run tests
print_status "Running tests..."
npm run test:run

# Build web application
print_status "Building web application..."
npm run build:prod

# Verify web build
if [ ! -d "dist" ]; then
    print_error "Web build failed - dist directory not found"
    exit 1
fi

print_status "Web build completed successfully!"

# Build Android (if Android SDK is available)
if command -v gradle &> /dev/null; then
    print_status "Building Android application..."
    cd android
    ./gradlew clean
    ./gradlew assembleRelease
    cd ..
    
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        print_status "Android build completed successfully!"
    else
        print_warning "Android build may have failed - APK not found"
    fi
else
    print_warning "Gradle not found - skipping Android build"
fi

# Build iOS (if Xcode is available)
if command -v xcodebuild &> /dev/null; then
    print_status "Building iOS application..."
    cd ios
    xcodebuild -workspace Agent3Core.xcworkspace -scheme Agent3Core -configuration Release -destination generic/platform=iOS
    cd ..
    print_status "iOS build completed successfully!"
else
    print_warning "Xcode not found - skipping iOS build"
fi

# Create deployment package
print_status "Creating deployment package..."
mkdir -p deployment
cp -r dist/ deployment/web/
cp -r android/app/build/outputs/apk/release/ deployment/android/ 2>/dev/null || true
cp -r ios/build/ deployment/ios/ 2>/dev/null || true

# Create deployment info
cat > deployment/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(node -p "require('./package.json').version")",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

print_status "Build completed successfully! 🎉"
print_status "Deployment files are in the 'deployment' directory"
print_status "Build info saved to deployment/build-info.json"

# Display build summary
echo ""
echo "📊 Build Summary:"
echo "=================="
echo "Web: ✅ Built to deployment/web/"
if [ -d "deployment/android" ]; then
    echo "Android: ✅ Built to deployment/android/"
else
    echo "Android: ⚠️  Not built (Gradle not available)"
fi
if [ -d "deployment/ios" ]; then
    echo "iOS: ✅ Built to deployment/ios/"
else
    echo "iOS: ⚠️  Not built (Xcode not available)"
fi
echo ""
echo "🚀 Ready for deployment!"
