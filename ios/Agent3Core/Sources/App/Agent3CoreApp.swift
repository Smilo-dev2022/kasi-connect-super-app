import SwiftUI

@main
struct Agent3CoreApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
    }
}

private struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.isAuthenticated {
                GroupChatView()
            } else {
                OTPLoginView {
                    appState.isAuthenticated = true
                }
            }
        }
    }
}

