import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            ChatListView()
                .tabItem {
                    Label("Chats", systemImage: "message.fill")
                }

            WalletView()
                .tabItem {
                    Label("Wallet", systemImage: "wallet.pass.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
    }
}

private struct HomeView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Image(systemName: "person.3.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.blue)
                Text("Welcome to CommunityApp")
                    .font(.title2)
                    .fontWeight(.semibold)
                Text("Explore rooms, events, and chat with your community.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("Home")
        }
    }
}

private struct WalletView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Image(systemName: "wallet.pass")
                    .font(.system(size: 48))
                    .foregroundStyle(.orange)
                Text("Wallet is coming soon")
                    .font(.headline)
                Text("Track balances and transactions here.")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("Wallet")
        }
    }
}

private struct SettingsView: View {
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    Button(role: .destructive) {
                        authService.signOut()
                    } label: {
                        Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

private struct ChatListView: View {
    var body: some View {
        NavigationStack {
            List {
                Text("Chat UI coming soon")
            }
            .navigationTitle("Chats")
        }
    }
}