// Simple wallet client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WALLET_BASE = ((import.meta as any)?.env?.VITE_WALLET_API as string | undefined) || 'http://localhost:4015';

export type Payment = { id: string; from: string; to: string; amount: number; currency: string; status: 'requested' | 'paid' | 'failed'; created_at: string };

export async function requestPayment(to: string, amount: number, currency = 'ZAR'): Promise<Payment> {
  const res = await fetch(`${WALLET_BASE}/payments/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to, amount, currency })
  });
  if (!res.ok) throw new Error('wallet-request-failed');
  return res.json() as Promise<Payment>;
}

export async function listPayments(): Promise<Payment[]> {
  const res = await fetch(`${WALLET_BASE}/payments`);
  if (!res.ok) throw new Error('wallet-list-failed');
  return res.json() as Promise<Payment[]>;
}

export async function markPaid(id: string): Promise<Payment> {
  const res = await fetch(`${WALLET_BASE}/payments/${id}/mark-paid`, { method: 'POST' });
  if (!res.ok) throw new Error('wallet-mark-paid-failed');
  return res.json() as Promise<Payment>;
}
