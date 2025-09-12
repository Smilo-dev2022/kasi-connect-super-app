import Foundation
import Combine

final class OTPLoginViewModel: ObservableObject {
    @Published var phoneNumber: String = ""
    @Published var otpCode: String = ""
    @Published var isRequesting: Bool = false
    @Published var isVerifying: Bool = false
    @Published var errorMessage: String?

    private var cancellables: Set<AnyCancellable> = []
    private let service = OTPService()
    var onVerified: (() -> Void)?

    func requestOTP() {
        errorMessage = nil
        isRequesting = true
        service.requestOTP(phoneNumber: phoneNumber)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isRequesting = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { _ in }
            .store(in: &cancellables)
    }

    func verifyOTP() {
        errorMessage = nil
        isVerifying = true
        service.verifyOTP(phoneNumber: phoneNumber, code: otpCode)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isVerifying = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                } else {
                    self?.onVerified?()
                }
            } receiveValue: { _ in }
            .store(in: &cancellables)
    }
}

extension Notification.Name {}
