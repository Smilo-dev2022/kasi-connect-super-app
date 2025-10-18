# iKasiLink Mobile Release Guide

This document summarizes the steps to ship Android and iOS releases.

## Prerequisites
- Node 18+, Ruby (CocoaPods), Xcode (for iOS), Android Studio/SDK (for Android)
- React Native CLI environment set up per https://reactnative.dev/docs/environment-setup
- Production API/Sentry endpoints in `iKasiLinkMobileApp/.env`

## GPG (for project verification)
- Fingerprint: BA8F 1C98 586D 71E0 7A4D  CE8F 5F25 0BEE 99B2 C860
- Public key (web): `/.well-known/pgp-key.txt` on production domain

## Android (Google Play)
1. Signing
   - Create a release keystore (do not commit):
     - `keytool -genkey -v -keystore release.keystore -alias upload -keyalg RSA -keysize 4096 -validity 10000`
   - Provide credentials via environment variables (CI) or `android/keystore.properties` (local):
     - `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
     - or set `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD` in `android/gradle.properties` (local only)
2. Build AAB
   - `cd iKasiLinkMobileApp`
   - `./android/gradlew bundleRelease`
   - Output: `android/app/build/outputs/bundle/release/app-release.aab`
3. Play Console submission
   - Go to Google Play Console > Select app > Production > Create new release
   - Upload the `.aab`, add release notes, review, and submit for review

## iOS (App Store Connect)
1. Bundle Identifier & Signing
   - Bundle ID: `com.ikasiconnectkc.kasilink` (update in Xcode if needed)
   - Configure signing team/profiles in Xcode (Automatic Signing recommended initially)
2. Pods install
   - `cd iKasiLinkMobileApp/ios`
   - `bundle install && bundle exec pod install`
3. Archive and upload
   - Open `iKasiLinkMobileApp/ios/KasiLinkMobile.xcworkspace` in Xcode
   - Product > Archive > Distribute App (App Store Connect)
4. App Store Connect submission
   - In App Store Connect, create/select the app, add screenshots/metadata, and submit for review

## Fastlane
- iOS build lane:
  - `cd iKasiLinkMobileApp && bundle exec fastlane ios build`
- Android build lane:
  - `cd iKasiLinkMobileApp && bundle exec fastlane android build`

## Environment variables
- `API_BASE_URL`, `SOCKET_URL`, `SENTRY_DSN` in `.env`
- For production, ensure these point to live services.

## Verification checklist
- [ ] App version bumped (Android `versionCode`/`versionName`, iOS `CURRENT_PROJECT_VERSION`/`MARKETING_VERSION`)
- [ ] Release notes prepared
- [ ] API and socket endpoints configured for production
- [ ] GPG public key reachable on production domain
