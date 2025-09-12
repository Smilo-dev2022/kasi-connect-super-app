import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import AppHeader from "@/components/AppHeader";
import { 
  Send, 
  ArrowDownLeft, 
  CreditCard, 
  Smartphone,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Plus,
  History,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useState } from "react";
import { useWalletSummary, useWalletStokvels, useWalletTransactions } from "@/hooks/useWallet";

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = useWalletSummary();
  const { data: stokvels, isLoading: isStokvelsLoading, isError: isStokvelsError } = useWalletStokvels();
  const { data: transactions, isLoading: isTxnLoading, isError: isTxnError } = useWalletTransactions();

  const quickActions = [
    { icon: Send, label: "Send", color: "primary" },
    { icon: ArrowDownLeft, label: "Receive", color: "community" },
    { icon: CreditCard, label: "Pay Bill", color: "secondary" },
    { icon: Smartphone, label: "Airtime", color: "primary" }
  ];

  // Data now comes from hooks

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-community text-community-foreground';
      case 'pending': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'received': return ArrowDownRight;
      case 'sent': return ArrowUpRight;
      case 'stokvel': return Users;
      case 'airtime': return Smartphone;
      default: return CreditCard;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Wallet" />
      
      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <Card className="p-6 bg-gradient-to-r from-community/20 via-primary/10 to-secondary/20 border-community/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-muted-foreground mb-1">Total Balance</h2>
              <div className="flex items-center gap-3">
                {isSummaryLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <span className="text-3xl font-bold text-foreground">
                    {showBalance
                      ? `R${(summary?.totalBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "R****.**"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="w-8 h-8"
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="text-right">
              {isSummaryLoading ? (
                <Skeleton className="h-4 w-16 mb-1" />
              ) : (
                <div className="flex items-center gap-1 text-community mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">
                    {summary ? `${summary.growthPercentMonthly > 0 ? "+" : ""}${summary.growthPercentMonthly}%` : "--"}
                  </span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">This month</div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col gap-2 h-auto py-3 bg-white/80 border-white/40 hover:bg-white/90"
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs">{action.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Stokvels Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">My Stokvels</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Join Group
            </Button>
          </div>
          
          {isStokvelsLoading && (
            <div className="space-y-3">
              {[0,1,2].map((i) => (
                <Card key={i} className="p-4 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[0,1,2].map((j) => (
                      <div key={j}>
                        <Skeleton className="h-5 w-24 mx-auto mb-2" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
          {isStokvelsError && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTitle>Could not load stokvels</AlertTitle>
              <AlertDescription>Try refreshing the page.</AlertDescription>
            </Alert>
          )}
          {!isStokvelsLoading && !isStokvelsError && (
            <div className="space-y-3">
              {stokvels?.map((stokvel, index) => (
                <Card key={index} className="p-4 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{stokvel.name}</h4>
                      <p className="text-sm text-muted-foreground">{stokvel.members} members</p>
                    </div>
                    <Badge className={getStatusColor(stokvel.status)}>
                      {stokvel.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-community">
                        R{stokvel.balance.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Group Balance</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">R{stokvel.contribution}</div>
                      <div className="text-xs text-muted-foreground">My Contribution</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-secondary">{stokvel.nextPayout}</div>
                      <div className="text-xs text-muted-foreground">Next Payout</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
          {isTxnLoading && (
            <div className="space-y-2">
              {[0,1,2,3].map((i) => (
                <Card key={i} className="p-4 bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {isTxnError && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTitle>Could not load transactions</AlertTitle>
              <AlertDescription>Try refreshing the page.</AlertDescription>
            </Alert>
          )}
          {!isTxnLoading && !isTxnError && (
            <div className="space-y-2">
              {transactions?.map((transaction, index) => {
                const TransactionIcon = getTransactionIcon(transaction.type);
                const isReceived = transaction.type === 'received';
                
                return (
                  <Card key={index} className="p-4 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isReceived ? 'bg-community/20 text-community' : 'bg-primary/20 text-primary'
                      }`}>
                        <TransactionIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground">
                            {isReceived ? transaction.from : transaction.to}
                          </h4>
                          <span className={`font-bold ${
                            isReceived ? 'text-community' : 'text-foreground'
                          }`}>
                            {isReceived ? '+' : '-'}R{transaction.amount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          <span className="text-xs text-muted-foreground">{transaction.time}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;