import SwiftUI

struct OTPLoginView: View {
    @StateObject private var viewModel = OTPLoginViewModel()

    @EnvironmentObject private var authViewModel: AuthViewModel

    @State private var isPresented: Bool = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Phone")) {
                    TextField("+1 555 123 4567", text: $viewModel.phoneNumber)
                        .keyboardType(.phonePad)
                }
                Section(header: Text("One-Time Password")) {
                    TextField("123456", text: $viewModel.otpCode)
                        .keyboardType(.numberPad)
                }
                Section {
                    Button(action: viewModel.requestOTP) {
                        Text(viewModel.isRequesting ? "Sending..." : "Send OTP")
                    }.disabled(viewModel.isRequesting || viewModel.phoneNumber.isEmpty)

                    Button(action: {
                        viewModel.onVerified = {
                            Task { await authViewModel.signInWithOAuth(provider: .apple) }
                        }
                        viewModel.verifyOTP()
                    }) {
                        Text(viewModel.isVerifying ? "Verifying..." : "Verify")
                    }.disabled(viewModel.isVerifying || viewModel.otpCode.isEmpty)
                }
                if let errorMessage = viewModel.errorMessage {
                    Section {
                        Text(errorMessage).foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Sign in")
        }
    }
}

struct OTPLoginView_Previews: PreviewProvider {
    static var previews: some View {
        OTPLoginView()
    }
}
