async function fetchReports() {
  try {
    const base = process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8002';
    const res = await fetch(base + '/api/reports', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return [] as any[];
  }
}

export default async function ReportsPage() {
  const reports = await fetchReports();
  return (
    <main style={{ padding: 24 }}>
      <h1>Reports</h1>
      <p style={{ color: '#666' }}>Wireframe: triage queue, status updates, escalation.</p>
      {reports.length === 0 && <p>No reports yet.</p>}
      {reports.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Reason</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Escalation</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Content</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r: any) => (
              <tr key={r.id}>
                <td style={{ padding: 8 }}>{r.id}</td>
                <td style={{ padding: 8 }}>{r.reason}</td>
                <td style={{ padding: 8 }}>{r.status}</td>
                <td style={{ padding: 8 }}>L{r.escalation_level}{r.sla_minutes ? ` (SLA ${r.sla_minutes}m)` : ''}</td>
                <td style={{ padding: 8 }}>{r.content_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

