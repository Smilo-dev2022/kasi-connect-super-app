import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { 
  Shield, 
  Briefcase, 
  GraduationCap, 
  FileText,
  AlertTriangle,
  Users,
  Star,
  Bell,
  Clock,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Rooms = () => {
  const navigate = useNavigate();
  const demoMode = ((import.meta as any)?.env?.VITE_DEMO ?? 'false') === 'true';
  const communityRooms = demoMode ? [
    {
      id: 1,
      name: "Safety Room",
      icon: Shield,
      description: "CPF alerts and community safety updates",
      members: 2450,
      unread: 5,
      lastActivity: "5 min ago",
      verified: true,
      category: "safety",
      color: "destructive"
    },
    {
      id: 2,
      name: "Jobs Room",
      icon: Briefcase,
      description: "Verified job opportunities and career advice",
      members: 1820,
      unread: 12,
      lastActivity: "15 min ago",
      verified: true,
      category: "employment",
      color: "community"
    },
    {
      id: 3,
      name: "Education Room",
      icon: GraduationCap,
      description: "Courses, bursaries, and school notices",
      members: 3100,
      unread: 3,
      lastActivity: "1h ago",
      verified: true,
      category: "education",
      color: "primary"
    },
    {
      id: 4,
      name: "Tenders Room",
      icon: FileText,
      description: "SMME opportunities and business tenders",
      members: 890,
      unread: 0,
      lastActivity: "2h ago",
      verified: true,
      category: "business",
      color: "secondary"
    }
  ] : [];

  const recentAlerts = demoMode ? [
    {
      type: "safety",
      icon: AlertTriangle,
      title: "Safety Alert",
      message: "Suspicious activity reported on Main Road",
      time: "5 min ago",
      location: "Ward 12, Main Road",
      urgent: true
    },
    {
      type: "job",
      icon: Briefcase,
      title: "New Job Posting",
      message: "Retail Assistant position available",
      time: "30 min ago",
      location: "Maponya Mall",
      urgent: false
    },
    {
      type: "education",
      icon: GraduationCap,
      title: "Bursary Application",
      message: "University applications closing soon",
      time: "2h ago",
      location: "Various Universities",
      urgent: false
    }
  ] : [];

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
      <AppHeader title="Community Rooms" showNotifications={true} />
      
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 via-community/10 to-secondary/10 border-primary/20">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">8,260</div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-community">4</div>
              <div className="text-sm text-muted-foreground">Active Rooms</div>
            </div>
          </div>
        </Card>

        {/* Recent Alerts */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Latest Updates
          </h3>
          <div className="space-y-3">
            {recentAlerts.map((alert, index) => (
              <Card key={index} className={`p-4 bg-card/80 backdrop-blur-sm border-l-4 ${
                alert.urgent ? 'border-l-destructive' : 'border-l-primary'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                    alert.type === 'safety' ? getColorClasses('destructive') :
                    alert.type === 'job' ? getColorClasses('community') :
                    getColorClasses('primary')
                  }`}>
                    <alert.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{alert.title}</h4>
                      {alert.urgent && (
                        <Badge className="bg-destructive text-destructive-foreground">Urgent</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {alert.location}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Community Rooms */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Community Rooms</h3>
          <div className="space-y-3">
            {communityRooms.map((room) => (
              <Card key={room.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${getColorClasses(room.color)} flex items-center justify-center border-2`}>
                    <room.icon className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{room.name}</h4>
                      {room.verified && (
                        <div className="p-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                          <Star className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">{room.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.members.toLocaleString()} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {room.lastActivity}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {room.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground mb-2">
                        {room.unread}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => navigate(`/app/chat/${encodeURIComponent(room.name.replace(/\s+/g, '-').toLowerCase())}`)}>
                      Join Room
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="p-4 bg-gradient-to-r from-destructive/20 to-destructive/10 border-destructive/30">
          <div className="text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Emergency Services</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quick access to police, medical, and community patrol services
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                Police 10111
              </Button>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                Ambulance 10177
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Rooms;