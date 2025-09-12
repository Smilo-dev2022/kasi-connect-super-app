import SwiftUI

struct ChatView: View {
    @StateObject var vm: ChatViewModel

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                List(vm.messages) { message in
                    HStack {
                        if message.senderId == vm.currentUserId { Spacer() }
                        Text(message.plaintext ?? "…")
                            .padding(8)
                            .background(message.senderId == vm.currentUserId ? Color.blue.opacity(0.2) : Color.gray.opacity(0.2))
                            .cornerRadius(8)
                        if message.senderId != vm.currentUserId { Spacer() }
                    }
                    .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
            }

            HStack {
                TextField("Message", text: $vm.inputText)
                    .textFieldStyle(.roundedBorder)
                Button(action: { Task { await vm.send() } }) {
                    if vm.isSending { ProgressView() } else { Image(systemName: "paperplane.fill") }
                }
                .disabled(vm.inputText.isEmpty)
            }
            .padding()
        }
        .navigationTitle(vm.conversation.title)
    }
}

struct ChatView_Previews: PreviewProvider {
    static var previews: some View {
        let conversation = Conversation(id: UUID().uuidString, title: "General", isGroup: true, participantIds: ["me", "u1"], lastMessagePreview: nil, updatedAt: Date())
        let sessionManager = SessionManager()
        sessionManager.signIn(user: User(id: "me", displayName: "Me", phoneNumberE164: "+10000000000"))
        let messaging = InMemoryMessagingService(encryptionService: LibSignalEncryptionService())
        let vm = ChatViewModel(conversation: conversation, messagingService: messaging, sessionManager: sessionManager)
        return NavigationView { ChatView(vm: vm) }
    }
}

