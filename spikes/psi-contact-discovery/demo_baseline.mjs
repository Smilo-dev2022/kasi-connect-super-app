// Baseline PSI demo: hashed set intersection with server-provided pepper
// Non-private compared to OPRF PSI, but useful to validate flow and ergonomics.

import crypto from 'crypto';

function normalizeIdentifier(raw) {
  const s = String(raw).trim().toLowerCase();
  // Extremely simple normalization; expand as needed
  return s.replace(/[^a-z0-9@+]/g, '');
}

function hashWithPepper(value, pepper) {
  return crypto.createHash('sha256').update(pepper).update(':').update(value).digest('hex');
}

function intersectClientServer(clientIdentifiers, serverIdentifiers, pepper) {
  const clientHashes = new Set(clientIdentifiers.map((id) => hashWithPepper(normalizeIdentifier(id), pepper)));
  const serverHashes = new Set(serverIdentifiers.map((id) => hashWithPepper(normalizeIdentifier(id), pepper)));
  const intersection = [];
  for (const h of clientHashes) {
    if (serverHashes.has(h)) intersection.push(h);
  }
  return intersection;
}

function demo() {
  const pepper = 'server-secret-pepper';
  const client = ['+1 (415) 555-1212', 'alice@example.com', 'bob@example.com'];
  const server = ['alice@example.com', 'carol@example.com'];
  const result = intersectClientServer(client, server, pepper);
  console.log('[psi-baseline] intersection (hashes):', result);
}

demo();

