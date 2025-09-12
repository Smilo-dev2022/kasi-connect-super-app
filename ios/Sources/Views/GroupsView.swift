import SwiftUI

struct GroupsView: View {
    @EnvironmentObject private var services: ServiceContainer
    @State private var isShowingCreateSheet: Bool = false
    @State private var provisionalMemberCount: Int = 1

    private let maxMembers: Int = 256

    var body: some View {
        VStack(spacing: 16) {
            Text("Groups").font(.title2)
            Text("Placeholder for group chats").foregroundColor(.secondary)
            Button {
                isShowingCreateSheet = true
            } label: {
                Label("Create Group", systemImage: "person.3.fill")
            }
            .buttonStyle(.borderedProminent)
            Spacer()
        }
        .padding()
        .navigationTitle("Groups")
        .sheet(isPresented: $isShowingCreateSheet) {
            VStack(spacing: 16) {
                Text("New Group (stub)").font(.headline)
                Text("Select up to \(maxMembers) members")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Stepper(value: $provisionalMemberCount, in: 1...maxMembers) {
                    Text("Members: \(provisionalMemberCount)/\(maxMembers)")
                }
                Button {
                    isShowingCreateSheet = false
                } label: {
                    Text("Create Group (stub)")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(provisionalMemberCount == 0 || provisionalMemberCount > maxMembers)
                Button("Cancel") {
                    isShowingCreateSheet = false
                }
                .keyboardShortcut(.cancelAction)
                Spacer()
            }
            .padding()
            .presentationDetents([.medium])
        }
    }
}

