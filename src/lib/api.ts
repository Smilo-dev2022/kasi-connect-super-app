export type GroupWallet = {
  id: string;
  name: string;
  members: string[];
  balance: number;
  currency: 'ZAR';
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntry = {
  id: string;
  walletId: string;
  type: 'contribution' | 'payout' | 'expense' | 'adjustment' | 'transfer';
  amount: number;
  currency: 'ZAR';
  member?: string;
  note?: string;
  createdAt: string;
};

export const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:4000';
export const EVENTS_BASE = (import.meta as any).env?.VITE_EVENTS_BASE ?? 'http://localhost:8000';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const walletsApi = {
  async list(): Promise<GroupWallet[]> {
    const data = (await http('/wallets')) as { wallets: GroupWallet[] };
    return data.wallets;
  },
  async create(name: string, members: string[] = []): Promise<GroupWallet> {
    const data = (await http('/wallets', {
      method: 'POST',
      body: JSON.stringify({ name, members }),
    })) as { wallet: GroupWallet };
    return data.wallet;
  },
  async contribute(walletId: string, amount: number, member: string, note?: string) {
    return http('/wallets/' + encodeURIComponent(walletId) + '/contribute', {
      method: 'POST',
      body: JSON.stringify({ amount, member, note }),
    });
  },
  async ledger(walletId: string): Promise<LedgerEntry[]> {
    const data = (await http('/wallets/' + encodeURIComponent(walletId) + '/ledger')) as { ledger: LedgerEntry[] };
    return data.ledger;
  },
};

export const kycApi = {
  async providers(): Promise<{ id: string; name: string; methods: string[] }[]> {
    const data = (await http('/kyc/providers')) as {
      providers: { id: string; name: string; methods: string[] }[];
    };
    return data.providers;
  },
  async startSession(): Promise<{ sessionId: string; redirectUrl: string }> {
    return http('/kyc/session', { method: 'POST' });
  },
  async status(sessionId: string): Promise<{ sessionId: string; status: string }> {
    return http('/kyc/status/' + encodeURIComponent(sessionId));
  },
};

