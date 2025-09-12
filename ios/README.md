# Agent3 iOS

Requirements:
- Xcode 15+
- iOS 16+
- XcodeGen (brew install xcodegen)

Setup:
1. Generate the project:
```
cd ios && xcodegen generate --spec project.yml
```
2. Open `ChatApp.xcodeproj` in Xcode and run on a device/simulator.

Notes:
- Push notifications are enabled (development). Update `aps-environment` for release builds.
- OTP is a scaffold; integrate your backend or Firebase as needed.
- `libsignal` is declared via Swift Package Manager. Adjust version/branch if needed.