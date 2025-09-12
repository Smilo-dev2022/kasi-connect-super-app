import Foundation

@MainActor
final class ConversationsViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String? = nil

    private let messagingService: MessagingServiceProtocol

    init(messagingService: MessagingServiceProtocol) {
        self.messagingService = messagingService
        Task { await refresh() }
    }

    func refresh() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            conversations = try await messagingService.loadConversations()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func makeChatViewModel(for conversation: Conversation, sessionManager: SessionManager) -> ChatViewModel {
        ChatViewModel(conversation: conversation, messagingService: messagingService, sessionManager: sessionManager)
    }

    func makeGroupCreationViewModel() -> GroupCreationViewModel {
        GroupCreationViewModel(messagingService: messagingService)
    }
}

