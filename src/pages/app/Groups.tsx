import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, Shield, Wallet, QrCode, KeyRound } from "lucide-react";
import { useState } from "react";

interface GroupItem {
  id: number;
  name: string;
  type: "stokvel" | "community" | "personal";
  members: number;
  verified?: boolean;
  description?: string;
}

const Groups = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [groups, setGroups] = useState<GroupItem[]>([
    { id: 1, name: "Thabo's Investment Group", type: "stokvel", members: 12, verified: true, description: "R150 monthly contribution" },
    { id: 2, name: "Ward 12 CPF", type: "community", members: 2450, verified: true, description: "Community safety updates" },
    { id: 3, name: "Family Chat", type: "personal", members: 6, description: "Family updates and events" }
  ]);

  const getTypeBadge = (type: GroupItem["type"]) => {
    switch (type) {
      case "stokvel":
        return <Badge className="bg-community text-community-foreground">Stokvel</Badge>;
      case "community":
        return <Badge className="bg-primary text-primary-foreground">Community</Badge>;
      default:
        return <Badge variant="outline">Personal</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Groups" />

      <div className="p-4 space-y-6">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="hero" className="w-full justify-center gap-2 py-6" onClick={() => setCreateOpen(true)}>
            <Plus className="w-5 h-5" />
            Create Group
          </Button>
          <Button variant="outline" className="w-full justify-center gap-2 py-6" onClick={() => setJoinOpen(true)}>
            <KeyRound className="w-5 h-5" />
            Join Group
          </Button>
        </div>

        {/* My Groups */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">My Groups</h3>
          <div className="space-y-3">
            {groups.map((g) => (
              <Card key={g.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{g.name}</h4>
                      {getTypeBadge(g.type)}
                    </div>
                    <div className="text-sm text-muted-foreground">{g.members.toLocaleString()} members</div>
                    {g.description && (
                      <div className="text-sm text-muted-foreground mt-1">{g.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {g.type === "stokvel" && (
                      <Button size="sm" variant="outline" className="gap-2">
                        <Wallet className="w-4 h-4" />
                        View Wallet
                      </Button>
                    )}
                    <Button size="sm" variant="community">Open</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Start a stokvel or community chat</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Group name" />
            <Textarea placeholder="Description (optional)" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">Personal</Button>
              <Button variant="outline">Community</Button>
              <Button variant="outline">Stokvel</Button>
            </div>
            <div className="text-xs text-muted-foreground">You can invite members after creating the group.</div>
            <div className="flex justify-end">
              <Button onClick={() => setCreateOpen(false)} variant="community">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join a group</DialogTitle>
            <DialogDescription>Use an invite code or scan a QR</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Enter invite code" />
            <Button variant="outline" className="gap-2">
              <QrCode className="w-4 h-4" />
              Scan QR (placeholder)
            </Button>
            <div className="flex justify-end">
              <Button onClick={() => setJoinOpen(false)} variant="community">Join</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;

