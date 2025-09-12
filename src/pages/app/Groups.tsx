import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Star, Search, Crown, Shield } from "lucide-react";

const Groups = () => {
  const myGroups = [
    {
      id: 1,
      name: "Thabo's Stokvel",
      members: 12,
      role: "Admin",
      lastActivity: "2h ago",
      type: "stokvel" as const,
    },
    {
      id: 2,
      name: "Ward 12 CPF",
      members: 2450,
      role: "Member",
      lastActivity: "10m ago",
      type: "community" as const,
    },
    {
      id: 3,
      name: "Ladies Savings Circle",
      members: 8,
      role: "Treasurer",
      lastActivity: "Yesterday",
      type: "stokvel" as const,
    },
  ];

  const discoverGroups = [
    {
      id: 4,
      name: "Youth Development",
      members: 1520,
      verified: true,
      type: "community" as const,
      description: "Opportunities, bursaries and mentorship",
    },
    {
      id: 5,
      name: "Local SMMEs",
      members: 980,
      verified: true,
      type: "business" as const,
      description: "Deals, tenders and supplier directory",
    },
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "stokvel":
        return "bg-community/10 text-community border-community/20";
      case "community":
        return "bg-primary/10 text-primary border-primary/20";
      case "business":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted/50 text-muted-foreground border-muted";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Groups" showSearch={true} />

      <div className="p-4 space-y-6">
        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
          <Button className="flex-1" variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Find Groups
          </Button>
        </div>

        {/* My Groups */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">My Groups</h3>
          <div className="space-y-2">
            {myGroups.map((group) => (
              <Card key={group.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      <Users className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{group.name}</h4>
                      <div className={`px-2 py-0.5 rounded-full text-xs border ${getTypeBadge(group.type)}`}>
                        {group.type}
                      </div>
                      {group.role === "Admin" || group.role === "Treasurer" ? (
                        <div className="p-1 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                          <Crown className="w-3 h-3" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{group.members.toLocaleString()} members</span>
                      <span>Last active {group.lastActivity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{group.role}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Discover */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Discover</h3>
          <div className="space-y-2">
            {discoverGroups.map((group) => (
              <Card key={group.id} className="p-4 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      <Users className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">{group.name}</h4>
                      <div className={`px-2 py-0.5 rounded-full text-xs border ${getTypeBadge(group.type)}`}>
                        {group.type}
                      </div>
                      {group.verified && (
                        <div className="p-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                          <Shield className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">{group.description}</p>
                    <div className="text-xs text-muted-foreground">{group.members.toLocaleString()} members</div>
                  </div>
                  <div className="text-right">
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;

