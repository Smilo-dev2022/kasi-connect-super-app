import SwiftUI
import UIKit

final class ServiceContainer: ObservableObject {
    let authService: AuthService
    let chatService: ChatService
    let mediaUploadService: MediaUploadService

    init(authService: AuthService, chatService: ChatService, mediaUploadService: MediaUploadService) {
        self.authService = authService
        self.chatService = chatService
        self.mediaUploadService = mediaUploadService
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
            chatService: MockChatService(),
            mediaUploadService: MockMediaUploadService()
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
