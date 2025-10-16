import Foundation

public struct ChatMessage: Identifiable, Codable, Equatable, Hashable {
    public let id: String
    public let threadId: String
    public let sender: AppUser
    public let text: String
    public let createdAt: Date

    public init(id: String, threadId: String, sender: AppUser, text: String, createdAt: Date) {
        self.id = id
        self.threadId = threadId
        self.sender = sender
        self.text = text
        self.createdAt = createdAt
    }
}

