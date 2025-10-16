import Foundation

public struct ChatThread: Identifiable, Codable, Equatable, Hashable {
    public let id: String
    public let title: String
    public let lastMessagePreview: String
    public let lastUpdatedAt: Date
    public let unreadCount: Int
    public let participants: [AppUser]

    public init(
        id: String,
        title: String,
        lastMessagePreview: String,
        lastUpdatedAt: Date,
        unreadCount: Int,
        participants: [AppUser]
    ) {
        self.id = id
        self.title = title
        self.lastMessagePreview = lastMessagePreview
        self.lastUpdatedAt = lastUpdatedAt
        self.unreadCount = unreadCount
        self.participants = participants
    }
}

