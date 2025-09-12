# UX Spec: Media Sharing

## Scope
Media uploads across chats and groups with privacy safeguards and efficient performance on low bandwidth.

## Supported Types
- Images (JPEG/PNG/WEBP), short videos (≤ 60s), documents (PDF), location pin.

## Flows
- Attach via [+] menu; preview, annotate (draw, text), blur faces toggle.
- Compress by default with quality slider; show final size.
- Upload with progress; retry and background continuation.

## Safety & Privacy
- Auto-detect faces/plates; offer one-tap blur before sending.
- In CPF rooms, media may require approval.
- Strip EXIF unless user opts to keep.

## Accessibility
- Alt text required for images; auto-suggest from vision model; editable.

## Acceptance Criteria
- Media attaches and sends within 3 taps.
- On 3G, a 1 MB image uploads in ≤ 8 seconds with progress feedback.

