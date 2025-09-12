import { useQuery } from "@tanstack/react-query";
import { walletService, type WalletSummary, type StokvelGroup, type Transaction } from "@/services/wallet";

const QUERY_KEYS = {
  summary: ["wallet", "summary"] as const,
  stokvels: ["wallet", "stokvels"] as const,
  transactions: ["wallet", "transactions"] as const,
};

export function useWalletSummary() {
  return useQuery<WalletSummary>({
    queryKey: QUERY_KEYS.summary,
    queryFn: () => walletService.fetchSummary(),
    staleTime: 1000 * 30,
  });
}

export function useWalletStokvels() {
  return useQuery<StokvelGroup[]>({
    queryKey: QUERY_KEYS.stokvels,
    queryFn: () => walletService.fetchStokvels(),
    staleTime: 1000 * 30,
  });
}

export function useWalletTransactions() {
  return useQuery<Transaction[]>({
    queryKey: QUERY_KEYS.transactions,
    queryFn: () => walletService.fetchTransactions(),
    staleTime: 1000 * 30,
  });
}

