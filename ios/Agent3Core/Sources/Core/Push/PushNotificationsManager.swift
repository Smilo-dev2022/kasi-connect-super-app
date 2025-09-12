import Foundation
import UserNotifications
import UIKit

final class PushNotificationsManager: NSObject, ObservableObject {
    static let shared = PushNotificationsManager()

    static let incomingMessageNotification = Notification.Name("PushIncomingMessage")

    @Published private(set) var deviceTokenString: String?

    func configure() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("Push auth error: \(error)")
            }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func didRegister(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        deviceTokenString = token
        NotificationCenter.default.post(name: Self.incomingMessageNotification, object: nil, userInfo: ["type": "token", "token": token])
        print("APNs token: \(token)")
    }

    func didFailToRegister(error: Error) {
        print("APNs registration failed: \(error)")
    }

    func handleForeground(notification: UNNotification) {
        postIncoming(userInfo: notification.request.content.userInfo)
    }

    func handleResponse(response: UNNotificationResponse) {
        postIncoming(userInfo: response.notification.request.content.userInfo)
    }

    private func postIncoming(userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(name: Self.incomingMessageNotification, object: nil, userInfo: userInfo)
    }

    // Utility to simulate an incoming push for local testing
    func simulateIncoming(text: String) {
        NotificationCenter.default.post(name: Self.incomingMessageNotification, object: nil, userInfo: ["text": text])
    }
}

