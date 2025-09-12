import Foundation

@MainActor
final class GroupCreationViewModel: ObservableObject {
    @Published var title: String = ""
    @Published var participantIdsCSV: String = ""
    @Published var isCreating: Bool = false
    @Published var errorMessage: String? = nil

    private let messagingService: MessagingServiceProtocol

    init(messagingService: MessagingServiceProtocol) {
        self.messagingService = messagingService
    }

    func createGroup() async throws -> Conversation? {
        guard !title.isEmpty else { return nil }
        let ids = participantIdsCSV.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        isCreating = true
        defer { isCreating = false }
        do {
            let conv = try await messagingService.createGroup(title: title, participantIds: ids)
            return conv
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }
}

