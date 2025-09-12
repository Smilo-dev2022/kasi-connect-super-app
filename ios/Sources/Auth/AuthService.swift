import Foundation

final class AuthService: ObservableObject {
    @Published private(set) var isAuthenticated: Bool = false
    @Published private(set) var currentUser: User? = nil

    private let storedUsernameKey = "CommunityApp.username"

    init() {
        if let username = UserDefaults.standard.string(forKey: storedUsernameKey), !username.isEmpty {
            let restoredUser = User(id: UUID().uuidString, username: username, displayName: username)
            currentUser = restoredUser
            isAuthenticated = true
        }
    }

    @MainActor
    func signIn(username: String, password: String) async throws {
        try await Task.sleep(nanoseconds: 300_000_000)
        guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !password.isEmpty else {
            throw AuthError.invalidCredentials
        }
        let authenticatedUser = User(id: UUID().uuidString, username: username, displayName: username)
        currentUser = authenticatedUser
        isAuthenticated = true
        UserDefaults.standard.set(username, forKey: storedUsernameKey)
    }

    @MainActor
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: storedUsernameKey)
    }
}

enum AuthError: LocalizedError {
    case invalidCredentials

    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Please enter a valid username and password."
        }
    }
}