import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var services: ServiceContainer
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        TabView {
            NavigationStack {
                ChatListView(service: services.chatService)
            }
            .tabItem {
                Label("Chats", systemImage: "bubble.left.and.bubble.right")
            }

            NavigationStack {
                GroupsView()
            }
            .tabItem {
                Label("Groups", systemImage: "person.3")
            }

            NavigationStack {
                VStack(spacing: 16) {
                    Text("Settings")
                        .font(.title2)
                    Button("Sign Out") {
                        Task { await authViewModel.signOut() }
                    }
                    .buttonStyle(.bordered)
                }
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
    }
}

