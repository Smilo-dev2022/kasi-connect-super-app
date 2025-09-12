import Foundation
import Combine

final class AppViewModel: ObservableObject {
    enum Route { case login, chats }

    @Published var route: Route = .login
    @Published var groups: [GroupChat] = []
    @Published var messagesByGroupId: [String: [Message]] = [:]

    private var cancellables: Set<AnyCancellable> = []

    init() {
        // Mock seed
        groups = [
            GroupChat(id: UUID().uuidString, name: "Family", lastMessage: "Dinner at 7?", updatedAt: Date()),
            GroupChat(id: UUID().uuidString, name: "Team", lastMessage: "Ship v1.2", updatedAt: Date().addingTimeInterval(-3600))
        ]
        for group in groups {
            messagesByGroupId[group.id] = [
                Message(id: UUID().uuidString, groupId: group.id, senderId: "a", senderName: "Alice", text: "Hello!", timestamp: Date().addingTimeInterval(-4000)),
                Message(id: UUID().uuidString, groupId: group.id, senderId: currentUserId, senderName: "Me", text: "Hi there", timestamp: Date().addingTimeInterval(-3000))
            ]
        }
    }

    func appendMessage(_ text: String, to groupId: String) {
        let new = Message(id: UUID().uuidString, groupId: groupId, senderId: currentUserId, senderName: "Me", text: text, timestamp: Date())
        messagesByGroupId[groupId, default: []].append(new)
        if let idx = groups.firstIndex(where: { $0.id == groupId }) {
            groups[idx].lastMessage = text
            groups[idx].updatedAt = Date()
        }
    }
}

