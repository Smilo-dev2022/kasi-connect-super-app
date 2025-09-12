import nacl from "tweetnacl";

// Small helpers for Uint8Array <-> base64 conversions that work in browser
function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
	const binary = atob(b64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export type EncryptedPayload = {
	c: string; // base64 ciphertext
	n: string; // base64 nonce (24 bytes)
};

// Derive a stable 32-byte key from a passphrase and a salt using PBKDF2.
// The salt should be public and deterministic per-group (e.g., groupId).
export async function deriveGroupKey(passphrase: string, salt: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const passphraseKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(passphrase),
		{ name: "PBKDF2" },
		false,
		["deriveBits"]
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: encoder.encode(salt),
			iterations: 150000,
			hash: "SHA-256"
		},
		passphraseKey,
		256
	);
	return new Uint8Array(derivedBits);
}

export function encryptWithKey(plaintext: string, key: Uint8Array): EncryptedPayload {
	if (key.byteLength !== 32) {
		throw new Error("Key must be 32 bytes for nacl.secretbox");
	}
	const nonce = nacl.randomBytes(24);
	const messageBytes = new TextEncoder().encode(plaintext);
	const box = nacl.secretbox(messageBytes, nonce, key);
	return { c: bytesToBase64(box), n: bytesToBase64(nonce) };
}

export function decryptWithKey(payload: EncryptedPayload, key: Uint8Array): string {
	if (key.byteLength !== 32) {
		throw new Error("Key must be 32 bytes for nacl.secretbox");
	}
	const nonce = base64ToBytes(payload.n);
	const box = base64ToBytes(payload.c);
	const opened = nacl.secretbox.open(box, nonce, key);
	if (!opened) {
		throw new Error("Failed to decrypt message");
	}
	return new TextDecoder().decode(opened);
}

export type Identity = {
	userId: string;
	deviceId: string;
	// reserved for future asymmetric features
};

const IDENTITY_STORAGE_KEY = "kasi.identity.v1";

export function getOrCreateIdentity(): Identity {
	const existing = localStorage.getItem(IDENTITY_STORAGE_KEY);
	if (existing) {
		try {
			return JSON.parse(existing) as Identity;
		} catch (_) {
			// fallthrough to recreate
		}
	}
	const identity: Identity = {
		userId: crypto.randomUUID(),
		deviceId: crypto.randomUUID()
	};
	localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
	return identity;
}

export type WireMessage = {
	type: "join" | "leave" | "message" | "history" | "system";
	groupId: string;
	userId: string;
	payload?: EncryptedPayload | Record<string, unknown> | string;
	createdAt?: number;
};

export type DecryptedMessage = {
	groupId: string;
	userId: string;
	plaintext: string;
	createdAt: number;
};

