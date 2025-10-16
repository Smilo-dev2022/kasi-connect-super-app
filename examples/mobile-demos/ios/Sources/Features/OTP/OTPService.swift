import Foundation
import Combine

enum OTPServiceError: LocalizedError {
    case invalidPhone
    case network

    var errorDescription: String? {
        switch self {
        case .invalidPhone:
            return "Invalid phone number"
        case .network:
            return "Network error"
        }
    }
}

final class OTPService {
    func requestOTP(phoneNumber: String) -> AnyPublisher<Void, Error> {
        guard phoneNumber.count >= 8 else {
            return Fail(error: OTPServiceError.invalidPhone).eraseToAnyPublisher()
        }
        // Placeholder: integrate actual backend or Firebase later
        return Just(()).delay(for: .milliseconds(500), scheduler: DispatchQueue.global()).setFailureType(to: Error.self).eraseToAnyPublisher()
    }

    func verifyOTP(phoneNumber: String, code: String) -> AnyPublisher<Void, Error> {
        guard !code.isEmpty else {
            return Fail(error: OTPServiceError.network).eraseToAnyPublisher()
        }
        return Just(()).delay(for: .milliseconds(500), scheduler: DispatchQueue.global()).setFailureType(to: Error.self).eraseToAnyPublisher()
    }
}
