import Foundation

final class ServiceContainer {
    let authService: OTPAuthServiceProtocol
    let encryptionService: EncryptionServiceProtocol
    let messagingService: MessagingServiceProtocol
    let pushService: PushService

    let sessionManager: SessionManager
    let otpLoginViewModel: OTPLoginViewModel
    let conversationsViewModel: ConversationsViewModel

    init() {
        let encryptionService: EncryptionServiceProtocol = LibSignalEncryptionService()
        let authService: OTPAuthServiceProtocol = MockOTPAuthService()
        let messagingService: MessagingServiceProtocol = InMemoryMessagingService(encryptionService: encryptionService)
        let pushService = PushService.shared

        self.encryptionService = encryptionService
        self.authService = authService
        self.messagingService = messagingService
        self.pushService = pushService

        self.sessionManager = SessionManager()
        self.otpLoginViewModel = OTPLoginViewModel(authService: authService, sessionManager: sessionManager)
        self.conversationsViewModel = ConversationsViewModel(messagingService: messagingService)
    }
}

