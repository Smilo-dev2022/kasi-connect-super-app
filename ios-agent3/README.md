Agent3 iOS (SwiftUI)

Day 1: iOS shell, OTP login scaffold, libsignal-client dep, group chat UI, push.

Prereqs
- Xcode 15+
- XcodeGen (brew install xcodegen)

Generate and open project
```bash
cd ios-agent3
xcodegen generate
open Agent3.xcodeproj
```

Configure
- Set bundle id/team in `project.yml`.
- Ensure `App/Agent3.entitlements` has correct `aps-environment`.
- On launch, app requests push permission and prints APNs token in console.

OTP
- Demo accepts any 6-digit code (or 123456) as success.

Group Chat UI
- Basic chat list and group thread with bubbles and composer.

libsignal-client
- Declared via SPM in `project.yml` as `LibSignalClient` product.
- Wrapper stub in `App/Services/SignalService.swift` with conditional import.

