# Mobile Integration Guide

This guide covers OTP auth, device key upload, fetching key bundles, sending, and receiving messages using the services in this repo.

## Auth (OTP)

1) Request OTP
- POST `http://localhost:4001/otp/request` with `{ "phone": "+123456789" }`
- Dev mode returns `{ devCode }`

2) Verify OTP
- POST `http://localhost:4001/otp/verify` with `{ "phone": "+123", "code": "123456" }`
- Response includes `{ token, user: { id, phone } }`
- Use `token` as `Authorization: Bearer <token>` for Messaging API

## Device Registration (libsignal)

- Generate via platform libsignal:
  - Identity key pair
  - Registration ID
  - Signed pre-key (keyId, publicKey, signature)
  - One-time pre-keys (array of { keyId, publicKey })

- POST `http://localhost:4002/devices/register` (Bearer token)
```
{
  "deviceId": "android" | "ios",
  "registrationId": 12345,
  "identityKey": "base64",
  "signedPreKey": { "keyId": 1, "publicKey": "base64", "signature": "base64" },
  "oneTimePreKeys": [ { "keyId": 10, "publicKey": "base64" }, ... ]
}
```

## Fetch Key Bundles for Peer

- GET `http://localhost:4002/keys/{userId}` returns per-device bundles:
```
{
  "userId": "...",
  "devices": [
    {
      "deviceId": "ios",
      "registrationId": 67890,
      "identityKey": "base64",
      "signedPreKey": { "keyId": 1, "publicKey": "base64", "signature": "base64" },
      "prekeys": [ { "keyId": 10, "publicKey": "base64" }, ... ]
    }
  ]
}
```
- Server marks delivered prekeys as used

## Establish Session (client-side)

- For each target device, use libsignal to build a PreKeyBundle and establish a session
- Encrypt with session to produce ciphertext per target device

## Send Message

- POST `http://localhost:4002/messages` (Bearer token)
```
{
  "recipientUserId": "peerUserId",
  "ciphertext": "base64-or-binary-encoded"
}
```
- Server queues message to recipient

## Receive Messages

- GET `http://localhost:4002/messages/inbox` (Bearer token)
- Response `{ messages: [{ id, senderUserId, recipientUserId, ciphertext, createdAt }] }`
- Client decrypts using libsignal session

## Notes

- This server stores dev data locally (SQLite). For production, use managed DB and enable TLS.
- Keys are treated as opaque base64; mobile apps must validate sizes and formats per libsignal.