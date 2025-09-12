/* eslint-disable no-console */
const base = process.env.BASE_URL || 'http://localhost:8080';

async function main() {
  // Create admin token
  const devRes = await fetch(`${base}/auth/dev-token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'admin', name: 'Admin' })
  });
  const { token: adminToken } = await devRes.json();
  if (!adminToken) throw new Error('Failed to get admin token');

  // Create safety room
  const createRoomRes = await fetch(`${base}/safety/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ ward: 'Ward 12', name: 'CPF Ward 12', members: ['user1', 'user2'] })
  });
  const createRoomJson = await createRoomRes.json();
  console.log('create_room', createRoomJson);
  const groupId = createRoomJson.groupId;
  if (!groupId) throw new Error('Failed to create safety room');

  // Verify safety room
  const verifyRes = await fetch(`${base}/safety/rooms/${groupId}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ verified: true })
  });
  console.log('verify_status', await verifyRes.json());

  // Create user token
  const userRes = await fetch(`${base}/auth/dev-token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user1', name: 'User One' })
  });
  const { token: userToken } = await userRes.json();
  if (!userToken) throw new Error('Failed to get user token');

  // Join as user1
  const joinRes = await fetch(`${base}/safety/rooms/${groupId}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${userToken}` }
  });
  console.log('join_room', await joinRes.json());

  // Post alert as user1
  const alertRes = await fetch(`${base}/safety/rooms/${groupId}/alerts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ content: 'Suspicious activity reported near Main Road', contentType: 'text/plain' })
  });
  console.log('post_alert', await alertRes.json());

  // List rooms
  const listRes = await fetch(`${base}/safety/rooms`, { headers: { authorization: `Bearer ${userToken}` } });
  console.log('rooms_list', await listRes.json());
}

main().catch((e) => {
  console.error('TEST_FAILED', e);
  process.exit(1);
});

