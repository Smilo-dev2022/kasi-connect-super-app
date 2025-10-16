import SwiftUI

struct ChatThreadView: View {
    @EnvironmentObject private var services: ServiceContainer
    @EnvironmentObject private var authViewModel: AuthViewModel
    let service: ChatService
    let threadId: String
    @StateObject private var viewModel: ChatThreadViewModel
    @State private var isShowingMediaSheet: Bool = false
    @State private var isUploading: Bool = false

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
                Button {
                    isShowingMediaSheet = true
                } label: {
                    Image(systemName: "paperclip")
                        .padding(8)
                }
                .buttonStyle(.bordered)
                .disabled(isUploading)
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
        .sheet(isPresented: $isShowingMediaSheet) {
            VStack(spacing: 16) {
                Text("Media Picker (stub)").font(.headline)
                if isUploading {
                    ProgressView("Uploading...")
                }
                Button {
                    uploadStub(filename: "photo.jpg", contentType: "image/jpeg")
                } label: {
                    Label("Pick Photo (stub)", systemImage: "photo")
                }
                .disabled(isUploading)
                Button {
                    uploadStub(filename: "video.mov", contentType: "video/quicktime")
                } label: {
                    Label("Pick Video (stub)", systemImage: "video")
                }
                .disabled(isUploading)
                Button("Cancel") {
                    isShowingMediaSheet = false
                }
                .keyboardShortcut(.cancelAction)
                .disabled(isUploading)
                Spacer()
            }
            .padding()
            .presentationDetents([.medium])
        }
    }
}

private extension ChatThreadView {
    func uploadStub(filename: String, contentType: String) {
        guard let user = authViewModel.currentUser else { return }
        isUploading = true
        Task {
            do {
                let info = try await services.mediaUploadService.requestUploadURL(filename: filename, contentType: contentType)
                // Simulate an upload delay
                try? await Task.sleep(nanoseconds: 300_000_000)
                try await services.mediaUploadService.confirmUpload(mediaId: info.mediaId)
                await viewModel.sendMediaPlaceholder(filename: filename, mediaId: info.mediaId, from: user)
            } catch {
                // Ignore errors in stub
            }
            isUploading = false
            isShowingMediaSheet = false
        }
    }
}

