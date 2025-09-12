import SwiftUI

struct ChatListView: View {
    let service: ChatService
    @StateObject private var viewModel: ChatListViewModel

    init(service: ChatService) {
        self.service = service
        _viewModel = StateObject(wrappedValue: ChatListViewModel(service: service))
    }

    var body: some View {
        List(viewModel.threads) { thread in
            NavigationLink(value: thread.id) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(thread.title).font(.headline)
                        if thread.unreadCount > 0 {
                            Spacer()
                            Text("\(thread.unreadCount)")
                                .font(.caption2)
                                .padding(4)
                                .background(Color.blue.opacity(0.15))
                                .clipShape(Capsule())
                        }
                    }
                    Text(thread.lastMessagePreview)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Chats")
        .navigationDestination(for: String.self) { threadId in
            ChatThreadView(service: service, threadId: threadId)
        }
    }
}

