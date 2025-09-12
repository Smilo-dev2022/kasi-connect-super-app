import SwiftUI

struct GroupChatView: View {
    @StateObject private var store = ChatStore()

    var body: some View {
        NavigationStack {
            List(store.chats) { chat in
                NavigationLink(value: chat) {
                    ChatRowView(chat: chat)
                }
            }
            .navigationDestination(for: Chat.self) { chat in
                MessageListView(chat: chat)
                    .environmentObject(store)
            }
            .navigationTitle("Chats")
        }
        .environmentObject(store)
    }
}

struct ChatRowView: View {
    let chat: Chat

    var body: some View {
        HStack {
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 42, height: 42)
                .overlay(Text(String(chat.title.prefix(1))).bold())
            VStack(alignment: .leading) {
                Text(chat.title).font(.headline)
                Text(chat.lastMessagePreview).font(.subheadline).foregroundColor(.secondary)
            }
            Spacer()
            Text(chat.updatedAt, style: .time)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct MessageListView: View {
    let chat: Chat
    @EnvironmentObject private var store: ChatStore
    @State private var draft: String = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 8) {
                        ForEach(store.messagesByChatId[chat.id] ?? []) { message in
                            MessageRowView(message: message)
                                .id(message.id)
                        }
                    }.padding()
                }
                .onChange(of: store.messagesByChatId[chat.id]?.count ?? 0) { _ in
                    if let last = store.messagesByChatId[chat.id]?.last { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
            Divider()
            HStack {
                TextField("Message", text: $draft, axis: .vertical)
                Button("Send") {
                    let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty else { return }
                    store.send(text: text, in: chat)
                    draft = ""
                }
                .keyboardShortcut(.return, modifiers: [])
            }.padding()
        }
        .navigationTitle(chat.title)
        .onAppear {
            NotificationCenter.default.addObserver(forName: PushNotificationsManager.incomingMessageNotification, object: nil, queue: .main) { note in
                if let text = note.userInfo?["text"] as? String {
                    store.receive(text: text, in: chat.id, from: "remote")
                }
            }
        }
    }
}

struct MessageRowView: View {
    let message: Message

    var body: some View {
        HStack {
            if message.isMine { Spacer() }
            Text(message.text)
                .padding(10)
                .background(message.isMine ? Color.blue : Color.gray.opacity(0.2))
                .foregroundColor(message.isMine ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            if !message.isMine { Spacer() }
        }
    }
}

struct GroupChatView_Previews: PreviewProvider {
    static var previews: some View {
        GroupChatView()
    }
}

