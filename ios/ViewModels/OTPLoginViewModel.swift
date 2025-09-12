import Foundation

@MainActor
final class OTPLoginViewModel: ObservableObject {
    @Published var phoneNumberE164: String = ""
    @Published var code: String = ""
    @Published var isRequesting: Bool = false
    @Published var isVerifying: Bool = false
    @Published var errorMessage: String? = nil
    @Published var otpRequested: Bool = false

    private let authService: OTPAuthServiceProtocol
    private let sessionManager: SessionManager

    init(authService: OTPAuthServiceProtocol, sessionManager: SessionManager) {
        self.authService = authService
        self.sessionManager = sessionManager
    }

    func requestOTP() async {
        errorMessage = nil
        isRequesting = true
        defer { isRequesting = false }
        do {
            try await authService.requestOTP(phoneNumberE164: phoneNumberE164)
            otpRequested = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func verify() async {
        errorMessage = nil
        isVerifying = true
        defer { isVerifying = false }
        do {
            let user = try await authService.verifyOTP(phoneNumberE164: phoneNumberE164, code: code)
            sessionManager.signIn(user: user)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

