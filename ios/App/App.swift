import SwiftUI

@main
struct Agent3ChatApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    private let container = ServiceContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(container.sessionManager)
                .environmentObject(container.otpLoginViewModel)
                .environmentObject(container.conversationsViewModel)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var sessionManager: SessionManager
    @EnvironmentObject var conversationsViewModel: ConversationsViewModel

    var body: some View {
        Group {
            if sessionManager.isAuthenticated {
                ConversationsListView()
                    .environmentObject(conversationsViewModel)
            } else {
                OTPLoginView()
            }
        }
    }
}
