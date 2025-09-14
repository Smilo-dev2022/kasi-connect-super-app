import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Balance = { group_id: string; member_id: string; balance_cents: number; updated_at: string };

const API_BASE = (import.meta as any)?.env?.VITE_WALLET_API || "http://localhost:8000";

export default function GroupLedger() {
  const [groupId] = useState("group-demo");
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wallet/groups/${encodeURIComponent(groupId)}/balances`);
      const data = (await res.json()) as { group_id: string; balances: Balance[] };
      setBalances(data.balances);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Group Ledger" />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          <a href={`${API_BASE}/wallet/groups/${encodeURIComponent(groupId)}/ledger.csv`} target="_blank" rel="noreferrer">
            <Button variant="ghost">Download CSV</Button>
          </a>
        </div>
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-2 font-semibold text-sm">
            <div>Member</div>
            <div>Balance (R)</div>
            <div>Updated</div>
          </div>
          <div className="divide-y">
            {balances.map((b) => (
              <div key={`${b.group_id}-${b.member_id}`} className="grid grid-cols-3 gap-2 py-2 text-sm">
                <div>{b.member_id}</div>
                <div>{(b.balance_cents / 100).toFixed(2)}</div>
                <div>{new Date(b.updated_at).toLocaleString()}</div>
              </div>
            ))}
            {balances.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">No balances yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

