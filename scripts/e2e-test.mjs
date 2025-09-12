/* eslint-disable no-console */
const AUTH_URL = 'http://localhost:4001';
const MSG_URL = 'http://localhost:4002';

async function post(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function get(url, token) {
  const res = await fetch(url, {
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function key(prefix) {
  return Buffer.from(`${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`).toString('base64url');
}

async function main() {
  // User A
  const aPhone = '+1111000001';
  const aReq = await post(`${AUTH_URL}/otp/request`, { phone: aPhone });
  const aVer = await post(`${AUTH_URL}/otp/verify`, { phone: aPhone, code: aReq.devCode });
  const aToken = aVer.token;
  const aUserId = aVer.user.id;
  console.log('A userId', aUserId);

  // User B
  const bPhone = '+2222000002';
  const bReq = await post(`${AUTH_URL}/otp/request`, { phone: bPhone });
  const bVer = await post(`${AUTH_URL}/otp/verify`, { phone: bPhone, code: bReq.devCode });
  const bToken = bVer.token;
  const bUserId = bVer.user.id;
  console.log('B userId', bUserId);

  // Register devices
  await post(`${MSG_URL}/devices/register`, {
    deviceId: 'android',
    registrationId: 12345,
    identityKey: key('idk-A'),
    signedPreKey: { keyId: 1, publicKey: key('spk-A'), signature: key('sig-A') },
    oneTimePreKeys: Array.from({ length: 5 }, (_, i) => ({ keyId: i + 10, publicKey: key(`opkA-${i}`) })),
  }, aToken);
  await post(`${MSG_URL}/devices/register`, {
    deviceId: 'ios',
    registrationId: 67890,
    identityKey: key('idk-B'),
    signedPreKey: { keyId: 1, publicKey: key('spk-B'), signature: key('sig-B') },
    oneTimePreKeys: Array.from({ length: 5 }, (_, i) => ({ keyId: i + 10, publicKey: key(`opkB-${i}`) })),
  }, bToken);

  // Fetch B keys as A (for session setup, not strictly required here)
  const bKeys = await get(`${MSG_URL}/keys/${bUserId}`);
  console.log('B key bundles count', bKeys.devices.length);

  // Send message A -> B
  const cipher = Buffer.from('hello from A to B').toString('base64url');
  const sendRes = await post(`${MSG_URL}/messages`, { recipientUserId: bUserId, ciphertext: cipher }, aToken);
  console.log('Sent message id', sendRes.id);

  // B pulls inbox
  const inbox = await get(`${MSG_URL}/messages/inbox`, bToken);
  console.log('Inbox messages', inbox.messages.map(m => ({ id: m.id, from: m.senderUserId, to: m.recipientUserId, ciphertext: m.ciphertext })));
}

main().catch((e) => { console.error(e); process.exit(1); });

