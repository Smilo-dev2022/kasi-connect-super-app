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
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Wallet = () => {
  const { t } = useTranslation("common");
  const [showBalance, setShowBalance] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title={t("wallet.title")} />
      
      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <Card className="p-6 bg-gradient-to-r from-community/20 via-primary/10 to-secondary/20 border-community/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-muted-foreground mb-1">{t("wallet.totalBalance")}</h2>
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
              <div className="text-xs text-muted-foreground">{t("wallet.thisMonth")}</div>
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
            <h3 className="text-lg font-semibold text-foreground">{t("wallet.myStokvels")}</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t("actions.joinGroup")}
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
                    <div className="text-xs text-muted-foreground">{t("wallet.groupBalance")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary">R{stokvel.contribution}</div>
                    <div className="text-xs text-muted-foreground">{t("wallet.myContribution")}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-secondary">{stokvel.nextPayout}</div>
                    <div className="text-xs text-muted-foreground">{t("wallet.nextPayout")}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t("wallet.recentTransactions")}</h3>
            <Button variant="ghost" size="sm">
              <History className="w-4 h-4 mr-2" />
              {t("actions.viewAll")}
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
      </div>
    </div>
  );
};

export default Wallet;