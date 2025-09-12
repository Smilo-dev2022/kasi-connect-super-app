import Foundation

protocol EncryptionServiceProtocol {
    func encrypt(plaintext: String, forConversation conversationId: String, senderId: String) throws -> String
    func decrypt(ciphertext: String, forConversation conversationId: String, recipientId: String) throws -> String
}

enum EncryptionError: Error {
    case notAvailable
}

final class LibSignalEncryptionService: EncryptionServiceProtocol {
    func encrypt(plaintext: String, forConversation conversationId: String, senderId: String) throws -> String {
        // Placeholder until libsignal-client wiring is implemented
        return "enc::" + Data(plaintext.utf8).base64EncodedString()
    }

    func decrypt(ciphertext: String, forConversation conversationId: String, recipientId: String) throws -> String {
        // Placeholder until libsignal-client wiring is implemented
        guard ciphertext.hasPrefix("enc::") else { return ciphertext }
        let base64 = String(ciphertext.dropFirst(5))
        guard let data = Data(base64Encoded: base64), let str = String(data: data, encoding: .utf8) else {
            return ciphertext
        }
        return str
    }
}

