export type UserId = string;
export type DeviceId = string;

export interface OtpStartRequest {
  phoneNumber: string;
}

export interface OtpVerifyRequest {
  phoneNumber: string;
  code: string;
  deviceId: DeviceId;
}

export interface JwtPayload {
  userId: UserId;
  deviceId: DeviceId;
}

export interface DeviceKeys {
  identityKeyPublic: string; // base64
  signedPreKeyPublic: string; // base64
  signedPreKeySignature: string; // base64
  oneTimePreKeys: string[]; // base64 list
}

export interface RegisterDeviceKeysRequest {
  deviceId: DeviceId;
  keys: DeviceKeys;
}

export interface PreKeyBundleResponse {
  deviceId: DeviceId;
  identityKeyPublic: string;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKey?: string;
}

export interface SendMessageRequest {
  toUserId: UserId;
  toDeviceId: DeviceId;
  ciphertext: string; // base64
}

export interface InboxMessage {
  fromUserId: UserId;
  fromDeviceId: DeviceId;
  ciphertext: string; // base64
  receivedAt: string; // ISO
}

export * from "./jwt";
