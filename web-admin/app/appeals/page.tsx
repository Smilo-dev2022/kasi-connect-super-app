async function fetchAppeals() {
  try {
    const base = process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8002';
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
      {appeals.length === 0 && <p>No appeals yet.</p>}
      {appeals.length > 0 && (
        <ul>
          {appeals.map((a: any) => (
            <li key={a.id}>
              <strong>{a.user_id}</strong> appealed report {a.report_id}: {a.reason}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

