import Foundation
import Combine

@MainActor
final class ChatThreadViewModel: ObservableObject {
    @Published private(set) var messages: [ChatMessage] = []
    @Published var composerText: String = ""

    private let service: ChatService
    private let threadId: String
    private var cancellables: Set<AnyCancellable> = []

    init(service: ChatService, threadId: String) {
        self.service = service
        self.threadId = threadId

        service.messagesPublisher(threadId: threadId)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in self?.messages = $0 }
            .store(in: &cancellables)
    }

    func sendMessage(as user: AppUser) async {
        let text = composerText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        composerText = ""
        try? await service.sendMessage(threadId: threadId, text: text, from: user)
    }

    func sendMediaPlaceholder(filename: String, mediaId: String, from user: AppUser) async {
        let shortId = String(mediaId.prefix(8))
        let text = "Sent media: \(filename) [\(shortId)]"
        try? await service.sendMessage(threadId: threadId, text: text, from: user)
    }
}

