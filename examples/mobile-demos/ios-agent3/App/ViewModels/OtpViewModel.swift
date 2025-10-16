import Foundation

final class OtpViewModel: ObservableObject {
    @Published var phoneNumber: String = ""
    @Published var otpCode: String = ""
    @Published var isSending: Bool = false
    @Published var isVerifying: Bool = false
    @Published var errorMessage: String? = nil

    func requestCode() async {
        guard !phoneNumber.isEmpty else { return }
        await MainActor.run { self.isSending = true; self.errorMessage = nil }
        try? await Task.sleep(nanoseconds: 500_000_000)
        await MainActor.run { self.isSending = false }
    }

    func verifyCode() async -> Bool {
        guard !otpCode.isEmpty else { return false }
        await MainActor.run { self.isVerifying = true; self.errorMessage = nil }
        try? await Task.sleep(nanoseconds: 500_000_000)
        let success = otpCode == "123456" || otpCode.count == 6
        await MainActor.run {
            self.isVerifying = false
            if !success { self.errorMessage = "Invalid code" }
        }
        return success
    }
}

