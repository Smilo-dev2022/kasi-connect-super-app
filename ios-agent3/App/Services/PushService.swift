import Foundation
import Combine

final class PushService: ObservableObject {
    static let shared = PushService()

    @Published var apnsToken: String? = nil

    private var notificationObserver: Any?

    private init() {
        notificationObserver = NotificationCenter.default.addObserver(forName: .didUpdateAPNsToken, object: nil, queue: .main) { [weak self] note in
            self?.apnsToken = note.object as? String
        }
    }
}

