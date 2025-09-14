import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Users, CheckCircle2, Clock } from "lucide-react";

const chartData = [
  { month: "Jan", verified: 120, pending: 45 },
  { month: "Feb", verified: 180, pending: 50 },
  { month: "Mar", verified: 220, pending: 42 },
  { month: "Apr", verified: 260, pending: 38 },
  { month: "May", verified: 310, pending: 35 },
  { month: "Jun", verified: 355, pending: 28 },
];

const chartConfig = {
  verified: {
    label: "Verified",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--muted-foreground))",
  },
} as const;

const Stat = ({ icon: Icon, label, value }: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Admin Dashboard" showNotifications={false} />
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Stat icon={Users} label="Total Residents" value="8,432" />
          <Stat icon={CheckCircle2} label="Verified" value="6,120" />
          <Stat icon={Clock} label="Pending" value="312" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <defs>
                  <linearGradient id="fillVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-verified)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-verified)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="verified" stroke="var(--color-verified)" fillOpacity={1} fill="url(#fillVerified)" />
                <Area type="monotone" dataKey="pending" stroke="var(--color-pending)" fillOpacity={1} fill="url(#fillPending)" />
                <ChartLegend verticalAlign="bottom" content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

