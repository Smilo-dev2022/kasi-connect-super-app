// Wallet domain types and mock service with simulated network latency

export type WalletSummary = {
  totalBalance: number;
  growthPercentMonthly: number; // e.g., 8.5 means +8.5%
};

export type StokvelStatus = "active" | "pending" | "inactive";

export type StokvelGroup = {
  id: string;
  name: string;
  members: number;
  balance: number;
  contribution: number;
  nextPayout: string; // human friendly string like "2 days"
  status: StokvelStatus;
};

export type TransactionType = "received" | "sent" | "stokvel" | "airtime" | "other";

export type WalletTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  from?: string;
  to?: string;
  description: string;
  time: string; // human friendly string like "2h ago"
  status: "completed" | "pending" | "failed";
};

function simulateNetworkDelay<T>(data: T, delayMs = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

const mockSummary: WalletSummary = {
  totalBalance: 1250.5,
  growthPercentMonthly: 8.5,
};

const mockStokvels: StokvelGroup[] = [
  {
    id: "stokvel-1",
    name: "Thabo's Investment Group",
    members: 12,
    balance: 15600,
    contribution: 150,
    nextPayout: "2 days",
    status: "active",
  },
  {
    id: "stokvel-2",
    name: "Ladies Savings Circle",
    members: 8,
    balance: 8400,
    contribution: 100,
    nextPayout: "1 week",
    status: "pending",
  },
  {
    id: "stokvel-3",
    name: "Youth Development Fund",
    members: 15,
    balance: 22500,
    contribution: 200,
    nextPayout: "3 weeks",
    status: "active",
  },
];

const mockTransactions: WalletTransaction[] = [
  {
    id: "txn-1",
    type: "received",
    amount: 150,
    from: "Mama Sarah",
    description: "Groceries money",
    time: "2h ago",
    status: "completed",
  },
  {
    id: "txn-2",
    type: "sent",
    amount: 50,
    to: "Taxi fare",
    description: "Daily transport",
    time: "4h ago",
    status: "completed",
  },
  {
    id: "txn-3",
    type: "stokvel",
    amount: 150,
    to: "Thabo's Group",
    description: "Monthly contribution",
    time: "1d ago",
    status: "completed",
  },
  {
    id: "txn-4",
    type: "airtime",
    amount: 30,
    to: "Vodacom",
    description: "Data bundle",
    time: "2d ago",
    status: "completed",
  },
];

export const walletService = {
  async fetchSummary(): Promise<WalletSummary> {
    return simulateNetworkDelay(mockSummary);
  },
  async fetchStokvels(): Promise<StokvelGroup[]> {
    return simulateNetworkDelay(mockStokvels);
  },
  async fetchTransactions(): Promise<WalletTransaction[]> {
    return simulateNetworkDelay(mockTransactions);
  },
};

export type { WalletTransaction as Transaction };

