# Agent1 Android Chat (Compose)

An Android sample app with:
- OTP login scaffold (mock: use 123456)
- Groups list and group chat UI with in-memory messages
- Firebase Cloud Messaging integration for push notifications

## Requirements
- Android Studio Ladybug or newer
- JDK 17

## Build & Run
1. Open the project in Android Studio.
2. Sync Gradle.
3. Run the `app` configuration on a device or emulator.

## OTP Login (Mock)
- Enter any phone number (8+ digits)
- Tap "Send OTP"
- Enter `123456` and tap Verify

## Navigation
- Login -> Groups -> Chat

## Push Notifications (FCM)
This project includes Firebase Messaging. To enable push:
1. In Firebase Console, create a project and add an Android app with package `com.example.chatapp`.
2. Download `google-services.json` and place it at `app/google-services.json`.
3. Rebuild the app. The Google Services plugin is applied automatically when the file is present.
4. Get the FCM registration token from logs (filter for `FirebaseMessaging`).
5. Send a test notification from Firebase Console or via HTTPv1 API targeting the token.

Notifications post to channel `chat_default_channel`.

## Notes
- All data is in-memory; no persistence.
- UI is Jetpack Compose Material3.
