import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertTriangle, Eye, UserX, MessageSquareX, Clock, CheckCircle } from "lucide-react";

// Mock data - in real app this would come from API
const mockReports = [
  {
    id: "1",
    contentId: "msg_123",
    contentText: "Inappropriate message content here...",
    reason: "harassment",
    reporterId: "user_42",
    status: "open",
    createdAt: "2024-01-15T10:30:00Z",
    targetType: "message"
  },
  {
    id: "2", 
    contentId: "user_456",
    contentText: "User profile contains offensive content",
    reason: "spam",
    reporterId: "user_78",
    status: "triaged",
    createdAt: "2024-01-15T09:15:00Z",
    targetType: "user"
  },
  {
    id: "3",
    contentId: "group_789",
    contentText: "Group name violates community guidelines",
    reason: "inappropriate_content",
    reporterId: "user_90",
    status: "closed",
    createdAt: "2024-01-14T16:45:00Z",
    targetType: "group"
  }
];

const mockActions = [
  {
    id: "1",
    targetType: "message",
    targetId: "msg_123",
    actionType: "delete",
    moderatorId: "mod_001",
    reason: "Violated harassment policy",
    createdAt: "2024-01-15T11:00:00Z",
    isActive: true
  },
  {
    id: "2",
    targetType: "user", 
    targetId: "user_456",
    actionType: "mute",
    moderatorId: "mod_002",
    reason: "Repeated spam violations",
    durationHours: 24,
    createdAt: "2024-01-15T10:00:00Z",
    isActive: true
  }
];

const Moderation = () => {
  const [activeTab, setActiveTab] = useState<"reports" | "actions">("reports");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      triaged: "default", 
      closed: "secondary"
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>;
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      delete: MessageSquareX,
      mute: UserX,
      ban: UserX,
      warn: AlertTriangle
    };
    
    const Icon = icons[actionType as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  const filteredReports = mockReports.filter(report => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesSearch = report.contentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Moderation Center</h1>
        <p className="text-muted-foreground">Manage reports and moderation actions</p>
      </div>

      <div className="flex space-x-4">
        <Button 
          variant={activeTab === "reports" ? "default" : "outline"}
          onClick={() => setActiveTab("reports")}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reports
        </Button>
        <Button 
          variant={activeTab === "actions" ? "default" : "outline"}
          onClick={() => setActiveTab("actions")}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Actions
        </Button>
      </div>

      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Report #{report.id} - {report.targetType}
                    </CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardDescription>
                    Reason: {report.reason} • Reported {new Date(report.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 p-3 bg-muted rounded">
                    {report.contentText}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button size="sm" variant="outline">
                      <UserX className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "actions" && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {mockActions.map((action) => (
              <Card key={action.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getActionIcon(action.actionType)}
                      {action.actionType.charAt(0).toUpperCase() + action.actionType.slice(1)} - {action.targetType}
                    </CardTitle>
                    <Badge variant={action.isActive ? "default" : "secondary"}>
                      {action.isActive ? "Active" : "Expired"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Target: {action.targetId} • By: {action.moderatorId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{action.reason}</p>
                  {action.durationHours && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration: {action.durationHours} hours
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(action.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Moderation;