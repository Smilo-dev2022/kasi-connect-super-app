import { useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Search } from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";

type WardRecord = {
  id: string;
  name: string;
  ward: string;
  submittedAt: string;
  status: VerificationStatus;
};

const initialData: WardRecord[] = [
  { id: "1", name: "Aisha Bello", ward: "Ward 4", submittedAt: "2025-09-01", status: "pending" },
  { id: "2", name: "John Mensah", ward: "Ward 2", submittedAt: "2025-09-02", status: "pending" },
  { id: "3", name: "Chioma Okeke", ward: "Ward 7", submittedAt: "2025-09-03", status: "verified" },
  { id: "4", name: "Tunde Adeoye", ward: "Ward 3", submittedAt: "2025-09-03", status: "rejected" },
  { id: "5", name: "Maryam Yusuf", ward: "Ward 1", submittedAt: "2025-09-05", status: "pending" },
];

const StatusBadge = ({ status }: { status: VerificationStatus }) => {
  if (status === "verified") return <Badge className="bg-emerald-600">Verified</Badge>;
  if (status === "rejected") return <Badge className="bg-rose-600">Rejected</Badge>;
  return <Badge className="bg-amber-600">Pending</Badge>;
};

const WardVerification = () => {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<WardRecord[]>(initialData);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.ward.toLowerCase().includes(q));
  }, [query, rows]);

  function updateStatus(id: string, next: VerificationStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Ward Verification" showNotifications={false} showSearch={false} />
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending and Recent Submissions</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ward"
                  className="pl-8 w-64"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.ward}</TableCell>
                    <TableCell>{row.submittedAt}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(row.id, "verified")}
                        disabled={row.status === "verified"}
                      >
                        <Check className="h-4 w-4 mr-1" /> Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(row.id, "rejected")}
                        disabled={row.status === "rejected"}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WardVerification;

