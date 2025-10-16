import Foundation
import Combine

public protocol AuthService {
    var currentUserPublisher: AnyPublisher<AppUser?, Never> { get }
    func signIn(username: String, password: String) async throws
    func signInWithOAuth(provider: OAuthProvider) async throws
    func signOut() async throws
}

public final class MockAuthService: AuthService {
    private let currentUserSubject: CurrentValueSubject<AppUser?, Never>
    private let storageKey = "auth.currentUser"

    public var currentUserPublisher: AnyPublisher<AppUser?, Never> {
        currentUserSubject.eraseToAnyPublisher()
    }

    public init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let user = try? JSONDecoder().decode(AppUser.self, from: data) {
            currentUserSubject = CurrentValueSubject(user)
        } else {
            currentUserSubject = CurrentValueSubject(nil)
        }
    }

    public func signIn(username: String, password: String) async throws {
        try await Task.sleep(nanoseconds: 300_000_000)
        let user = AppUser(id: UUID().uuidString, displayName: username)
        setCurrentUser(user)
    }

    public func signInWithOAuth(provider: OAuthProvider) async throws {
        try await Task.sleep(nanoseconds: 200_000_000)
        let display = provider == .apple ? "Apple User" : "Google User"
        let user = AppUser(id: UUID().uuidString, displayName: display)
        setCurrentUser(user)
    }

    public func signOut() async throws {
        try await Task.sleep(nanoseconds: 150_000_000)
        clearCurrentUser()
    }

    private func setCurrentUser(_ user: AppUser) {
        currentUserSubject.send(user)
        if let data = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    private func clearCurrentUser() {
        currentUserSubject.send(nil)
        UserDefaults.standard.removeObject(forKey: storageKey)
    }
}

