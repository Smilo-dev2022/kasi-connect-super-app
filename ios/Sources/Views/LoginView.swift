import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 16) {
            Text("ChatApp")
                .font(.largeTitle)
                .bold()

            TextField("Username", text: $viewModel.username)
                .textInputAutocapitalization(.never)
                .disableAutocorrection(true)
                .textFieldStyle(.roundedBorder)

            SecureField("Password", text: $viewModel.password)
                .textFieldStyle(.roundedBorder)

            if let error = viewModel.errorMessage, !error.isEmpty {
                Text(error).foregroundColor(.red)
            }

            Button {
                Task { await viewModel.signIn() }
            } label: {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Sign In")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(viewModel.isLoading)

            HStack {
                Rectangle().frame(height: 1).foregroundColor(.secondary.opacity(0.3))
                Text("or").foregroundColor(.secondary)
                Rectangle().frame(height: 1).foregroundColor(.secondary.opacity(0.3))
            }

            Button {
                Task { await viewModel.signInWithOAuth(provider: .apple) }
            } label: {
                HStack {
                    Image(systemName: "applelogo")
                    Text("Continue with Apple").frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .buttonStyle(.bordered)

            Button {
                Task { await viewModel.signInWithOAuth(provider: .google) }
            } label: {
                HStack {
                    Image(systemName: "globe")
                    Text("Continue with Google").frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }
}

