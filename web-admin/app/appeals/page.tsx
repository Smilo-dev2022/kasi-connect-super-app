const MOD_BASE = (globalThis as any)?.process?.env?.NEXT_PUBLIC_MOD_API_BASE as string | undefined;

async function fetchAppeals() {
  try {
    const base = MOD_BASE || 'http://localhost:8002';
    const res = await fetch(base + '/api/appeals', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return [] as any[];
  }
}

export default async function AppealsPage() {
  const appeals = await fetchAppeals();
  return (
    <main style={{ padding: 24 }}>
      <h1>Appeals</h1>
      <p style={{ color: '#666' }}>Wireframe: list appeals, filter by status, drill-in.</p>
      {appeals.length === 0 && <p>No appeals yet.</p>}
      {appeals.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>User</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Report</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Reason</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {appeals.map((a: any) => (
              <tr key={a.id}>
                <td style={{ padding: 8 }}>{a.user_id}</td>
                <td style={{ padding: 8 }}>{a.report_id}</td>
                <td style={{ padding: 8 }}>{a.reason}</td>
                <td style={{ padding: 8 }}>{a.status}</td>
                <td style={{ padding: 8 }}>{a.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

