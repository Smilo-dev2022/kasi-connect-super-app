import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export type LedgerEntryType = 'contribution' | 'payout' | 'expense' | 'adjustment' | 'transfer';

export interface GroupWallet {
  id: string;
  name: string;
  members: string[];
  balance: number;
  currency: 'ZAR';
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  type: LedgerEntryType;
  amount: number; // positive amounts only; sign implied by type
  currency: 'ZAR';
  member?: string;
  note?: string;
  createdAt: string;
}

interface WalletStateFile {
  wallets: GroupWallet[];
  ledger: LedgerEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'wallets.json');

let inMemoryState: WalletStateFile | null = null;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

async function readState(): Promise<WalletStateFile> {
  if (inMemoryState) return inMemoryState;
  await ensureDataDir();
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    inMemoryState = JSON.parse(raw) as WalletStateFile;
  } catch {
    inMemoryState = { wallets: [], ledger: [] };
    await writeState();
  }
  return inMemoryState!;
}

async function writeState(): Promise<void> {
  if (!inMemoryState) return;
  const tmp = STATE_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(inMemoryState, null, 2));
  await fs.rename(tmp, STATE_FILE);
}

export async function listGroupWallets(): Promise<GroupWallet[]> {
  const state = await readState();
  return state.wallets.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createGroupWallet(params: { name: string; members?: string[] }): Promise<GroupWallet> {
  const state = await readState();
  const now = new Date().toISOString();
  const wallet: GroupWallet = {
    id: randomUUID(),
    name: params.name.trim(),
    members: (params.members || []).map((m) => m.trim()).filter(Boolean),
    balance: 0,
    currency: 'ZAR',
    createdAt: now,
    updatedAt: now,
  };
  state.wallets.push(wallet);
  await writeState();
  return wallet;
}

export async function getGroupWallet(walletId: string): Promise<{ wallet: GroupWallet; ledger: LedgerEntry[] } | null> {
  const state = await readState();
  const wallet = state.wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  const ledger = state.ledger.filter((e) => e.walletId === walletId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { wallet, ledger };
}

export async function addLedgerEntry(walletId: string, params: {
  type: LedgerEntryType;
  amount: number;
  member?: string;
  note?: string;
}): Promise<{ wallet: GroupWallet; entry: LedgerEntry } | null> {
  const state = await readState();
  const wallet = state.wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  const amount = Number(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  const entry: LedgerEntry = {
    id: randomUUID(),
    walletId,
    type: params.type,
    amount,
    currency: 'ZAR',
    member: params.member?.trim() || undefined,
    note: params.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  state.ledger.push(entry);

  // Update balance
  const decreaseTypes: LedgerEntryType[] = ['payout', 'expense'];
  if (decreaseTypes.includes(entry.type)) {
    wallet.balance = roundToCents(wallet.balance - entry.amount);
  } else {
    // contribution, adjustment (can be positive), transfer (treat as positive into group)
    wallet.balance = roundToCents(wallet.balance + entry.amount);
  }
  wallet.updatedAt = new Date().toISOString();
  await writeState();
  return { wallet, entry };
}

export async function contribute(walletId: string, params: { amount: number; member: string; note?: string }) {
  return addLedgerEntry(walletId, { type: 'contribution', amount: params.amount, member: params.member, note: params.note });
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

