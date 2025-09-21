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

  // Create incident
  const createIncidentRes = await fetch(`${base}/safety/rooms/${groupId}/incidents`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ type: 'crime', description: 'Suspicious activity' })
  });
  const createIncidentJson = await createIncidentRes.json();
  console.log('create_incident', createIncidentJson);
  const incidentId = createIncidentJson.id;
  if (!incidentId) throw new Error('Failed to create incident');

  // List incidents
  const listIncidentsRes = await fetch(`${base}/safety/rooms/${groupId}/incidents`, {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  const listIncidentsJson = await listIncidentsRes.json();
  console.log('list_incidents', listIncidentsJson);
  if (listIncidentsJson.length !== 1) throw new Error('Expected 1 incident');

  // Get incident
  const getIncidentRes = await fetch(`${base}/safety/incidents/${incidentId}`, {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  const getIncidentJson = await getIncidentRes.json();
  console.log('get_incident', getIncidentJson);
  if (getIncidentJson.id !== incidentId) throw new Error('Incident ID mismatch');

  // Update incident
  const updateIncidentRes = await fetch(`${base}/safety/incidents/${incidentId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });
  const updateIncidentJson = await updateIncidentRes.json();
  console.log('update_incident', updateIncidentJson);
  if (updateIncidentJson.status !== 'resolved') throw new Error('Failed to update incident status');

  console.log('TEST_PASSED');
}

main().catch((e) => {
  console.error('TEST_FAILED', e);
  process.exit(1);
});
