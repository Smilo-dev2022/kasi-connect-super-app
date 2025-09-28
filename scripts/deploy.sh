#!/bin/bash

# iKasiLink Deployment Script
# Deploys the application to production

set -e

echo "🚀 Deploying iKasiLink to Production..."

# Check if deployment directory exists
if [ ! -d "deployment" ]; then
    echo "❌ Deployment directory not found. Run build-production.sh first."
    exit 1
fi

# Deploy web application (example for AWS S3)
if [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "📦 Deploying web application to S3..."
    aws s3 sync deployment/web/ s3://$AWS_S3_BUCKET --delete
    echo "✅ Web application deployed to S3"
fi

# Deploy Android to Google Play (example)
if [ ! -z "$GOOGLE_PLAY_SERVICE_ACCOUNT" ] && [ -f "deployment/android/app-release.apk" ]; then
    echo "📱 Deploying Android to Google Play..."
    # Add Google Play deployment commands here
    echo "✅ Android application ready for Google Play"
fi

echo "🎉 Deployment completed successfully!"
