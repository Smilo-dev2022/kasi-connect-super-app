# ChatApp iOS

SwiftUI iOS app shell with auth and chat UI, generated via XcodeGen.

## Prerequisites
- Xcode 15+
- XcodeGen installed (brew install xcodegen)

## Generate Xcode project
```bash
cd ios
xcodegen generate
open ChatApp.xcodeproj
```

## Run
- Select a simulator with iOS 16+
- Build and run

## Structure
- Sources/App: App entry and DI container
- Sources/Models: Core data models
- Sources/Services: Protocols and mock services (Auth, Chat)
- Sources/ViewModels: ObservableObject VMs
- Sources/Views: SwiftUI screens (Login, ChatList, ChatThread, Tabs)
- Resources/Info.plist: App Info

## Notes
- Auth uses a mock with basic persistence via UserDefaults
- OAuth buttons are stubbed and non-networked
- Chat uses in-memory mock streams via Combine