import Foundation

@MainActor
final class OTPLoginViewModel: ObservableObject {
    @Published var phoneNumber: String = ""
    @Published var code: String = ""
    @Published var isRequestingCode: Bool = false
    @Published var isVerifying: Bool = false
    @Published var errorMessage: String?

    private let service = OTPService()

    var canRequestCode: Bool {
        phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines).count >= 8
    }

    var canVerify: Bool {
        code.trimmingCharacters(in: .whitespacesAndNewlines).count >= 4
    }

    func requestCode() async {
        errorMessage = nil
        isRequestingCode = true
        defer { isRequestingCode = false }
        do {
            try await service.requestCode(phoneNumber: phoneNumber)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func verify() async -> Bool {
        errorMessage = nil
        isVerifying = true
        defer { isVerifying = false }
        do {
            return try await service.verifyCode(phoneNumber: phoneNumber, code: code)
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}

