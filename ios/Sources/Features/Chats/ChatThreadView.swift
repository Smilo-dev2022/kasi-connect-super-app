import SwiftUI

struct ChatThreadView: View {
    let chatId: UUID
    let title: String
    @State private var messages: [Message] = [
        Message(id: UUID(), text: "Welcome to the group!", isMe: false, timestamp: Date()),
        Message(id: UUID(), text: "Hi all", isMe: true, timestamp: Date())
    ]
    @State private var draft: String = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                List(messages) { message in
                    HStack {
                        if message.isMe { Spacer() }
                        Text(message.text)
                            .padding(10)
                            .background(message.isMe ? Color.accentColor.opacity(0.2) : Color.gray.opacity(0.2))
                            .cornerRadius(12)
                        if !message.isMe { Spacer() }
                    }.listRowSeparator(.hidden)
                }
                .listStyle(.plain)
            }
            ComposerView(text: $draft, onSend: send)
                .padding(.horizontal)
                .background(Color(.systemGroupedBackground))
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func send() {
        let newMessage = Message(id: UUID(), text: draft, isMe: true, timestamp: Date())
        messages.append(newMessage)
        draft = ""
    }
}

struct Message: Identifiable {
    let id: UUID
    let text: String
    let isMe: Bool
    let timestamp: Date
}

struct ChatThreadView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView { ChatThreadView(chatId: UUID(), title: "Group") }
    }
}
