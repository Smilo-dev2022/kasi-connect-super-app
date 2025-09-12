import SwiftUI

struct OtpLoginView: View {
    @StateObject private var vm = OtpViewModel()
    var onSuccess: () -> Void

    var body: some View {
        VStack(spacing: 24) {
            Text("Sign in")
                .font(.largeTitle).bold()

            VStack(alignment: .leading, spacing: 8) {
                Text("Phone number")
                TextField("+1 555 000 0000", text: $vm.phoneNumber)
                    .textContentType(.telephoneNumber)
                    .keyboardType(.phonePad)
                    .textFieldStyle(.roundedBorder)
                Button(action: { Task { await vm.requestCode() } }) {
                    if vm.isSending { ProgressView() } else { Text("Send code") }
                }
                .disabled(vm.isSending || vm.phoneNumber.isEmpty)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Code")
                TextField("123456", text: $vm.otpCode)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)
                Button(action: { Task { if await vm.verifyCode() { onSuccess() } } }) {
                    if vm.isVerifying { ProgressView() } else { Text("Verify") }
                }
                .disabled(vm.isVerifying || vm.otpCode.count < 4)
            }

            if let error = vm.errorMessage {
                Text(error).foregroundColor(.red)
            }

            Spacer()
        }
        .padding()
    }
}

