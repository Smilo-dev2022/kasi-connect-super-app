import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
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
import { walletsApi, type GroupWallet, type LedgerEntry } from "@/lib/api";

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(true);
  const cards = [
    { brand: "KasiLink Debit", last4: "4821", balance: 1250.5, gradient: "from-community via-primary to-secondary" },
    { brand: "Savings", last4: "9013", balance: 5600, gradient: "from-primary via-secondary to-community" },
    { brand: "Stokvel Pool", last4: "2745", balance: 22500, gradient: "from-secondary via-primary to-community" }
  ];

  const quickActions = [
    { icon: Send, label: "Send", color: "primary" },
    { icon: ArrowDownLeft, label: "Receive", color: "community" },
    { icon: CreditCard, label: "Pay Bill", color: "secondary" },
    { icon: Smartphone, label: "Airtime", color: "primary" }
  ];

  const [groupWallets, setGroupWallets] = useState<GroupWallet[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<GroupWallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isContributing, setIsContributing] = useState(false);

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

  const transactions = [
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
  ];

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

  useEffect(() => {
    let mounted = true;
    walletsApi
      .list()
      .then((ws) => {
        if (mounted) setGroupWallets(ws);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateGroup = async () => {
    const name = window.prompt("Stokvel group name?");
    if (!name) return;
    const membersCsv = window.prompt("Members (comma-separated emails or names)?", "");
    const members = membersCsv ? membersCsv.split(",").map((s) => s.trim()).filter(Boolean) : [];
    try {
      const wallet = await walletsApi.create(name, members);
      setGroupWallets((prev) => [wallet, ...prev]);
    } catch (e) {
      console.error(e);
      alert(
        "Could not create group. Is the backend running on " + String((import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:4000')
      );
    }
  };

  const openWallet = async (wallet: GroupWallet) => {
    setSelectedWallet(wallet);
    setDrawerOpen(true);
    try {
      const entries = await walletsApi.ledger(wallet.id);
      setLedger(entries);
    } catch {
      setLedger([]);
    }
  };

  const handleContribute = async () => {
    if (!selectedWallet) return;
    const amtStr = window.prompt("Contribution amount (R)");
    if (!amtStr) return;
    const amount = Number(amtStr);
    if (!Number.isFinite(amount) || amount <= 0) return alert("Invalid amount");
    const member = window.prompt("Your name (for record)") || "Member";
    try {
      setIsContributing(true);
      await walletsApi.contribute(selectedWallet.id, amount, member);
      // refresh wallet + ledger
      const wallets = await walletsApi.list();
      const updated = wallets.find((w) => w.id === selectedWallet.id) || selectedWallet;
      setSelectedWallet(updated);
      const entries = await walletsApi.ledger(selectedWallet.id);
      setLedger(entries);
    } catch (e) {
      console.error(e);
      alert("Contribution failed");
    } finally {
      setIsContributing(false);
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
                <Button variant="outline" size="sm" onClick={handleCreateGroup}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
              <div className="space-y-3">
                {(groupWallets.length ? groupWallets.map((gw) => ({
                  _wallet: gw,
                  name: gw.name,
                  members: gw.members.length,
                  balance: gw.balance,
                  contribution: 0,
                  nextPayout: "—",
                  status: "active"
                })) : stokvels).map((stokvel: any, index) => (
                  <Card key={index} className="p-4 bg-card/80 backdrop-blur-sm cursor-pointer" onClick={() => stokvel._wallet && openWallet(stokvel._wallet)}>
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

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="p-4">
          <DrawerHeader>
            <DrawerTitle>{selectedWallet?.name}</DrawerTitle>
            <DrawerDescription>
              Members: {selectedWallet?.members.length ?? 0} • Balance: R{selectedWallet?.balance.toLocaleString()}
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {ledger.length === 0 && (
              <div className="text-sm text-muted-foreground">No ledger entries yet.</div>
            )}
            {ledger.map((e) => (
              <Card key={e.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium capitalize">{e.type}</div>
                  <div className="text-xs text-muted-foreground">{e.member || "—"} • {new Date(e.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm font-bold">{['payout','expense'].includes(e.type) ? '-' : '+'}R{e.amount}</div>
              </Card>
            ))}
          </div>
          <DrawerFooter>
            <Button onClick={handleContribute} disabled={!selectedWallet || isContributing}>{isContributing ? 'Processing...' : 'Contribute'}</Button>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Wallet;