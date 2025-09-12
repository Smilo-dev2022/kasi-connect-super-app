import SwiftUI

struct GroupSetupView: View {
    let service: ChatService
    @Binding var isPresented: Bool

    @State private var groupTitle: String = ""
    @State private var memberNames: String = ""
    @State private var isCreating: Bool = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Group Name")) {
                    TextField("Enter group title", text: $groupTitle)
                }
                Section(header: Text("Members (comma-separated)"), footer: Text("Up to 256 members supported").font(.footnote)) {
                    TextField("e.g. Alex, Sam, Taylor", text: $memberNames)
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Group")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isCreating ? "Creating…" : "Create") {
                        Task { await createGroup() }
                    }
                    .disabled(isCreating)
                }
            }
        }
    }

    private func createGroup() async {
        guard !isCreating else { return }
        isCreating = true
        defer { isCreating = false }

        let names = memberNames
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        // Build mock users list; include a placeholder current user called "You" if not present
        var users: [AppUser] = names.enumerated().map { index, name in
            AppUser(id: "u_\(index)_\(name.lowercased())", displayName: name)
        }
        if !users.contains(where: { $0.displayName.lowercased() == "you" }) {
            users.insert(AppUser(id: "u_demo", displayName: "You"), at: 0)
        }

        do {
            _ = try await service.createGroupThread(title: groupTitle, participants: Array(users.prefix(256)))
            isPresented = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

