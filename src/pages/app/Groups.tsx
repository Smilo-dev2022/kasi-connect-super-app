import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Briefcase, GraduationCap, FileText, Plus, Search } from "lucide-react";

type Group = {
  id: number;
  name: string;
  description: string;
  members: number;
  verified?: boolean;
  category: "community" | "safety" | "employment" | "education" | "business" | "stokvel" | "personal";
  unread?: number;
};

const demoMode = ((import.meta as any)?.env?.VITE_DEMO ?? 'false') === 'true';
const groupsSeed: Group[] = demoMode ? [
  { id: 1, name: "Ward 12 CPF", description: "Community policing forum updates", members: 2450, verified: true, category: "safety", unread: 3 },
  { id: 2, name: "Thabo's Stokvel", description: "Monthly savings circle", members: 12, verified: true, category: "stokvel", unread: 1 },
  { id: 3, name: "Jobs Room", description: "Local job posts and career help", members: 1820, verified: true, category: "employment" },
  { id: 4, name: "Education Room", description: "Courses, bursaries and tips", members: 3100, verified: true, category: "education" },
  { id: 5, name: "Sonto (Neighbor)", description: "Personal chat", members: 2, category: "personal" },
  { id: 6, name: "SMME Tenders", description: "Business tenders and notices", members: 890, verified: true, category: "business" },
]: [];

const categoryToIcon: Record<string, any> = {
  safety: Shield,
  employment: Briefcase,
  education: GraduationCap,
  business: FileText,
  community: Users,
  stokvel: Users,
  personal: Users,
};

const Groups = () => {
  const [query, setQuery] = useState("");

  const filtered = groupsSeed.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  const renderGroupCard = (group: Group) => {
    const Icon = categoryToIcon[group.category] || Users;
    return (
      <Card key={group.id} className="p-4 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{group.name}</h4>
              {group.verified && (
                <Badge className="bg-primary text-primary-foreground">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{group.description}</p>
            <div className="text-xs text-muted-foreground mt-1">{group.members.toLocaleString()} members</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {group.unread ? (
              <Badge className="bg-primary text-primary-foreground">{group.unread}</Badge>
            ) : null}
            <Button variant="outline" size="sm">Join</Button>
          </div>
        </div>
      </Card>
    );
  };

  const sections: { key: string; label: string; filter: (g: Group) => boolean }[] = [
    { key: "all", label: "All", filter: () => true },
    { key: "stokvel", label: "Stokvels", filter: (g) => g.category === "stokvel" },
    { key: "community", label: "Community", filter: (g) => ["community", "safety"].includes(g.category) },
    { key: "work", label: "Work", filter: (g) => ["employment", "business"].includes(g.category) },
    { key: "education", label: "Education", filter: (g) => g.category === "education" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Groups" />

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search groups"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          </div>
          <Button variant="hero" className="gap-2"><Plus className="w-4 h-4" /> New</Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            {sections.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsContent key={s.key} value={s.key}>
              <div className="space-y-2">
                {filtered.filter(s.filter).map(renderGroupCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Groups;

