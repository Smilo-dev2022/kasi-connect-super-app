import SwiftUI

struct OTPLoginView: View {
    @StateObject private var viewModel = OTPLoginViewModel()
    var onSuccess: () -> Void

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Phone")) {
                    TextField("+1 555 123 4567", text: $viewModel.phoneNumber)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                }
                Section(header: Text("Code")) {
                    HStack {
                        TextField("123456", text: $viewModel.code)
                            .keyboardType(.numberPad)
                            .textContentType(.oneTimeCode)
                        Button(action: { Task { await viewModel.requestCode() } }) {
                            if viewModel.isRequestingCode {
                                ProgressView()
                            } else {
                                Text("Send Code")
                            }
                        }.disabled(viewModel.isRequestingCode || !viewModel.canRequestCode)
                    }
                }
                Section {
                    Button(action: { Task { if await viewModel.verify() { onSuccess() } } }) {
                        if viewModel.isVerifying {
                            ProgressView()
                        } else {
                            Text("Verify & Continue")
                        }
                    }.disabled(!viewModel.canVerify)
                }
                if let error = viewModel.errorMessage {
                    Section {
                        Text(error).foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Sign In")
        }
    }
}

struct OTPLoginView_Previews: PreviewProvider {
    static var previews: some View {
        OTPLoginView(onSuccess: {})
    }
}

