import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Users, UserPlus, UserMinus, Shield, Crown, User } from "lucide-react";

// Mock data - in real app this would come from API
const mockUserRoles = [
  {
    userId: "user_001",
    userName: "John Moderator",
    email: "john@example.com",
    role: "moderator",
    grantedBy: "admin_001",
    grantedAt: "2024-01-10T10:00:00Z",
    expiresAt: null,
    isActive: true
  },
  {
    userId: "user_002", 
    userName: "Sarah Admin",
    email: "sarah@example.com",
    role: "admin",
    grantedBy: "super_admin_001",
    grantedAt: "2024-01-05T14:30:00Z",
    expiresAt: null,
    isActive: true
  },
  {
    userId: "user_003",
    userName: "Mike TempMod",
    email: "mike@example.com", 
    role: "moderator",
    grantedBy: "admin_001",
    grantedAt: "2024-01-12T09:15:00Z",
    expiresAt: "2024-02-12T09:15:00Z",
    isActive: true
  },
  {
    userId: "user_004",
    userName: "Lisa User",
    email: "lisa@example.com",
    role: "user", 
    grantedBy: "system",
    grantedAt: "2024-01-01T00:00:00Z",
    expiresAt: null,
    isActive: true
  }
];

const rolePermissions = {
  user: ["View content", "Post messages", "Join groups"],
  moderator: ["All user permissions", "Moderate content", "Issue warnings", "Mute users", "Delete messages"],
  admin: ["All moderator permissions", "Ban users", "Manage roles", "Access analytics", "Manage appeals"],
  super_admin: ["All admin permissions", "System configuration", "Manage admins"]
};

const Roles = () => {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [newRoleUserId, setNewRoleUserId] = useState("");
  const [newRoleType, setNewRoleType] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getRoleIcon = (role: string) => {
    const icons = {
      user: User,
      moderator: Shield,
      admin: Crown,
      super_admin: Crown
    };
    
    const Icon = icons[role as keyof typeof icons] || User;
    return <Icon className="h-4 w-4" />;
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      user: "secondary",
      moderator: "default", 
      admin: "destructive",
      super_admin: "destructive"
    } as const;
    
    return <Badge variant={variants[role as keyof typeof variants] || "secondary"}>{role}</Badge>;
  };

  const filteredUsers = mockUserRoles.filter(userRole => {
    const matchesRole = roleFilter === "all" || userRole.role === roleFilter;
    const matchesSearch = userRole.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userRole.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userRole.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleAssignRole = () => {
    console.log("Assigning role:", newRoleType, "to user:", newRoleUserId);
    // In real app, make API call to assign role
    setIsAssignDialogOpen(false);
    setNewRoleUserId("");
    setNewRoleType("");
  };

  const handleRevokeRole = (userId: string) => {
    console.log("Revoking role for user:", userId);
    // In real app, make API call to revoke role
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                Grant a role to a user. Higher roles include all permissions of lower roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">User ID</label>
                <Input
                  placeholder="Enter user ID..."
                  value={newRoleUserId}
                  onChange={(e) => setNewRoleUserId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={newRoleType} onValueChange={setNewRoleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignRole}
                disabled={!newRoleUserId || !newRoleType}
              >
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((userRole) => (
          <Card key={userRole.userId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getRoleIcon(userRole.role)}
                  {userRole.userName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getRoleBadge(userRole.role)}
                  {!userRole.isActive && <Badge variant="outline">Inactive</Badge>}
                </div>
              </div>
              <CardDescription>
                {userRole.email} • ID: {userRole.userId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Permissions:</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  {rolePermissions[userRole.role as keyof typeof rolePermissions]?.map((permission, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Granted by: {userRole.grantedBy} • {new Date(userRole.grantedAt).toLocaleDateString()}
                {userRole.expiresAt && (
                  <> • Expires: {new Date(userRole.expiresAt).toLocaleDateString()}</>
                )}
              </div>

              {userRole.role !== "user" && userRole.role !== "super_admin" && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedUser(selectedUser === userRole.userId ? null : userRole.userId)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {selectedUser === userRole.userId ? "Cancel" : "Manage"}
                  </Button>
                  
                  {selectedUser === userRole.userId && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRevokeRole(userRole.userId)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Revoke Role
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Roles;