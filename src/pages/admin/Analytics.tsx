import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart3, TrendingUp, Users, AlertTriangle, MessageSquare, Shield } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data - in real app this would come from API
const mockMetrics = {
  users: {
    total: 15420,
    active: 8930,
    new: 234
  },
  content: {
    messages: 45680,
    groups: 1250,
    reports: 89
  },
  moderation: {
    actionsToday: 12,
    pendingReports: 23,
    activeAppeals: 5
  }
};

const mockChartData = [
  { date: '2024-01-08', users: 8800, messages: 4200, reports: 8 },
  { date: '2024-01-09', users: 8850, messages: 4350, reports: 12 },
  { date: '2024-01-10', users: 8900, messages: 4100, reports: 7 },
  { date: '2024-01-11', users: 8920, messages: 4400, reports: 15 },
  { date: '2024-01-12', users: 8950, messages: 4250, reports: 9 },
  { date: '2024-01-13', users: 8980, messages: 4500, reports: 11 },
  { date: '2024-01-14', users: 8930, messages: 4300, reports: 6 }
];

const mockModerationData = [
  { action: 'Warnings', count: 45 },
  { action: 'Mutes', count: 23 },
  { action: 'Bans', count: 8 },
  { action: 'Deletions', count: 67 }
];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [activeChart, setActiveChart] = useState<"users" | "content" | "moderation">("users");

  const getMetricIcon = (type: string) => {
    const icons = {
      users: Users,
      messages: MessageSquare,
      reports: AlertTriangle,
      moderation: Shield
    };
    
    const Icon = icons[type as keyof typeof icons] || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Platform metrics and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            {getMetricIcon("users")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{mockMetrics.users.new} today
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            {getMetricIcon("users")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.users.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((mockMetrics.users.active / mockMetrics.users.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            {getMetricIcon("messages")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.content.messages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total messages sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            {getMetricIcon("reports")}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.moderation.pendingReports}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">
                {mockMetrics.moderation.actionsToday} actions today
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveChart("users")}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeChart === "users" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          User Activity
        </button>
        <button
          onClick={() => setActiveChart("content")}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeChart === "content" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Content Activity
        </button>
        <button
          onClick={() => setActiveChart("moderation")}
          className={`px-3 py-2 text-sm rounded-md transition-colors ${
            activeChart === "moderation" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
        >
          Moderation Stats
        </button>
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        {activeChart === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Active Users Trend</CardTitle>
              <CardDescription>Daily active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {activeChart === "content" && (
          <Card>
            <CardHeader>
              <CardTitle>Content Activity</CardTitle>
              <CardDescription>Messages and reports over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Messages"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reports" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Reports"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {activeChart === "moderation" && (
          <Card>
            <CardHeader>
              <CardTitle>Moderation Actions</CardTitle>
              <CardDescription>Breakdown of moderation actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockModerationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Summary</CardTitle>
            <CardDescription>Current moderation workload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Pending Reports</span>
              <span className="font-medium">{mockMetrics.moderation.pendingReports}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Appeals</span>
              <span className="font-medium">{mockMetrics.moderation.activeAppeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Actions Today</span>
              <span className="font-medium">{mockMetrics.moderation.actionsToday}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>Key health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">User Engagement</span>
              <span className="font-medium text-green-600">High</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Report Rate</span>
              <span className="font-medium text-yellow-600">Normal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Response Time</span>
              <span className="font-medium text-green-600">Good</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;