import SwiftUI

struct ChatListView: View {
    @EnvironmentObject var appModel: AppViewModel

    var body: some View {
        NavigationStack {
            List(appModel.groups.sorted(by: { $0.updatedAt > $1.updatedAt })) { group in
                NavigationLink(value: group) {
                    HStack(spacing: 12) {
                        Circle().fill(Color.blue).frame(width: 40, height: 40)
                            .overlay(Text(String(group.name.prefix(1))).foregroundColor(.white))
                        VStack(alignment: .leading) {
                            Text(group.name).font(.headline)
                            Text(group.lastMessage).font(.subheadline).foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(group.updatedAt, style: .time)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationDestination(for: GroupChat.self) { group in
                GroupChatView(group: group)
                    .environmentObject(appModel)
            }
            .navigationTitle("Chats")
        }
    }
}

