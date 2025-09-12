import Foundation
import UIKit
import UserNotifications

final class PushService: NSObject {
    static let shared = PushService()

    private(set) var deviceTokenHex: String?

    func requestAuthorizationAndRegister() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                } else if let error = error {
                    print("Push authorization error: \(error)")
                }
            }
        }
    }

    func didRegisterForRemoteNotifications(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceTokenHex = token
        print("APNS token: \(token)")
        // TODO: Send token to backend
    }

    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
}

