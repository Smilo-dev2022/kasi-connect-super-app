import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWalletSnapshot, type WalletSnapshot } from "@/lib/wallet";
import { Skeleton } from "@/components/ui/skeleton";

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);

  const quickActions = [
    { icon: Send, label: "Send", color: "primary" },
    { icon: ArrowDownLeft, label: "Receive", color: "community" },
    { icon: CreditCard, label: "Pay Bill", color: "secondary" },
    { icon: Smartphone, label: "Airtime", color: "primary" }
  ];

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<WalletSnapshot>({
    queryKey: ["wallet", "snapshot"],
    queryFn: fetchWalletSnapshot,
    refetchOnWindowFocus: false,
  });

  const stokvels = useMemo(() => data?.stokvels ?? [], [data]);

  const transactions = useMemo(() => data?.transactions ?? [], [data]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
        <AppHeader title="Wallet" />
        <div className="p-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-40 mb-3" />
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-10" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-10" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
        <AppHeader title="Wallet" />
        <div className="p-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm text-muted-foreground mb-1">Total Balance</h2>
                <div className="text-foreground">Could not load wallet</div>
              </div>
              <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
                <span className="text-3xl font-bold text-foreground">
                  {showBalance ? `R${data?.balance.amountRand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R****.**"}
                </span>
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
              <div className="flex items-center gap-1 text-community mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{data?.balance.monthChangePercent > 0 ? "+" : ""}{data?.balance.monthChangePercent}%</span>
              </div>
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
          
          <div className="space-y-3">
            {stokvels.map((stokvel, index) => (
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
                      R{stokvel.balanceRand.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Group Balance</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">R{stokvel.contributionRand}</div>
                    <div className="text-xs text-muted-foreground">My Contribution</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-secondary">{stokvel.nextPayoutHuman}</div>
                    <div className="text-xs text-muted-foreground">Next Payout</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
          
          <div className="space-y-2">
            {transactions.map((transaction, index) => {
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
                          {isReceived ? '+' : '-'}R{transaction.amountRand}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <span className="text-xs text-muted-foreground">{transaction.timeHuman}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;