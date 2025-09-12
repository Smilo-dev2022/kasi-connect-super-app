import Foundation
import Combine
import PhotosUI

@MainActor
final class ChatThreadViewModel: ObservableObject {
    @Published private(set) var messages: [ChatMessage] = []
    @Published var composerText: String = ""
    @Published var selectedItem: PhotosPickerItem?

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

    func handleSelectedPhoto(as user: AppUser) async {
        guard selectedItem != nil else { return }
        // For Day 1 stub: skip real data extraction and upload placeholder content
        let placeholderData = Data()
        do {
            let url = try await service.uploadMedia(data: placeholderData, fileName: "photo.jpg", mimeType: "image/jpeg")
            try? await service.sendMessage(threadId: threadId, text: "Shared media: \(url.absoluteString)", from: user)
        } catch {
            // Optionally, one could emit a system message or error state
        }
        selectedItem = nil
    }
}

