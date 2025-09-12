import Foundation

final class AppState: ObservableObject {
    enum Route {
        case otpLogin
        case chats
    }

    @Published var route: Route = .otpLogin

    init() {
        NotificationCenter.default.addObserver(forName: .didCompleteLogin, object: nil, queue: .main) { [weak self] _ in
            self?.route = .chats
        }
    }
}
