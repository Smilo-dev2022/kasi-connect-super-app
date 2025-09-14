import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
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
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Tx = {
  id: number;
  amount_cents: number;
  currency: string;
  description: string | null;
  counterparty: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const cards = [
    { brand: "iKasiLink Debit", last4: "4821", balance: 1250.5, gradient: "from-community via-primary to-secondary" },
    { brand: "Savings", last4: "9013", balance: 5600, gradient: "from-primary via-secondary to-community" },
    { brand: "Stokvel Pool", last4: "2745", balance: 22500, gradient: "from-secondary via-primary to-community" }
  ];

  const quickActions = [
    { icon: Send, label: "Send", color: "primary" },
    { icon: ArrowDownLeft, label: "Receive", color: "community" },
    { icon: CreditCard, label: "Pay Bill", color: "secondary" },
    { icon: Smartphone, label: "Airtime", color: "primary" }
  ];

  const stokvels = [
    {
      name: "Thabo's Investment Group",
      members: 12,
      balance: 15600,
      contribution: 150,
      nextPayout: "2 days",
      status: "active"
    },
    {
      name: "Ladies Savings Circle",
      members: 8,
      balance: 8400,
      contribution: 100,
      nextPayout: "1 week",
      status: "pending"
    },
    {
      name: "Youth Development Fund",
      members: 15,
      balance: 22500,
      contribution: 200,
      nextPayout: "3 weeks",
      status: "active"
    }
  ];

  async function refresh() {
    try {
      setLoading(true);
      const res = await fetch("/wallet/transactions");
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setTxs(data);
      toast({ title: "Wallet updated", description: "Latest transactions fetched" });
    } catch (e: any) {
      toast({ title: "Refresh failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function accept(txId: number) {
    try {
      const res = await fetch(`/wallet/transactions/${txId}/accept`, { method: "POST" });
      if (!res.ok) throw new Error(`Accept failed: ${res.status}`);
      toast({ title: "Accepted", description: `Transaction #${txId} accepted` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Accept failed", description: String(e?.message || e), variant: "destructive" });
    }
  }

  async function cancel(txId: number) {
    try {
      const res = await fetch(`/wallet/transactions/${txId}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error(`Cancel failed: ${res.status}`);
      toast({ title: "Canceled", description: `Transaction #${txId} canceled` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Cancel failed", description: String(e?.message || e), variant: "destructive" });
    }
  }

  function centsToRand(cents: number) {
    return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* Cards Carousel */}
        <Carousel className="w-full">
          <CarouselContent>
            {cards.map((card, idx) => (
              <CarouselItem key={idx} className="md:basis-2/3 lg:basis-1/2">
                <Card className={`p-5 bg-gradient-to-br ${card.gradient} text-white border-white/20 shadow-xl`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs opacity-70">Current Balance</div>
                      <div className="text-2xl font-bold">
                        {showBalance ? `R${card.balance.toLocaleString()}` : "R****.**"}
                      </div>
                    </div>
                    <CreditCard className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">{card.brand}</div>
                    <div className="text-sm tracking-widest">•••• {card.last4}</div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        {/* Balance Card */}
        <Card className="p-6 bg-gradient-to-r from-community/20 via-primary/10 to-secondary/20 border-community/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-muted-foreground mb-1">Total Balance</h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">
                  {showBalance ? "R1,250.50" : "R****.**"}
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
                <span className="text-sm">+8.5%</span>
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
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>Refresh</Button>
            <a href="/wallet/transactions.csv" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">Export CSV</Button>
            </a>
          </div>
        </Card>

        {/* Segmented Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stokvels">Stokvels</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
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
            </div>
            {/* Transaction History */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                  <History className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-2">
                {txs.map((tx) => {
                  const isReceived = tx.amount_cents > 0;
                  const TransactionIcon = getTransactionIcon(isReceived ? 'received' : 'sent');
                  return (
                    <Card key={tx.id} className="p-4 bg-card/80 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isReceived ? 'bg-community/20 text-community' : 'bg-primary/20 text-primary'
                        }`}>
                          <TransactionIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-foreground">
                              {tx.counterparty || 'Unknown'}
                            </h4>
                            <span className={`font-bold ${isReceived ? 'text-community' : 'text-foreground'}`}>
                              {isReceived ? '+' : '-'}R{centsToRand(Math.abs(tx.amount_cents))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{tx.description || 'No description'}</p>
                            <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge>{tx.status}</Badge>
                            {tx.status === 'requested' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => accept(tx.id)}>Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => cancel(tx.id)}>Cancel</Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="stokvels">
            {/* Stokvels only */}
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
          </TabsContent>
          <TabsContent value="history">
            {/* Transactions only */}
            <div className="space-y-2">
              {txs.map((tx) => {
                const isReceived = tx.amount_cents > 0;
                const TransactionIcon = getTransactionIcon(isReceived ? 'received' : 'sent');
                return (
                  <Card key={tx.id} className="p-4 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isReceived ? 'bg-community/20 text-community' : 'bg-primary/20 text-primary'
                      }`}>
                        <TransactionIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground">
                            {tx.counterparty || 'Unknown'}
                          </h4>
                          <span className={`font-bold ${isReceived ? 'text-community' : 'text-foreground'}`}>
                            {isReceived ? '+' : '-'}R{centsToRand(Math.abs(tx.amount_cents))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{tx.description || 'No description'}</p>
                          <span className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;