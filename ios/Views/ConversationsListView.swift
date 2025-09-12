import SwiftUI

struct ConversationsListView: View {
    @EnvironmentObject var vm: ConversationsViewModel
    @EnvironmentObject var sessionManager: SessionManager

    @State private var showCreateGroup = false

    var body: some View {
        NavigationView {
            List(vm.conversations) { conv in
                NavigationLink(destination: ChatView(vm: vm.makeChatViewModel(for: conv, sessionManager: sessionManager))) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(conv.title).font(.headline)
                            if conv.isGroup { Text("Group").font(.caption).foregroundColor(.secondary) }
                        }
                        if let preview = conv.lastMessagePreview {
                            Text(preview).font(.subheadline).foregroundColor(.secondary)
                        }
                    }
                }
            }
            .overlay(Group { if vm.isLoading { ProgressView() } })
            .navigationTitle("Chats")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateGroup = true }) { Image(systemName: "person.3.fill") }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Sign out") { sessionManager.signOut() }
                }
            }
            .sheet(isPresented: $showCreateGroup) {
                GroupCreationView(vm: vm.makeGroupCreationViewModel())
            }
        }
    }
}

struct ConversationsListView_Previews: PreviewProvider {
    static var previews: some View {
        let vm = ConversationsViewModel(messagingService: InMemoryMessagingService(encryptionService: LibSignalEncryptionService()))
        let sm = SessionManager()
        sm.signIn(user: User(id: "me", displayName: "Me", phoneNumberE164: "+10000000000"))
        return ConversationsListView()
            .environmentObject(vm)
            .environmentObject(sm)
    }
}

