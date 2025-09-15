import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Scale, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";

// Mock data - in real app this would come from API
const mockAppeals = [
  {
    id: "1",
    moderationActionId: "action_123",
    appellantId: "user_456",
    reason: "I believe this action was taken in error. The content was meant to be satirical and not harmful.",
    status: "pending",
    reviewedBy: null,
    reviewNotes: null,
    createdAt: "2024-01-15T14:30:00Z",
    reviewedAt: null,
    originalAction: {
      actionType: "mute",
      reason: "Inappropriate content",
      durationHours: 24
    }
  },
  {
    id: "2",
    moderationActionId: "action_456", 
    appellantId: "user_789",
    reason: "The message was taken out of context. I was actually trying to help someone who was being harassed.",
    status: "under_review",
    reviewedBy: "mod_001",
    reviewNotes: null,
    createdAt: "2024-01-14T16:45:00Z",
    reviewedAt: null,
    originalAction: {
      actionType: "delete",
      reason: "Harassment",
      durationHours: null
    }
  },
  {
    id: "3",
    moderationActionId: "action_789",
    appellantId: "user_012",
    reason: "I was defending myself against trolls. The ban seems excessive for the situation.",
    status: "denied",
    reviewedBy: "mod_002",
    reviewNotes: "After review, the original action was appropriate. Multiple warnings were ignored.",
    createdAt: "2024-01-13T09:15:00Z",
    reviewedAt: "2024-01-14T10:30:00Z",
    originalAction: {
      actionType: "ban",
      reason: "Repeated violations",
      durationHours: 168 // 7 days
    }
  }
];

const Appeals = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppeal, setSelectedAppeal] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "destructive",
      under_review: "default",
      approved: "default",
      denied: "secondary"
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      under_review: MessageSquare,
      approved: CheckCircle,
      denied: XCircle
    };
    
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const filteredAppeals = mockAppeals.filter(appeal => {
    const matchesStatus = statusFilter === "all" || appeal.status === statusFilter;
    const matchesSearch = appeal.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appeal.appellantId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApproveAppeal = (appealId: string) => {
    console.log("Approving appeal:", appealId);
    // In real app, make API call to approve appeal
  };

  const handleDenyAppeal = (appealId: string) => {
    console.log("Denying appeal:", appealId, "with notes:", reviewNotes);
    // In real app, make API call to deny appeal with notes
    setReviewNotes("");
    setSelectedAppeal(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Appeals Management</h1>
        <p className="text-muted-foreground">Review and process user appeals for moderation actions</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search appeals..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredAppeals.map((appeal) => (
          <Card key={appeal.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Appeal #{appeal.id}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(appeal.status)}
                  {getStatusBadge(appeal.status)}
                </div>
              </div>
              <CardDescription>
                User: {appeal.appellantId} • Original Action: {appeal.originalAction.actionType}
                {appeal.originalAction.durationHours && ` (${appeal.originalAction.durationHours}h)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Original Action Reason:</h4>
                <p className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                  {appeal.originalAction.reason}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Appeal Reason:</h4>
                <p className="text-sm p-3 bg-muted rounded">
                  {appeal.reason}
                </p>
              </div>

              {appeal.reviewNotes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Review Notes:</h4>
                  <p className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                    {appeal.reviewNotes}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(appeal.createdAt).toLocaleString()}
                {appeal.reviewedAt && (
                  <> • Reviewed: {new Date(appeal.reviewedAt).toLocaleString()}</>
                )}
              </div>

              {appeal.status === "pending" || appeal.status === "under_review" ? (
                <div className="space-y-3">
                  {selectedAppeal === appeal.id && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add review notes (required for denial)..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {selectedAppeal !== appeal.id ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedAppeal(appeal.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleApproveAppeal(appeal.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDenyAppeal(appeal.id)}
                          disabled={!reviewNotes.trim()}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Deny
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAppeal(null);
                            setReviewNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <Badge variant="outline">
                    {appeal.status === "approved" ? "Resolved - Action Reversed" : "Resolved - Action Upheld"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Appeals;