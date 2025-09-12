# Agent3Core iOS

Day 1 deliverable: iOS shell, OTP login scaffold, libsignal dependency, group chat UI, push notifications.

## Prerequisites
- Xcode 15+
- iOS 16+
- Swift Package Manager and XcodeGen
- Apple Developer account for APNs

## Setup
1. Install XcodeGen: `brew install xcodegen`
2. Generate the Xcode project:
```bash
cd ios/Agent3Core
xcodegen generate
open Agent3Core.xcodeproj
```
3. Configure bundle identifier and team in `project.yml`.
4. Set `aps-environment` in `Resources/Agent3Core.entitlements` as needed.
5. Enable Push Notifications capability in Signing & Capabilities.
6. In Xcode, verify SPM resolves `LibSignalClient` successfully. Clean build if needed.

## Dependencies
- LibSignalClient (SPM): `https://github.com/signalapp/libsignal-client`
  - If Xcode fails to resolve, try: File > Packages > Reset Package Caches, then clean build.

## Modules
- App shell (SwiftUI) with AppDelegate
- OTP login scaffolding (UI + ViewModel + service stub)
- Group chat UI (chat list, message list, composer)
- Push notifications manager and integration
- Signal wrapper (placeholder for day 1)

## Running
- Build and run on a device or simulator (push requires device).
  - For local testing, you can simulate incoming messages in code via:
    ```swift
    PushNotificationsManager.shared.simulateIncoming(text: "Hello from APNs")
    ```

## Notes
- Replace `PRODUCT_BUNDLE_IDENTIFIER` in `project.yml`.
 - APNs requires a real device and a valid Apple Developer profile.