import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    let conversation: Conversation

    @Published var inputText: String = ""
    @Published var messages: [Message] = []
    @Published var isSending: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    private let messagingService: MessagingServiceProtocol
    let sessionManager: SessionManager

    init(conversation: Conversation, messagingService: MessagingServiceProtocol, sessionManager: SessionManager) {
        self.conversation = conversation
        self.messagingService = messagingService
        self.sessionManager = sessionManager
        Task { await loadMessages() }
    }

    var currentUserId: String? { sessionManager.currentUser?.id }

    func loadMessages() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            messages = try await messagingService.loadMessages(conversationId: conversation.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func send() async {
        guard let userId = currentUserId, !inputText.isEmpty else { return }
        errorMessage = nil
        isSending = true
        let text = inputText
        inputText = ""
        defer { isSending = false }
        do {
            let message = try await messagingService.sendMessage(conversationId: conversation.id, senderId: userId, text: text)
            messages.append(message)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

