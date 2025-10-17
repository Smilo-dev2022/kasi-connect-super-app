import Foundation
import Combine

enum OTPServiceError: LocalizedError {
    case invalidPhone
    case network

    var errorDescription: String? {
        switch self {
        case .invalidPhone:
            return "Invalid phone number"
        case .network:
            return "Network error"
        }
    }
}

final class OTPService {
    private let baseURL = URL(string: "https://api.kasilink.example")!

    func requestOTP(phoneNumber: String) -> AnyPublisher<Void, Error> {
        guard phoneNumber.count >= 8 else {
            return Fail(error: OTPServiceError.invalidPhone).eraseToAnyPublisher()
        }
        var req = URLRequest(url: baseURL.appendingPathComponent("/auth/otp/request"))
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "channel": "sms",
            "to": phoneNumber
        ]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        return URLSession.shared.dataTaskPublisher(with: req)
            .tryMap { output -> Void in
                guard let resp = output.response as? HTTPURLResponse, (200..<300).contains(resp.statusCode) else {
                    throw OTPServiceError.network
                }
                return ()
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func verifyOTP(phoneNumber: String, code: String) -> AnyPublisher<Void, Error> {
        guard !code.isEmpty else {
            return Fail(error: OTPServiceError.network).eraseToAnyPublisher()
        }
        var req = URLRequest(url: baseURL.appendingPathComponent("/auth/otp/verify"))
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let apnsToken = UserDefaults.standard.string(forKey: "push.apns")
        var payload: [String: Any] = [
            "channel": "sms",
            "to": phoneNumber,
            "code": code
        ]
        if let apnsToken = apnsToken {
            payload["device"] = ["platform": "ios", "token": apnsToken]
        }
        req.httpBody = try? JSONSerialization.data(withJSONObject: payload)
        return URLSession.shared.dataTaskPublisher(with: req)
            .tryMap { output -> Void in
                guard let resp = output.response as? HTTPURLResponse, (200..<300).contains(resp.statusCode) else {
                    throw OTPServiceError.network
                }
                // Parse token
                if let json = try? JSONSerialization.jsonObject(with: output.data) as? [String: Any],
                   let token = json["token"] as? String {
                    UserDefaults.standard.set(token, forKey: "auth.jwt")
                }
                return ()
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}
