import Foundation
import Combine

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var username: String = ""
    @Published var password: String = ""
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var currentUser: AppUser?
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var errorMessage: String?

    private let service: AuthService
    private var cancellables: Set<AnyCancellable> = []

    init(service: AuthService) {
        self.service = service
        service.currentUserPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] user in
                self?.currentUser = user
                self?.isAuthenticated = (user != nil)
            }
            .store(in: &cancellables)
    }

    func signIn() async {
        errorMessage = nil
        isLoading = true
        do {
            try await service.signIn(username: username.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signOut() async {
        isLoading = true
        do {
            try await service.signOut()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func signInWithOAuth(provider: OAuthProvider) async {
        errorMessage = nil
        isLoading = true
        do {
            try await service.signInWithOAuth(provider: provider)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

