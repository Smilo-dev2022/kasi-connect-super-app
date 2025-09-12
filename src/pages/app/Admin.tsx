import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  getDailySubmissionSeries,
  getStatusCounts,
  getStatusDistribution,
  getWards,
  filterRequests,
  setRequestStatus,
  type RequestFilters,
  type VerificationRequest,
} from "@/lib/adminStore";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, CheckCircle2, ShieldCheck, TriangleAlert, Users2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type ActionMode = "approve" | "reject" | null;

const StatusBadge = ({ status }: { status: VerificationRequest["status"] }) => {
  if (status === "approved") return <Badge className="bg-emerald-600 hover:bg-emerald-600">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-rose-600 hover:bg-rose-600">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
};

const Admin = () => {
  const wards = useMemo(() => getWards(), []);

  const [tab, setTab] = useState<string>("dashboard");
  const [filters, setFilters] = useState<RequestFilters>({ status: "all", wardId: "all", query: "" });
  const [requests, setRequests] = useState<VerificationRequest[]>(() => filterRequests(filters));

  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    setRequests(filterRequests(filters));
  }, [filters]);

  const counts = getStatusCounts();
  const dailySeries = getDailySubmissionSeries(10);
  const statusDistribution = getStatusDistribution();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">Admin</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="verification">Ward Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-3xl">{counts.pending}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" /> Awaiting review</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Approved</CardDescription>
                <CardTitle className="text-3xl">{counts.approved}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Verified</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rejected</CardDescription>
                <CardTitle className="text-3xl">{counts.rejected}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-muted-foreground"><TriangleAlert className="h-4 w-4" /> Action needed</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle className="text-3xl">{counts.total}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-muted-foreground"><Users2 className="h-4 w-4" /> All requests</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Submissions</CardTitle>
                <CardDescription>Last 10 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{ submissions: { label: "Submissions", color: "hsl(var(--primary))" } }}
                  className="h-64 w-full"
                >
                  <LineChart data={dailySeries} margin={{ left: 16, right: 16 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent nameKey="submissions" labelKey="submissions" />} />
                    <Line dataKey="submissions" type="monotone" stroke="var(--color-submissions)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Mix</CardTitle>
                <CardDescription>Requests by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    pending: { label: "Pending", color: "hsl(var(--muted-foreground))" },
                    approved: { label: "Approved", color: "#10b981" },
                    rejected: { label: "Rejected", color: "#ef4444" },
                  }}
                  className="h-64 w-full"
                >
                  <RadarChart data={statusDistribution} outerRadius={80}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <Radar name="Pending" dataKey="value" stroke="var(--color-pending)" fill="var(--color-pending)" fillOpacity={0.3} />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ward Verification</CardTitle>
              <CardDescription>Review and verify citizen identity documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search by citizen or document..."
                    value={filters.query}
                    onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                  />
                </div>
                <div>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(v: string) => setFilters((f) => ({ ...f, status: v as RequestFilters["status"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filters.wardId || "all"}
                    onValueChange={(v: string) => setFilters((f) => ({ ...f, wardId: v as RequestFilters["wardId"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {wards.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setFilters({ status: "all", wardId: "all", query: "" })}>Reset</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Citizen</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => {
                      const ward = wards.find((w) => w.id === r.wardId)?.name || r.wardId;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.citizenName}</TableCell>
                          <TableCell>{ward}</TableCell>
                          <TableCell>{r.documentType}</TableCell>
                          <TableCell title={format(new Date(r.submittedAt), "PPpp")}>
                            {formatDistanceToNow(new Date(r.submittedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="secondary" size="sm">Details</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Request Details</DialogTitle>
                                    <DialogDescription>
                                      Citizen verification request overview
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-2 text-sm">
                                    <div><span className="text-muted-foreground">Citizen:</span> {r.citizenName}</div>
                                    <div><span className="text-muted-foreground">Ward:</span> {ward}</div>
                                    <div><span className="text-muted-foreground">Document:</span> {r.documentType}</div>
                                    <div><span className="text-muted-foreground">Submitted:</span> {format(new Date(r.submittedAt), "PPpp")}</div>
                                    <div><span className="text-muted-foreground">Status:</span> {r.status}</div>
                                    {r.reviewedAt && (
                                      <div><span className="text-muted-foreground">Reviewed:</span> {format(new Date(r.reviewedAt), "PPpp")}</div>
                                    )}
                                    {r.reviewerNotes && (
                                      <div><span className="text-muted-foreground">Notes:</span> {r.reviewerNotes}</div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelected(r);
                                  setActionMode("approve");
                                  setNotes("");
                                }}
                                disabled={r.status === "approved"}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelected(r);
                                  setActionMode("reject");
                                  setNotes("");
                                }}
                                disabled={r.status === "rejected"}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={!!actionMode} onOpenChange={(open) => { if (!open) { setActionMode(null); setSelected(null); setNotes(""); } }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{actionMode === "approve" ? "Approve request" : "Reject request"}</DialogTitle>
                <DialogDescription>Optionally add notes for this action.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add reviewer notes (optional)" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setActionMode(null); setSelected(null); setNotes(""); }}>Cancel</Button>
                <Button
                  variant={actionMode === "reject" ? "destructive" : "default"}
                  onClick={() => {
                    if (!selected || !actionMode) return;
                    const updated = setRequestStatus(selected.id, actionMode === "approve" ? "approved" : "rejected", notes || undefined);
                    if (updated) {
                      toast.success(actionMode === "approve" ? "Request approved" : "Request rejected");
                      setRequests(filterRequests(filters));
                      setActionMode(null);
                      setSelected(null);
                      setNotes("");
                    } else {
                      toast.error("Failed to update request");
                    }
                  }}
                >
                  {actionMode === "approve" ? "Confirm Approve" : "Confirm Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;

