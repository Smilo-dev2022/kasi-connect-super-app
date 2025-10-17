import UIKit
import UserNotifications

final class PushNotificationManager: NSObject, UNUserNotificationCenterDelegate {
    func configure() {
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if let error = error {
                print("[Push] Authorization error: \(error)")
            }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
            print("[Push] Authorization granted: \(granted)")
        }
    }

    func updateDeviceToken(_ deviceToken: Data) {
        let tokenParts = deviceToken.map { data in String(format: "%02.2hhx", data) }
        let token = tokenParts.joined()
        print("[Push] APNs token: \(token)")
        // Send token to backend devices endpoint (best-effort)
        if let jwt = UserDefaults.standard.string(forKey: "auth.jwt"),
           let url = URL(string: "https://api.kasilink.example/devices") {
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.addValue("application/json", forHTTPHeaderField: "Content-Type")
            req.addValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
            let body: [String: Any] = [
                "platform": "ios",
                "token": token
            ]
            req.httpBody = try? JSONSerialization.data(withJSONObject: body, options: [])
            let task = URLSession.shared.dataTask(with: req) { _, _, _ in }
            task.resume()
        }
    }

    // Foreground notification handling
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }
}
