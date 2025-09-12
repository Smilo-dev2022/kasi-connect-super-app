import Foundation

public struct MediaUploadInfo {
    public let uploadURL: URL
    public let mediaId: String

    public init(uploadURL: URL, mediaId: String) {
        self.uploadURL = uploadURL
        self.mediaId = mediaId
    }
}

public protocol MediaUploadService {
    func requestUploadURL(filename: String, contentType: String) async throws -> MediaUploadInfo
    func confirmUpload(mediaId: String) async throws
}

public enum MediaUploadError: Error {
    case invalidURL
}

public final class MockMediaUploadService: MediaUploadService {
    public init() {}

    public func requestUploadURL(filename: String, contentType: String) async throws -> MediaUploadInfo {
        // Stub a pre-signed upload URL
        let id = UUID().uuidString
        guard let url = URL(string: "https://example.com/upload/\(id)?filename=\(filename)") else {
            throw MediaUploadError.invalidURL
        }
        return MediaUploadInfo(uploadURL: url, mediaId: id)
    }

    public func confirmUpload(mediaId: String) async throws {
        // No-op in mock
    }
}

