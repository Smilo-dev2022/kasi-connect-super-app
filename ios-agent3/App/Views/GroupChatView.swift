import SwiftUI

struct GroupChatView: View {
    @EnvironmentObject var appModel: AppViewModel
    let group: GroupChat
    @State private var inputText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(appModel.messagesByGroupId[group.id] ?? []) { message in
                            HStack {
                                if message.isMine { Spacer() }
                                MessageBubble(message: message)
                                if !message.isMine { Spacer() }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .onChange(of: appModel.messagesByGroupId[group.id]?.count ?? 0) { _ in
                    // Scroll to bottom when new messages arrive
                }
            }

            Divider()
            HStack(spacing: 8) {
                TextField("Message", text: $inputText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                Button("Send") {
                    guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
                    let text = inputText
                    inputText = ""
                    appModel.appendMessage(text, to: group.id)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationTitle(group.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct MessageBubble: View {
    let message: Message
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if !message.isMine {
                Text(message.senderName).font(.caption).foregroundColor(.secondary)
            }
            Text(message.text)
                .padding(10)
                .background(message.isMine ? Color.accentColor : Color(.secondarySystemBackground))
                .foregroundColor(message.isMine ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Text(message.timestamp, style: .time)
                .font(.caption2)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: message.isMine ? .trailing : .leading)
        }
        .frame(maxWidth: 280, alignment: message.isMine ? .trailing : .leading)
    }
}

