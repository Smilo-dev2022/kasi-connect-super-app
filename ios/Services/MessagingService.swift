import Foundation

protocol MessagingServiceProtocol {
    func loadConversations() async throws -> [Conversation]
    func createGroup(title: String, participantIds: [String]) async throws -> Conversation
    func sendMessage(conversationId: String, senderId: String, text: String) async throws -> Message
    func loadMessages(conversationId: String) async throws -> [Message]
}

final class InMemoryMessagingService: MessagingServiceProtocol {
    private let encryptionService: EncryptionServiceProtocol
    private var conversationsById: [String: Conversation] = [:]
    private var messagesByConversationId: [String: [Message]] = [:]

    init(encryptionService: EncryptionServiceProtocol) {
        self.encryptionService = encryptionService
        seed()
    }

    private func seed() {
        let c1 = Conversation(id: UUID().uuidString, title: "General", isGroup: true, participantIds: ["me", "u1", "u2"], lastMessagePreview: "Welcome to Agent3", updatedAt: Date())
        conversationsById[c1.id] = c1
        messagesByConversationId[c1.id] = []
    }

    func loadConversations() async throws -> [Conversation] {
        try await Task.sleep(nanoseconds: 200_000_000)
        return conversationsById.values.sorted { $0.updatedAt > $1.updatedAt }
    }

    func createGroup(title: String, participantIds: [String]) async throws -> Conversation {
        let conv = Conversation(id: UUID().uuidString, title: title, isGroup: true, participantIds: participantIds, lastMessagePreview: nil, updatedAt: Date())
        conversationsById[conv.id] = conv
        messagesByConversationId[conv.id] = []
        return conv
    }

    func sendMessage(conversationId: String, senderId: String, text: String) async throws -> Message {
        let ciphertext = try encryptionService.encrypt(plaintext: text, forConversation: conversationId, senderId: senderId)
        let message = Message(id: UUID().uuidString, conversationId: conversationId, senderId: senderId, sentAt: Date(), isEncrypted: true, ciphertext: ciphertext, plaintext: nil)
        messagesByConversationId[conversationId, default: []].append(message)
        if var conv = conversationsById[conversationId] {
            conv.lastMessagePreview = text
            conv.updatedAt = Date()
            conversationsById[conversationId] = conv
        }
        return message
    }

    func loadMessages(conversationId: String) async throws -> [Message] {
        try await Task.sleep(nanoseconds: 150_000_000)
        let decrypted: [Message] = messagesByConversationId[conversationId, default: []].map { msg in
            var m = msg
            if let text = try? encryptionService.decrypt(ciphertext: msg.ciphertext, forConversation: conversationId, recipientId: "me") {
                m.plaintext = text
            }
            return m
        }
        return decrypted.sorted { $0.sentAt < $1.sentAt }
    }
}

