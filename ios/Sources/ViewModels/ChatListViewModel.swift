import Foundation
import Combine

@MainActor
final class ChatListViewModel: ObservableObject {
    @Published private(set) var threads: [ChatThread] = []

    private let service: ChatService
    private var cancellables: Set<AnyCancellable> = []

    init(service: ChatService) {
        self.service = service
        service.threadsPublisher()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in self?.threads = $0 }
            .store(in: &cancellables)
    }
}

