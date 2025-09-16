#!/usr/bin/env node

import { strict as assert } from 'assert';

// Service endpoints
const AUTH_API = process.env.AUTH_API || 'http://localhost:4010';
const MEDIA_API = process.env.MEDIA_API || 'http://localhost:4008';
const SEARCH_API = process.env.SEARCH_API || 'http://localhost:4009';
const EVENTS = process.env.EVENTS_API || 'http://localhost:8000';
const MOD = process.env.MOD_API || 'http://localhost:8082';
const MESSAGING = process.env.MSG_API || 'http://localhost:8080';

/**
 * Health endpoint checks
 */
async function healthChecks() {
  console.log('🔍 Running health checks...');
  
  const healthEndpoints = [
    { name: 'Auth', url: `${AUTH_API}/healthz`, expectStatus: 200 },
    { name: 'Media', url: `${MEDIA_API}/healthz`, expectStatus: 200 },
    { name: 'Search', url: `${SEARCH_API}/health`, expectStatus: 200 },
    { name: 'Events', url: `${EVENTS}/health`, expectStatus: 200 },
    { name: 'Moderation', url: `${MOD}/api/health`, expectStatus: 200 },
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(endpoint.url);
      assert.equal(response.status, endpoint.expectStatus, 
        `${endpoint.name} health check failed: ${response.status}`);
      console.log(`✅ ${endpoint.name} health check passed`);
    } catch (error) {
      console.error(`❌ ${endpoint.name} health check failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Metrics endpoint validation
 */
async function metricsChecks() {
  console.log('📊 Running metrics checks...');
  
  const metricsEndpoints = [
    { name: 'Events', url: `${EVENTS}/metrics` },
    { name: 'Moderation', url: `${MOD}/metrics` },
  ];

  for (const endpoint of metricsEndpoints) {
    try {
      const response = await fetch(endpoint.url);
      assert.equal(response.status, 200, 
        `${endpoint.name} metrics endpoint failed: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      assert.ok(contentType && contentType.includes('text/plain'), 
        `${endpoint.name} metrics should return text/plain, got: ${contentType}`);
      
      const body = await response.text();
      assert.ok(body.includes('request_count') || body.includes('http_requests_total'), 
        `${endpoint.name} metrics should contain request_count`);
      assert.ok(body.includes('p95') || body.includes('http_request_duration'), 
        `${endpoint.name} metrics should contain p95 or duration metrics`);
      
      console.log(`✅ ${endpoint.name} metrics check passed`);
    } catch (error) {
      console.error(`❌ ${endpoint.name} metrics check failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Moderation flow test
 */
async function moderationFlow() {
  console.log('🔨 Testing moderation flow...');
  
  // Health check
  const health = await fetch(`${MOD}/api/health`);
  assert.equal(health.status, 200);

  // Create a report
  const create = await fetch(`${MOD}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_id: 'c1',
      content_text: 'bad text',
      reason: 'abuse'
    })
  });
  assert.equal(create.status, 201);
  const rep = await create.json();
  console.log('✅ Created moderation report:', rep.id);

  // Escalate the report
  const esc = await fetch(`${MOD}/api/reports/${rep.id}/escalate`, {
    method: 'POST'
  });
  assert.equal(esc.status, 200);
  console.log('✅ Escalated report');

  // Close the report
  const close = await fetch(`${MOD}/api/reports/${rep.id}/close`, {
    method: 'POST'
  });
  assert.equal(close.status, 200);
  console.log('✅ Closed report');

  // Check metrics
  const metrics = await fetch(`${MOD}/metrics`);
  assert.equal(metrics.status, 200);
  console.log('✅ Moderation metrics accessible');
}

/**
 * Events and RSVP flow test
 */
async function eventsFlow() {
  console.log('🎉 Testing events and RSVP flow...');
  
  // List events
  const list = await fetch(`${EVENTS}/api/events`);
  assert.equal(list.status, 200);
  const data = await list.json();
  
  // Use existing event or fallback
  const id = data?.events?.[0]?.id || data?.[0]?.id;
  if (!id) {
    console.log('⚠️  No events available for RSVP test, skipping...');
    return;
  }

  // Create RSVP with ticket
  const rsvpResponse = await fetch(`${EVENTS}/api/rsvps/with-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: id,
      name: 'Smoke',
      email: `smoke-${Date.now()}@example.com`
    })
  });
  assert.equal(rsvpResponse.status, 201);
  const rsvpData = await rsvpResponse.json();
  const token = rsvpData?.ticket?.token;
  assert.ok(token, 'no ticket token');
  console.log('✅ Created RSVP with ticket');

  // Verify QR check-in token
  const verify = await fetch(`${EVENTS}/api/checkin/verify?token=${encodeURIComponent(token)}`);
  assert.equal(verify.status, 200);
  console.log('✅ Verified QR token');

  // Perform check-in
  const checkin = await fetch(`${EVENTS}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  assert.equal(checkin.status, 200);
  console.log('✅ Check-in successful');

  // Check metrics
  const metrics = await fetch(`${EVENTS}/metrics`);
  assert.equal(metrics.status, 200);
  console.log('✅ Events metrics accessible');
}

/**
 * Auth flow test
 */
async function authFlow() {
  console.log('🔐 Testing auth flow...');
  
  // Health check
  const health = await fetch(`${AUTH_API}/healthz`);
  assert.equal(health.status, 200);
  console.log('✅ Auth service healthy');

  // Test metrics endpoint (if available)
  try {
    const metrics = await fetch(`${AUTH_API}/metrics`);
    if (metrics.status === 200) {
      const contentType = metrics.headers.get('content-type');
      assert.ok(contentType && contentType.includes('text/plain'), 
        'Auth metrics should return text/plain');
      console.log('✅ Auth metrics accessible');
    }
  } catch (error) {
    console.log('⚠️  Auth metrics endpoint not available');
  }
}

/**
 * Media upload flow test
 */
async function mediaFlow() {
  console.log('📁 Testing media flow...');
  
  // Health check
  const health = await fetch(`${MEDIA_API}/healthz`);
  assert.equal(health.status, 200);
  console.log('✅ Media service healthy');

  // Test metrics endpoint (if available)
  try {
    const metrics = await fetch(`${MEDIA_API}/metrics`);
    if (metrics.status === 200) {
      const contentType = metrics.headers.get('content-type');
      assert.ok(contentType && contentType.includes('text/plain'), 
        'Media metrics should return text/plain');
      console.log('✅ Media metrics accessible');
    }
  } catch (error) {
    console.log('⚠️  Media metrics endpoint not available');
  }
}

/**
 * Main smoke test runner
 */
async function runSmokeTests() {
  console.log('🚀 Starting smoke tests...');
  
  try {
    await healthChecks();
    await metricsChecks();
    await authFlow();
    await mediaFlow();
    await moderationFlow();
    await eventsFlow();
    
    console.log('\n✅ All smoke tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Smoke tests failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSmokeTests();
}

export {
  healthChecks,
  metricsChecks,
  moderationFlow,
  eventsFlow,
  authFlow,
  mediaFlow,
  runSmokeTests
};