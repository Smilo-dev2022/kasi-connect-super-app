async function fetchFreshness() {
  try {
    const res = await fetch(process.env.NEXT_PUBLIC_EVENTS_API_BASE + '/api/metrics/ward/freshness', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch freshness');
    return res.json();
  } catch (e) {
    return { ok: false, error: String(e) } as any;
  }
}

export default async function Page() {
  const data = await fetchFreshness();
  const items = (data?.items as any[]) || [];
  return (
    <main style={{ padding: 24 }}>
      <h1>Ward Admin Dashboard</h1>
      <p style={{ color: '#666' }}>Wireframe: add GA/ward funnel events and filters.</p>
      <p>Freshness of ward events ingestion.</p>
      <div style={{ marginTop: 16 }}>
        {items.length === 0 && <p>No data yet.</p>}
        {items.length > 0 && (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Ward</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Last Event</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Age (s)</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.ward}>
                  <td style={{ padding: 8 }}>{it.ward}</td>
                  <td style={{ padding: 8 }}>{it.last_event_at}</td>
                  <td style={{ padding: 8 }}>{it.age_seconds}</td>
                  <td style={{ padding: 8, color: it.healthy ? 'green' : 'red' }}>{it.healthy ? 'Healthy' : 'Stale'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <script dangerouslySetInnerHTML={{ __html: `
        if (window && (window as any).gtag) {
          (window as any).gtag('event', 'ward_dashboard_view', { page: 'dashboard' });
        }
      `}} />
    </main>
  );
}
