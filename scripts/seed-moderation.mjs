// Seed moderation service via REST so Admin UI sees data
const BASE = process.env.NEXT_PUBLIC_MOD_API_BASE || process.env.MOD_API_BASE || 'http://localhost:8082';

async function postJson(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function main() {
  try {
    const reports = [
      { content_id: 'post-2001', content_text: 'Spam link blast', reason: 'spam', reporter_id: 'seed-u1' },
      { content_id: 'post-2002', content_text: 'Harassment in replies', reason: 'abuse', reporter_id: 'seed-u2' },
      { content_id: 'post-2003', content_text: 'Misinformation chain', reason: 'misinfo', reporter_id: 'seed-u3' },
    ];
    for (const r of reports) {
      const created = await postJson('/api/reports', r);
      console.log('seeded_report', created.id, created.reason);
    }
    const appeals = [
      { report_id: 'seed-report-placeholder', user_id: 'seed-u9', reason: 'Appeal example' },
    ];
    // try creating an appeal for the first report if exists
    try {
      const list = await (await fetch(BASE + '/api/reports')).json();
      if (Array.isArray(list) && list.length > 0) {
        const first = list[0];
        const a = await postJson('/api/appeals', { report_id: first.id, user_id: 'seed-u9', reason: 'This was a mistake' });
        console.log('seeded_appeal', a.id, 'for_report', first.id);
      }
    } catch {}
  } catch (e) {
    console.error('Seed via REST failed:', e.message);
    process.exit(0);
  }
}

main();

