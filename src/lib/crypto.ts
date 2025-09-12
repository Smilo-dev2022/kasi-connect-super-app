// Lightweight Web Crypto helpers for E2EE (ECDH X25519 + AES-GCM)
// Note: Browser support varies; fallback to P-256 if X25519 unsupported.

export type ExportedKeyPair = {
  publicKey: string; // base64url
  privateKey: string; // base64url (store client-side only)
  algorithm: string; // "X25519" | "P-256"
};

function toBase64Url(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(b64: string): ArrayBuffer {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function supportsX25519(): Promise<boolean> {
  try {
    // Some browsers expose X25519 via name "X25519" as a DH curve for deriveBits
    await crypto.subtle.generateKey(
      { name: "X25519", namedCurve: "X25519" } as any,
      true,
      ["deriveBits"],
    );
    return true;
  } catch {
    return false;
  }
}

export async function generateKeyPair(): Promise<{ keyPair: CryptoKeyPair; algo: "X25519" | "P-256" }> {
  if (await supportsX25519()) {
    const keyPair = (await crypto.subtle.generateKey(
      { name: "X25519", namedCurve: "X25519" } as any,
      true,
      ["deriveBits"],
    )) as CryptoKeyPair;
    return { keyPair, algo: "X25519" };
  }
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  return { keyPair, algo: "P-256" };
}

export async function exportKeyPair(keyPair: CryptoKeyPair, algo: "X25519" | "P-256"): Promise<ExportedKeyPair> {
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const pub = toBase64Url(new TextEncoder().encode(JSON.stringify(publicKeyJwk)));
  const priv = toBase64Url(new TextEncoder().encode(JSON.stringify(privateKeyJwk)));
  return { publicKey: pub, privateKey: priv, algorithm: algo };
}

export async function importPublicKey(exported: string, algo: "X25519" | "P-256"): Promise<CryptoKey> {
  const jwk = JSON.parse(new TextDecoder().decode(fromBase64Url(exported)));
  if (algo === "X25519") {
    return crypto.subtle.importKey("jwk", jwk, { name: "X25519", namedCurve: "X25519" } as any, true, []);
  }
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

export async function importPrivateKey(exported: string, algo: "X25519" | "P-256"): Promise<CryptoKey> {
  const jwk = JSON.parse(new TextDecoder().decode(fromBase64Url(exported)));
  if (algo === "X25519") {
    return crypto.subtle.importKey("jwk", jwk, { name: "X25519", namedCurve: "X25519" } as any, true, ["deriveBits"]);
  }
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
}

export async function deriveSharedSecret(ownPrivateKey: CryptoKey, peerPublicKey: CryptoKey, algo: "X25519" | "P-256"): Promise<ArrayBuffer> {
  if (algo === "X25519") {
    return crypto.subtle.deriveBits({ name: "X25519", public: peerPublicKey } as any, ownPrivateKey, 256);
  }
  return crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, ownPrivateKey, 256);
}

async function hkdf(secret: ArrayBuffer, salt: ArrayBuffer, info: string, length = 32): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
  const derived = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode(info) },
    key,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return crypto.subtle.exportKey("raw", derived);
}

export async function deriveAesKey(sharedSecret: ArrayBuffer): Promise<CryptoKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await hkdf(sharedSecret, salt.buffer, "kasilink-e2ee");
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptMessage(aesKey: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, data);
  return { iv: toBase64Url(iv.buffer), ciphertext: toBase64Url(ct) };
}

export async function decryptMessage(aesKey: CryptoKey, ivB64: string, ciphertextB64: string): Promise<string> {
  const iv = new Uint8Array(fromBase64Url(ivB64));
  const ct = fromBase64Url(ciphertextB64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  return new TextDecoder().decode(pt);
}

