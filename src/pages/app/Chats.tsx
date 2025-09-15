import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Shield, 
  MessageCircle, 
  Plus,
  Check,
  CheckCheck,
  Clock,
  Star
} from "lucide-react";

const Chats = () => {
  const demoMode = ((import.meta as any)?.env?.VITE_DEMO ?? 'false') === 'true';
  const chatGroups = demoMode ? [
    {
      id: 1,
      name: "Family WhatsApp",
      type: "personal",
      avatar: "👨‍👩‍👧‍👦",
      lastMessage: "Mama: Don't forget Sunday lunch",
      time: "10:30",
      unread: 2,
      verified: false,
      online: true
    },
    {
      id: 2,
      name: "Thabo's Stokvel",
      type: "stokvel",
      avatar: "💰",
      lastMessage: "Payment reminder for December",
      time: "09:45",
      unread: 0,
      verified: true,
      online: false
    },
    {
      id: 3,
      name: "Ward 12 CPF",
      type: "community",
      avatar: "🛡️",
      lastMessage: "Safety patrol schedule updated",
      time: "08:15",
      unread: 5,
      verified: true,
      online: true
    },
    {
      id: 4,
      name: "Sonto (Neighbor)",
      type: "personal",
      avatar: "S",
      lastMessage: "Can you help with the groceries?",
      time: "Yesterday",
      unread: 1,
      verified: false,
      online: false
    },
    {
      id: 5,
      name: "Methodist Church Group",
      type: "community",
      avatar: "⛪",
      lastMessage: "Service starts at 9AM tomorrow",
      time: "Yesterday",
      unread: 0,
      verified: true,
      online: true
    },
    {
      id: 6,
      name: "ANC Branch 45",
      type: "political",
      avatar: "🏛️",
      lastMessage: "Meeting postponed to next week",
      time: "2 days ago",
      unread: 0,
      verified: true,
      online: false
    }
  ] : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'stokvel': return 'bg-community/10 text-community border-community/20';
      case 'community': return 'bg-primary/10 text-primary border-primary/20';
      case 'political': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stokvel': return Users;
      case 'community': case 'political': return Shield;
      default: return MessageCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Chats" showSearch={true} />
      
      <div className="p-4 space-y-4">
        {/* Create New Chat */}
        <Button variant="hero" className="w-full justify-center gap-2 py-6">
          <Plus className="w-5 h-5" />
          Start New Chat
        </Button>

        {/* Chat Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Personal', 'Stokvels', 'Community', 'Verified'].map((category) => (
            <Badge
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              className="px-4 py-2 whitespace-nowrap cursor-pointer hover:bg-primary/20"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Chat List */}
        <div className="space-y-2">
          {chatGroups.map((chat) => {
            const TypeIcon = getTypeIcon(chat.type);
            
            return (
              <Card key={chat.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-lg">
                        {chat.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-community rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                      {chat.verified && (
                        <div className={`p-1 rounded-full border ${getTypeColor(chat.type)}`}>
                          <Star className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {chat.type !== 'personal' && (
                        <TypeIcon className="w-3 h-3 text-muted-foreground" />
                      )}
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                  </div>

                  {/* Time & Status */}
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                    <div className="flex items-center gap-1">
                      {chat.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground w-5 h-5 p-0 flex items-center justify-center text-xs">
                          {chat.unread}
                        </Badge>
                      )}
                      {chat.id <= 2 && (
                        <CheckCheck className="w-4 h-4 text-community" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Emergency Contact */}
        <Card className="p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Emergency Contacts</h3>
              <p className="text-sm text-muted-foreground">Police • Ambulance • Community Patrol</p>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
              Call
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chats;