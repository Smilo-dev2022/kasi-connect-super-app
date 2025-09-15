import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { Link } from "react-router-dom";
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUserId } from "@/lib/devAuth";

const API_BASE = (import.meta as any)?.env?.VITE_WALLET_API || "http://localhost:8000";

type WalletRequest = {
  id: number;
  group_id: string;
  requester_id: string;
  amount_cents: number;
  currency: string;
  status: "requested" | "accepted" | "paid" | "canceled" | "expired";
  accepted_by?: string | null;
  paid_by?: string | null;
  canceled_by?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
};

const Wallet = () => {
  const demoMode = ((import.meta as any)?.env?.VITE_DEMO ?? 'false') === 'true';
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const currentUserId = useMemo(() => getCurrentUserId(), []);
  const demoGroupId = "group-demo";

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wallet/requests?group_id=${encodeURIComponent(demoGroupId)}`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as WalletRequest[];
      setRequests(data);
    } catch (err) {
      toast({ title: "Failed to load", description: "Could not fetch wallet requests", variant: "destructive" as any });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);
  const cards = demoMode ? [
    { brand: "iKasiLink Debit", last4: "4821", balance: 1250.5, gradient: "from-community via-primary to-secondary" },
    { brand: "Savings", last4: "9013", balance: 5600, gradient: "from-primary via-secondary to-community" },
    { brand: "Stokvel Pool", last4: "2745", balance: 22500, gradient: "from-secondary via-primary to-community" }
  ] : [];

  const quickActions = [
    { icon: Send, label: "Send", color: "primary" },
    { icon: ArrowDownLeft, label: "Receive", color: "community" },
    { icon: CreditCard, label: "Pay Bill", color: "secondary" },
    { icon: Smartphone, label: "Airtime", color: "primary" }
  ];

  const stokvels = demoMode ? [
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
  ] : [];

  const transactions = demoMode ? [
    {
      type: "received",
      amount: 150,
      from: "Mama Sarah",
      description: "Groceries money",
      time: "2h ago",
      status: "completed"
    },
    {
      type: "sent",
      amount: 50,
      to: "Taxi fare",
      description: "Daily transport",
      time: "4h ago",
      status: "completed"
    },
    {
      type: "stokvel",
      amount: 150,
      to: "Thabo's Group",
      description: "Monthly contribution",
      time: "1d ago",
      status: "completed"
    },
    {
      type: "airtime",
      amount: 30,
      to: "Vodacom",
      description: "Data bundle",
      time: "2d ago",
      status: "completed"
    }
  ] : [];

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      default: return 'outline';
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

  async function act(path: string, okTitle: string) {
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      toast({ title: okTitle });
      await refresh();
    } catch {
      toast({ title: "Action failed", variant: "destructive" as any });
    }
  }

  function optimisticUpdate(requestId: number, updates: Partial<WalletRequest>) {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...updates } : r)));
  }

  async function onAccept(r: WalletRequest) {
    const prev = r.status;
    optimisticUpdate(r.id, { status: "accepted", accepted_by: currentUserId });
    try {
      await act(`${API_BASE}/wallet/requests/${r.id}/accept?actor_id=${encodeURIComponent(currentUserId)}`, "Accepted");
    } catch {
      optimisticUpdate(r.id, { status: prev });
    }
  }

  async function onCancel(r: WalletRequest) {
    const prev = r.status;
    optimisticUpdate(r.id, { status: "canceled", canceled_by: currentUserId });
    try {
      await act(`${API_BASE}/wallet/requests/${r.id}/cancel?actor_id=${encodeURIComponent(currentUserId)}`, "Canceled");
    } catch {
      optimisticUpdate(r.id, { status: prev, canceled_by: undefined });
    }
  }

  async function onPay(r: WalletRequest) {
    const prev = r.status;
    optimisticUpdate(r.id, { status: "paid", paid_by: currentUserId });
    try {
      await act(`${API_BASE}/wallet/requests/${r.id}/pay?payer_id=${encodeURIComponent(currentUserId)}`, "Paid");
    } catch {
      optimisticUpdate(r.id, { status: prev, paid_by: undefined });
    }
  }

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
        </Card>

        {/* Segmented Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stokvels">Stokvels</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            {/* Wallet Requests Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Wallet Requests</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                    Refresh
                  </Button>
                  <a
                    href={`${API_BASE}/wallet/groups/${encodeURIComponent(demoGroupId)}/ledger.csv`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="ghost" size="sm">Export CSV</Button>
                  </a>
                  <Link to="/app/ledger">
                    <Button variant="ghost" size="sm">View Balances</Button>
                  </Link>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      try {
                        const body = {
                          group_id: demoGroupId,
                          requester_id: currentUserId,
                          amount_cents: 5000,
                        };
                        const res = await fetch(`${API_BASE}/wallet/requests`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body),
                        });
                        if (!res.ok) throw new Error("failed");
                        toast({ title: "Request created" });
                        await refresh();
                      } catch {
                        toast({ title: "Create failed", variant: "destructive" as any });
                      }
                    }}
                  >
                    New Request
                  </Button>
                </div>
              </div>
              {/* Banner */}
              <div className="mb-2 text-sm text-muted-foreground">
                {(() => {
                  const pending = requests.filter((r) => r.status === 'requested').length;
                  const accepted = requests.filter((r) => r.status === 'accepted').length;
                  return (<span>Pending: {pending} • Accepted: {accepted}</span>);
                })()}
              </div>
              <div className="space-y-2">
                {requests.map((r) => (
                  <Card key={r.id} className="p-4 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">R{(r.amount_cents / 100).toFixed(2)} {r.currency}</div>
                        <div className="text-xs text-muted-foreground">{r.group_id} • by {r.requester_id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === 'canceled' ? 'destructive' : r.status === 'accepted' ? 'secondary' : 'default'}>
                          {r.status}
                        </Badge>
                        {r.status === 'requested' && (
                          <>
                            <Button size="sm" onClick={() => onAccept(r)}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => onCancel(r)}>Cancel</Button>
                            <Button size="sm" variant="secondary" onClick={() => onPay(r)}>Mark Paid</Button>
                          </>
                        )}
                        {r.status === 'accepted' && (
                          <Button size="sm" variant="secondary" onClick={() => onPay(r)}>Mark Paid</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {requests.length === 0 && (
                  <div className="text-sm text-muted-foreground">No requests yet.</div>
                )}
              </div>
            </div>
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
                      <Badge variant={getStatusVariant(stokvel.status)}>
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
                    <Badge variant={getStatusVariant(stokvel.status)}>
                      {stokvel.status}
                    </Badge>
                    <Badge variant={getStatusVariant(stokvel.status)}>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;