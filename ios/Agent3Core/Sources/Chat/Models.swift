import Foundation

struct Chat: Identifiable, Hashable {
    let id: UUID
    var title: String
    var lastMessagePreview: String
    var updatedAt: Date
}

struct Message: Identifiable, Hashable {
    let id: UUID
    let chatId: UUID
    let senderId: String
    var text: String
    var sentAt: Date
    var isMine: Bool
}

final class ChatStore: ObservableObject {
    @Published var chats: [Chat] = []
    @Published var messagesByChatId: [UUID: [Message]] = [:]

    init() {
        seed()
    }

    func seed() {
        let chat = Chat(id: UUID(), title: "Design Team", lastMessagePreview: "Welcome to the group!", updatedAt: Date())
        chats = [chat]
        messagesByChatId[chat.id] = [
            Message(id: UUID(), chatId: chat.id, senderId: "alice", text: "Welcome to the group!", sentAt: Date().addingTimeInterval(-3600), isMine: false),
            Message(id: UUID(), chatId: chat.id, senderId: "me", text: "Hi all 👋", sentAt: Date().addingTimeInterval(-3500), isMine: true)
        ]
    }

    func send(text: String, in chat: Chat) {
        let new = Message(id: UUID(), chatId: chat.id, senderId: "me", text: text, sentAt: Date(), isMine: true)
        messagesByChatId[chat.id, default: []].append(new)
        updatePreview(for: chat.id, with: new.text)
    }

    func receive(text: String, in chatId: UUID, from senderId: String) {
        let new = Message(id: UUID(), chatId: chatId, senderId: senderId, text: text, sentAt: Date(), isMine: false)
        messagesByChatId[chatId, default: []].append(new)
        updatePreview(for: chatId, with: new.text)
    }

    private func updatePreview(for chatId: UUID, with preview: String) {
        guard let index = chats.firstIndex(where: { $0.id == chatId }) else { return }
        chats[index].lastMessagePreview = preview
        chats[index].updatedAt = Date()
    }
}

