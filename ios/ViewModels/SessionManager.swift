import Foundation

final class SessionManager: ObservableObject {
    @Published var currentUser: User? = nil

    var isAuthenticated: Bool { currentUser != nil }

    func signIn(user: User) {
        currentUser = user
    }

    func signOut() {
        currentUser = nil
    }
}

