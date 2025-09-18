const MOD_BASE = (globalThis as any)?.process?.env?.NEXT_PUBLIC_MOD_API_BASE as string | undefined;

async function fetchAggs() {
  try {
    const base = MOD_BASE || 'http://localhost:8002';
    const res = await fetch(base + '/api/transparency/aggregates', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch {
    return { ok: false } as any;
  }
}

export default async function TransparencyPage() {
  const data = await fetchAggs();
  const appealsByStatus = data?.appeals_by_status || {};
  const roles = data?.roles || {};
  return (
    <main style={{ padding: 24 }}>
      <h1>Transparency</h1>
      <p style={{ color: '#666' }}>Wireframe: basic aggregates for day-1.</p>
      <section style={{ marginTop: 16 }}>
        <h2>Appeals</h2>
        <p>Total: {data?.appeals_total ?? 0}</p>
        <ul>
          {Object.keys(appealsByStatus).length === 0 && <li>None</li>}
          {Object.entries(appealsByStatus).map(([k, v]) => (
            <li key={k}>{k}: {v as any}</li>
          ))}
        </ul>
      </section>
      <section style={{ marginTop: 16 }}>
        <h2>Roles</h2>
        <ul>
          {Object.keys(roles).length === 0 && <li>None</li>}
          {Object.entries(roles).map(([k, v]) => (
            <li key={k}>{k}: {v as any}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

