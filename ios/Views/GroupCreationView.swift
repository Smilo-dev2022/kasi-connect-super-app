import SwiftUI

struct GroupCreationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject var vm: GroupCreationViewModel

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Group Title")) {
                    TextField("Team Plan", text: $vm.title)
                }
                Section(header: Text("Participants (comma-separated IDs)")) {
                    TextField("u1,u2", text: $vm.participantIdsCSV)
                }
                if let error = vm.errorMessage {
                    Text(error).foregroundColor(.red)
                }
                Section {
                    Button(action: { Task {
                        _ = try? await vm.createGroup()
                        dismiss()
                    }}) {
                        if vm.isCreating { ProgressView() } else { Text("Create Group") }
                    }
                    .disabled(vm.title.isEmpty || vm.isCreating)
                }
            }
            .navigationTitle("New Group")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) { Button("Cancel") { dismiss() } }
            }
        }
    }
}

struct GroupCreationView_Previews: PreviewProvider {
    static var previews: some View {
        GroupCreationView(vm: GroupCreationViewModel(messagingService: InMemoryMessagingService(encryptionService: LibSignalEncryptionService())))
    }
}

