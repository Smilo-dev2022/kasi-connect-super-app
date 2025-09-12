import Foundation

struct User: Identifiable, Equatable {
    let id: String
    var phoneNumber: String
    var displayName: String
}

struct Message: Identifiable, Equatable {
    let id: String
    let groupId: String
    let senderId: String
    let senderName: String
    let text: String
    let timestamp: Date
    var isMine: Bool { senderId == currentUserId }
}

struct GroupChat: Identifiable, Equatable {
    let id: String
    var name: String
    var lastMessage: String
    var updatedAt: Date
}

let currentUserId = UUID().uuidString

