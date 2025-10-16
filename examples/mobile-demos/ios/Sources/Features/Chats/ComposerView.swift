import SwiftUI

struct ComposerView: View {
    @Binding var text: String
    var onSend: () -> Void

    var body: some View {
        HStack {
            TextField("Message", text: $text)
                .textFieldStyle(.roundedBorder)
            Button("Send", action: onSend)
                .disabled(text.isEmpty)
        }
        .padding(.vertical, 8)
    }
}
