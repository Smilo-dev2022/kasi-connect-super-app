import Foundation

struct User: Identifiable, Codable, Equatable {
    let id: String
    let username: String
    let displayName: String
}