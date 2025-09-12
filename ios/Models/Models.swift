import Foundation

struct User: Identifiable, Hashable, Codable {
    let id: String
    var displayName: String
    var phoneNumberE164: String
}

struct Message: Identifiable, Hashable, Codable {
    let id: String
    let conversationId: String
    let senderId: String
    var sentAt: Date
    var isEncrypted: Bool
    var ciphertext: String
    var plaintext: String? // Derived after decryption
}

struct Conversation: Identifiable, Hashable, Codable {
    let id: String
    var title: String
    var isGroup: Bool
    var participantIds: [String]
    var lastMessagePreview: String?
    var updatedAt: Date
}

