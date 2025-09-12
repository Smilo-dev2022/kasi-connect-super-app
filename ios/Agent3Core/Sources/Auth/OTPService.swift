import Foundation

enum OTPError: LocalizedError {
    case invalidNumber
    case invalidCode

    var errorDescription: String? {
        switch self {
        case .invalidNumber: return "Invalid phone number"
        case .invalidCode: return "Invalid code"
        }
    }
}

struct OTPService {
    func requestCode(phoneNumber: String) async throws {
        try await Task.sleep(nanoseconds: 400_000_000)
        guard phoneNumber.count >= 8 else { throw OTPError.invalidNumber }
    }

    func verifyCode(phoneNumber: String, code: String) async throws -> Bool {
        try await Task.sleep(nanoseconds: 400_000_000)
        guard code.count >= 4 else { throw OTPError.invalidCode }
        return true
    }
}

