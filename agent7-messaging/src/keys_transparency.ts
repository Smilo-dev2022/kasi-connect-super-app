import nacl from "tweetnacl";

export type TreeHead = {
  treeSize: number;
  rootHash: Uint8Array; // 32 bytes
  signedAt: number; // epoch millis
  signature: Uint8Array; // over treeSize || rootHash || signedAt
};

export type InclusionProof = {
  leafIndex: number;
  path: Uint8Array[]; // Merkle hashes from leaf to root
};

export type DeviceKeyRecord = {
  userId: string;
  deviceId: string;
  devicePublicKey: Uint8Array; // Curve25519 or Ed25519
  createdAt: number;
  revokedAt?: number;
};

export type TransparencyBundle = {
  head: TreeHead;
  records: DeviceKeyRecord[];
  proof: InclusionProof;
};

export function verifyTreeHeadSignature(
  head: TreeHead,
  publicKey: Uint8Array
): boolean {
  const encoder = new TextEncoder();
  const sizeBytes = new Uint8Array(new Uint32Array([head.treeSize]).buffer);
  const timeBytes = new Uint8Array(new BigInt64Array([BigInt(head.signedAt)]).buffer);
  const message = concatBytes(sizeBytes, head.rootHash, timeBytes);
  return nacl.sign.detached.verify(message, head.signature, publicKey);
}

export function verifyInclusion(
  leafHash: Uint8Array,
  proof: InclusionProof,
  expectedRoot: Uint8Array
): boolean {
  let hash = leafHash;
  for (const sibling of proof.path) {
    hash = merkleParent(hash, sibling);
  }
  return bytesEqual(hash, expectedRoot);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function merkleParent(left: Uint8Array, right: Uint8Array): Uint8Array {
  const data = concatBytes(left, right);
  return nacl.hash(data).subarray(0, 32);
}

export function hashDeviceRecord(r: DeviceKeyRecord): Uint8Array {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({
    userId: r.userId,
    deviceId: r.deviceId,
    devicePublicKey: Buffer.from(r.devicePublicKey).toString("base64"),
    createdAt: r.createdAt,
    revokedAt: r.revokedAt ?? null,
  });
  return nacl.hash(encoder.encode(payload)).subarray(0, 32);
}

export function verifyTransparencyBundle(
  bundle: TransparencyBundle,
  transparencyPublicKey: Uint8Array,
  expectedDevicePublicKey: Uint8Array
): boolean {
  if (!verifyTreeHeadSignature(bundle.head, transparencyPublicKey)) return false;
  const record = bundle.records.find((r) => bytesEqual(r.devicePublicKey, expectedDevicePublicKey));
  if (!record) return false;
  const leaf = hashDeviceRecord(record);
  return verifyInclusion(leaf, bundle.proof, bundle.head.rootHash);
}

