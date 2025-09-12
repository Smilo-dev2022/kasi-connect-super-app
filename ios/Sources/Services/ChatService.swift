import Foundation
import Combine

public protocol ChatService {
    func threadsPublisher() -> AnyPublisher<[ChatThread], Never>
    func messagesPublisher(threadId: String) -> AnyPublisher<[ChatMessage], Never>
    func sendMessage(threadId: String, text: String, from user: AppUser) async throws
    func createGroupThread(title: String, participants: [AppUser]) async throws -> ChatThread
    func uploadMedia(data: Data, fileName: String, mimeType: String) async throws -> URL
}

public final class MockChatService: ChatService {
    private let threadsSubject: CurrentValueSubject<[ChatThread], Never>
    private var messagesSubjects: [String: CurrentValueSubject<[ChatMessage], Never>]

    public init() {
        let demoUser = AppUser(id: "u_demo", displayName: "You")
        let other = AppUser(id: "u_alex", displayName: "Alex")
        let thread = ChatThread(
            id: "t_general",
            title: "General",
            lastMessagePreview: "Welcome to ChatApp",
            lastUpdatedAt: Date(),
            unreadCount: 0,
            participants: [demoUser, other]
        )
        self.threadsSubject = CurrentValueSubject([thread])
        let seedMessages: [ChatMessage] = [
            ChatMessage(id: UUID().uuidString, threadId: thread.id, sender: other, text: "Welcome!", createdAt: Date().addingTimeInterval(-3600)),
            ChatMessage(id: UUID().uuidString, threadId: thread.id, sender: demoUser, text: "Glad to be here.", createdAt: Date().addingTimeInterval(-1800))
        ]
        self.messagesSubjects = [thread.id: CurrentValueSubject(seedMessages)]
    }

    public func threadsPublisher() -> AnyPublisher<[ChatThread], Never> {
        threadsSubject.eraseToAnyPublisher()
    }

    public func messagesPublisher(threadId: String) -> AnyPublisher<[ChatMessage], Never> {
        let subject = messagesSubjects[threadId] ?? {
            let empty = CurrentValueSubject<[ChatMessage], Never>([])
            messagesSubjects[threadId] = empty
            return empty
        }()
        return subject.eraseToAnyPublisher()
    }

    public func sendMessage(threadId: String, text: String, from user: AppUser) async throws {
        let subject = messagesSubjects[threadId] ?? {
            let empty = CurrentValueSubject<[ChatMessage], Never>([])
            messagesSubjects[threadId] = empty
            return empty
        }()
        let new = ChatMessage(id: UUID().uuidString, threadId: threadId, sender: user, text: text, createdAt: Date())
        await MainActor.run {
            var messages = subject.value
            messages.append(new)
            subject.send(messages)
        }
        await MainActor.run {
            var threads = threadsSubject.value
            if let index = threads.firstIndex(where: { $0.id == threadId }) {
                let existing = threads[index]
                let updated = ChatThread(
                    id: existing.id,
                    title: existing.title,
                    lastMessagePreview: text,
                    lastUpdatedAt: Date(),
                    unreadCount: existing.unreadCount,
                    participants: existing.participants
                )
                threads[index] = updated
            }
            threadsSubject.send(threads)
        }
    }

    public func createGroupThread(title: String, participants: [AppUser]) async throws -> ChatThread {
        // Enforce up to 256 participants
        guard participants.count <= 256 else {
            throw NSError(domain: "MockChatService", code: 400, userInfo: [NSLocalizedDescriptionKey: "Groups support up to 256 participants."])
        }
        let newThread = ChatThread(
            id: "t_\(UUID().uuidString.prefix(8))",
            title: title.isEmpty ? "New Group" : title,
            lastMessagePreview: "Group created",
            lastUpdatedAt: Date(),
            unreadCount: 0,
            participants: participants
        )
        await MainActor.run {
            var threads = threadsSubject.value
            threads.insert(newThread, at: 0)
            threadsSubject.send(threads)
            messagesSubjects[newThread.id] = CurrentValueSubject<[ChatMessage], Never>([])
        }
        return newThread
    }

    public func uploadMedia(data: Data, fileName: String, mimeType: String) async throws -> URL {
        // Simulate upload delay and return a fake URL
        try await Task.sleep(nanoseconds: 300_000_000)
        let urlString = "https://example.com/uploads/\(UUID().uuidString)/\(fileName)"
        guard let url = URL(string: urlString) else {
            throw NSError(domain: "MockChatService", code: 500, userInfo: [NSLocalizedDescriptionKey: "Failed to create media URL"])
        }
        return url
    }
}

