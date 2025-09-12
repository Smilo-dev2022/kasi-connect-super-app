import SwiftUI

struct OTPLoginView: View {
    @EnvironmentObject var vm: OTPLoginViewModel

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Phone Number")) {
                    TextField("+1234567890", text: $vm.phoneNumberE164)
                        .keyboardType(.phonePad)
                        .textInputAutocapitalization(.never)
                }

                if vm.otpRequested {
                    Section(header: Text("Verification Code")) {
                        TextField("123456", text: $vm.code)
                            .keyboardType(.numberPad)
                    }
                }

                if let error = vm.errorMessage {
                    Text(error).foregroundColor(.red)
                }

                Section {
                    if !vm.otpRequested {
                        Button(action: { Task { await vm.requestOTP() } }) {
                            if vm.isRequesting { ProgressView() } else { Text("Request OTP") }
                        }
                        .disabled(vm.phoneNumberE164.isEmpty || vm.isRequesting)
                    } else {
                        Button(action: { Task { await vm.verify() } }) {
                            if vm.isVerifying { ProgressView() } else { Text("Verify") }
                        }
                        .disabled(vm.code.isEmpty || vm.isVerifying)
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
            .environmentObject(OTPLoginViewModel(authService: MockOTPAuthService(), sessionManager: SessionManager()))
    }
}

