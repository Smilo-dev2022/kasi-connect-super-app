import SwiftUI
import UIKit

final class ServiceContainer: ObservableObject {
    let authService: AuthService
    let chatService: ChatService

    init(authService: AuthService, chatService: ChatService) {
        self.authService = authService
        self.chatService = chatService
    }
}

@main
struct ChatApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var services: ServiceContainer
    @StateObject private var authViewModel: AuthViewModel

    init() {
        let services = ServiceContainer(
            authService: MockAuthService(),
            chatService: MockChatService()
        )
        _services = StateObject(wrappedValue: services)
        _authViewModel = StateObject(wrappedValue: AuthViewModel(service: services.authService))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(services)
                .environmentObject(authViewModel)
        }
    }
}
