// Wallet service skeleton with types and mock API functions

export type WalletBalance = {
	amountRand: number; // e.g., 1250.5 represents R1,250.50
	monthChangePercent: number; // e.g., 8.5
};

export type StokvelStatus = "active" | "pending" | "inactive";

export type Stokvel = {
	name: string;
	members: number;
	balanceRand: number;
	contributionRand: number;
	nextPayoutHuman: string;
	status: StokvelStatus;
};

export type TransactionType = "received" | "sent" | "stokvel" | "airtime" | "other";

export type WalletTransaction = {
	type: TransactionType;
	amountRand: number;
	from?: string;
	to?: string;
	description: string;
	timeHuman: string;
	status: "completed" | "pending" | "failed";
};

export type WalletSnapshot = {
	balance: WalletBalance;
	stokvels: Stokvel[];
	transactions: WalletTransaction[];
};

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWalletSnapshot(): Promise<WalletSnapshot> {
	await delay(300);
	return {
		balance: { amountRand: 1250.5, monthChangePercent: 8.5 },
		stokvels: [
			{
				name: "Thabo's Investment Group",
				members: 12,
				balanceRand: 15600,
				contributionRand: 150,
				nextPayoutHuman: "2 days",
				status: "active",
			},
			{
				name: "Ladies Savings Circle",
				members: 8,
				balanceRand: 8400,
				contributionRand: 100,
				nextPayoutHuman: "1 week",
				status: "pending",
			},
			{
				name: "Youth Development Fund",
				members: 15,
				balanceRand: 22500,
				contributionRand: 200,
				nextPayoutHuman: "3 weeks",
				status: "active",
			},
		],
		transactions: [
			{
				type: "received",
				amountRand: 150,
				from: "Mama Sarah",
				description: "Groceries money",
				timeHuman: "2h ago",
				status: "completed",
			},
			{
				type: "sent",
				amountRand: 50,
				to: "Taxi fare",
				description: "Daily transport",
				timeHuman: "4h ago",
				status: "completed",
			},
			{
				type: "stokvel",
				amountRand: 150,
				to: "Thabo's Group",
				description: "Monthly contribution",
				timeHuman: "1d ago",
				status: "completed",
			},
			{
				type: "airtime",
				amountRand: 30,
				to: "Vodacom",
				description: "Data bundle",
				timeHuman: "2d ago",
				status: "completed",
			},
		],
	};
}

export async function fetchBalance(): Promise<WalletBalance> {
	const data = await fetchWalletSnapshot();
	return data.balance;
}

export async function fetchStokvels(): Promise<Stokvel[]> {
	const data = await fetchWalletSnapshot();
	return data.stokvels;
}

export async function fetchTransactions(): Promise<WalletTransaction[]> {
	const data = await fetchWalletSnapshot();
	return data.transactions;
}

