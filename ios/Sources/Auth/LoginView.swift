import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authService: AuthService

    @State private var username: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @State private var errorMessage: String? = nil

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "message.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.blue)
                    .padding(.bottom, 8)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Username")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    TextField("yourname", text: $username)
                        .textContentType(.username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    SecureField("••••••••", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Button {
                    Task {
                        await signIn()
                    }
                } label: {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(.circular)
                    } else {
                        Text("Sign In")
                            .bold()
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)

                Spacer(minLength: 0)
            }
            .padding()
            .navigationTitle("Sign In")
        }
    }

    private func signIn() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await authService.signIn(username: username, password: password)
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "Unable to sign in."
        }
    }
}