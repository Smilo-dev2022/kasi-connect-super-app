import SwiftUI

struct RootView: View {
    @StateObject private var appModel = AppViewModel()

    var body: some View {
        Group {
            switch appModel.route {
            case .login:
                OtpLoginView(onSuccess: { appModel.route = .chats })
            case .chats:
                ChatListView()
                    .environmentObject(appModel)
            }
        }
    }
}

