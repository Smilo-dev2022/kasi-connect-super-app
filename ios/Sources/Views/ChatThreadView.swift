import SwiftUI
import PhotosUI

struct ChatThreadView: View {
    @EnvironmentObject private var services: ServiceContainer
    @EnvironmentObject private var authViewModel: AuthViewModel
    let service: ChatService
    let threadId: String
    @StateObject private var viewModel: ChatThreadViewModel

    init(service: ChatService, threadId: String) {
        self.service = service
        self.threadId = threadId
        _viewModel = StateObject(wrappedValue: ChatThreadViewModel(service: service, threadId: threadId))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { _ in
                List(viewModel.messages) { message in
                    HStack(alignment: .top) {
                        Text(message.sender.displayName.prefix(2))
                            .font(.caption)
                            .frame(width: 28, height: 28)
                            .background(Color.gray.opacity(0.2))
                            .clipShape(Circle())
                        VStack(alignment: .leading, spacing: 4) {
                            Text(message.sender.displayName).font(.subheadline).bold()
                            Text(message.text)
                                .font(.body)
                        }
                        Spacer()
                    }
                }
                .listStyle(.plain)
            }
            HStack(alignment: .bottom, spacing: 8) {
                PhotosPicker(selection: $viewModel.selectedItem, matching: .images, photoLibrary: .shared()) {
                    Image(systemName: "photo.fill.on.rectangle.fill")
                        .padding(8)
                }
                TextField("Message", text: $viewModel.composerText, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                Button {
                    if let user = authViewModel.currentUser {
                        Task { await viewModel.sendMessage(as: user) }
                    }
                } label: {
                    Image(systemName: "paperplane.fill")
                        .padding(8)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationTitle("Thread")
        .task(id: viewModel.selectedItem) {
            if let user = authViewModel.currentUser {
                await viewModel.handleSelectedPhoto(as: user)
            }
        }
    }
}

