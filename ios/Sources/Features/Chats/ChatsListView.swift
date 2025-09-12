import SwiftUI

struct ChatsListView: View {
    @State private var chats: [ChatSummary] = [
        ChatSummary(id: UUID(), name: "Design Team", lastMessage: "Let’s meet at 3 pm", unreadCount: 2),
        ChatSummary(id: UUID(), name: "Family", lastMessage: "Dinner ready", unreadCount: 0)
    ]

    var body: some View {
        NavigationView {
            List(chats) { chat in
                NavigationLink(destination: ChatThreadView(chatId: chat.id, title: chat.name)) {
                    HStack {
                        Circle().fill(Color.blue).frame(width: 40, height: 40).overlay(Text(String(chat.name.prefix(1))).foregroundColor(.white))
                        VStack(alignment: .leading) {
                            Text(chat.name).font(.headline)
                            Text(chat.lastMessage).font(.subheadline).foregroundColor(.secondary).lineLimit(1)
                        }
                        Spacer()
                        if chat.unreadCount > 0 {
                            Text("\(chat.unreadCount)").padding(6).background(Color.red).foregroundColor(.white).clipShape(Circle())
                        }
                    }
                }
            }
            .navigationTitle("Chats")
        }
    }
}

struct ChatSummary: Identifiable {
    let id: UUID
    let name: String
    let lastMessage: String
    let unreadCount: Int
}

struct ChatsListView_Previews: PreviewProvider {
    static var previews: some View {
        ChatsListView()
    }
}
