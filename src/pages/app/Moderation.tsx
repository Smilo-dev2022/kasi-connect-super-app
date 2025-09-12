import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderationStore, type Report } from "@/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const statusColor: Record<Report["status"], string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  reviewing: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  dismissed: "bg-gray-100 text-gray-700 border-gray-200",
};

const Moderation = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setReports(moderationStore.listReports());
  }, []);

  const updateStatus = (id: string, status: Report["status"]) => {
    const updated = moderationStore.updateReport(id, { status });
    if (updated) {
      setReports(moderationStore.listReports());
      toast({ title: "Updated", description: `Status set to ${status}` });
    }
  };

  const clearAll = () => {
    moderationStore.clearReports();
    setReports([]);
    toast({ title: "Cleared", description: "All reports removed" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/30 pb-20">
      <AppHeader title="Moderation" />

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reports</h2>
          <Button variant="outline" size="sm" onClick={clearAll} disabled={reports.length === 0}>Clear All</Button>
        </div>

        {reports.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">No reports yet.</Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{r.targetType.toUpperCase()} • {r.targetId}</h3>
                      <Badge className={statusColor[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Category: <span className="font-medium">{r.category}</span>
                    </p>
                    {r.details && (
                      <p className="text-sm text-foreground">{r.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAtIso).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, "reviewing")}>Reviewing</Button>
                    <Button size="sm" variant="default" onClick={() => updateStatus(r.id, "resolved")}>Resolve</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "dismissed")}>Dismiss</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;
