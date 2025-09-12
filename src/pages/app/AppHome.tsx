import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { 
  MessageCircle, 
  Wallet, 
  Users, 
  Shield, 
  Calendar, 
  Store,
  ArrowRight,
  AlertTriangle,
  Coins,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletSummary } from "@/hooks/useWallet";

const AppHome = () => {
  const quickActions = [
    { icon: MessageCircle, label: "Chats", path: "/app/chats", color: "primary" },
    { icon: Wallet, label: "Wallet", path: "/app/wallet", color: "community" },
    { icon: Users, label: "Rooms", path: "/app/rooms", color: "secondary" },
    { icon: Shield, label: "Safety", path: "/app/rooms", color: "destructive" },
    { icon: Calendar, label: "Events", path: "/app/events", color: "primary" },
    { icon: Store, label: "Business", path: "/app/business", color: "community" }
  ];

  const { data: summary, isLoading: isSummaryLoading } = useWalletSummary();

  const notifications = [
    {
      type: "payment",
      icon: Coins,
      title: "Stokvel Payment Due",
      message: "R150 due for Thabo's group tomorrow",
      time: "2h ago",
      color: "community"
    },
    {
      type: "safety",
      icon: AlertTriangle,
      title: "Safety Alert",
      message: "CPF reports suspicious activity on 5th Ave",
      time: "4h ago",
      color: "destructive"
    },
    {
      type: "event",
      icon: Calendar,
      title: "Community Meeting",
      message: "Ward meeting tomorrow at 6PM",
      time: "1d ago",
      color: "primary"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary': return 'text-primary bg-primary/10 border-primary/20';
      case 'community': return 'text-community bg-community/10 border-community/20';
      case 'secondary': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'destructive': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="KasiLink" />
      
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-community/10 to-secondary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Sawubona, Thabo! 👋
              </h2>
              <p className="text-muted-foreground">
                Your community is active today
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Balance</div>
              {isSummaryLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <div className="text-2xl font-bold text-community">
                  {`R${(summary?.totalBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <Card className="p-4 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
                  <div className={`w-12 h-12 rounded-2xl ${getColorClasses(action.color)} flex items-center justify-center mx-auto mb-3 border-2`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{action.label}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Updates</h3>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <Card key={index} className="p-4 bg-card/80 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${getColorClasses(notification.color)} flex items-center justify-center border-2`}>
                    <notification.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{notification.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Stats */}
        <Card className="p-6 bg-gradient-to-r from-community/10 to-primary/10 border-community/20">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Community</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-community">12</div>
              <div className="text-xs text-muted-foreground">Active Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">Stokvels</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">8</div>
              <div className="text-xs text-muted-foreground">Local Shops</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AppHome;