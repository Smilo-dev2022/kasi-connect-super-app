import Foundation

protocol OTPAuthServiceProtocol {
    func requestOTP(phoneNumberE164: String) async throws
    func verifyOTP(phoneNumberE164: String, code: String) async throws -> User
}

enum AuthError: Error, LocalizedError {
    case invalidCode
    case network

    var errorDescription: String? {
        switch self {
        case .invalidCode: return "Invalid verification code"
        case .network: return "Network error"
        }
    }
}

final class MockOTPAuthService: OTPAuthServiceProtocol {
    func requestOTP(phoneNumberE164: String) async throws {
        try await Task.sleep(nanoseconds: 500_000_000)
    }

    func verifyOTP(phoneNumberE164: String, code: String) async throws -> User {
        try await Task.sleep(nanoseconds: 700_000_000)
        guard code.count >= 4 else { throw AuthError.invalidCode }
        return User(id: "me", displayName: "+" + phoneNumberE164.suffix(4), phoneNumberE164: phoneNumberE164)
    }
}

