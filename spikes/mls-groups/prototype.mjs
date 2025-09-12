// Minimal MLS-like prototype demo: simulates group key establishment and AES-GCM message encryption
// This is NOT production crypto. It only demonstrates payload shape and flow.

import { webcrypto, randomUUID } from 'crypto';

const { subtle } = webcrypto;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function generateGroupKey() {
  // AES-256-GCM key for the group
  return await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function encryptWithGroupKey({ groupKey, plaintext }) {
  const iv = new Uint8Array(12);
  webcrypto.getRandomValues(iv);
  const ciphertextBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, groupKey, textEncoder.encode(plaintext));
  return { ivBase64: toBase64(iv), ciphertextBase64: toBase64(new Uint8Array(ciphertextBuffer)) };
}

async function decryptWithGroupKey({ groupKey, ivBase64, ciphertextBase64 }) {
  const iv = fromBase64(ivBase64);
  const ciphertext = fromBase64(ciphertextBase64);
  const plaintextBuffer = await subtle.decrypt({ name: 'AES-GCM', iv }, groupKey, ciphertext);
  return textDecoder.decode(plaintextBuffer);
}

async function exportRawKey(key) {
  const raw = await subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(base64) {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

async function main() {
  const groupId = 'test-group';
  const groupKey = await generateGroupKey();
  const rawKey = await exportRawKey(groupKey);
  console.log('[mls-groups] created group', { groupId, keyBytes: rawKey.byteLength });

  const message = 'hello group, this is an MLS-like envelope demo';
  const { ivBase64, ciphertextBase64 } = await encryptWithGroupKey({ groupKey, plaintext: message });

  const envelope = {
    id: randomUUID(),
    from: 'alice',
    to: groupId,
    scope: 'group',
    contentType: 'text/plain',
    timestamp: Date.now(),
    mls: {
      // illustrative MLS-like fields in addition to our existing envelope
      epoch: 1,
      sender: 'alice',
      iv: ivBase64,
      ciphertext: ciphertextBase64,
      alg: 'AES-256-GCM',
    },
  };

  console.log('[mls-groups] envelope (simulated):');
  console.log(JSON.stringify(envelope, null, 2));

  const recovered = await decryptWithGroupKey({ groupKey, ivBase64: envelope.mls.iv, ciphertextBase64: envelope.mls.ciphertext });
  console.log('[mls-groups] recovered plaintext:', recovered);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

