import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tantml:react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function WorldPermissions({ worldId, currentWorld }) {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("player");

  const { data: permissions = [] } = useQuery({
    queryKey: ['worldPermissions', worldId],
    queryFn: () => base44.entities.WorldPermission.filter({ world_id: worldId }),
    enabled: !!worldId
  });

  const addUserMutation = useMutation({
    mutationFn: (data) => base44.entities.WorldPermission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldPermissions', worldId] });
      toast.success("User added to world");
      setNewUserEmail("");
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: (id) => base44.entities.WorldPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worldPermissions', worldId] });
      toast.success("User removed");
    }
  });

  const handleAddUser = () => {
    if (!newUserEmail.trim()) {
      toast.error("Enter an email address");
      return;
    }
    addUserMutation.mutate({
      world_id: worldId,
      user_email: newUserEmail.trim(),
      role: newUserRole,
      can_edit: newUserRole === "gm" || newUserRole === "co_gm"
    });
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-300 flex items-center gap-2">
          <Users className="w-5 h-5" />
          World Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Invite User</Label>
          <div className="flex gap-2">
            <Input
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="bg-slate-700/50 border-slate-600 text-white"
            />
            <Select value={newUserRole} onValueChange={setNewUserRole}>
              <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gm">GM</SelectItem>
                <SelectItem value="co_gm">Co-GM</SelectItem>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddUser}
              disabled={addUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Current Users</Label>
          {permissions.length === 0 ? (
            <p className="text-slate-400 text-sm">No additional users. Invite collaborators above.</p>
          ) : (
            permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded border border-slate-600"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{perm.user_email}</p>
                  <Badge className={`mt-1 text-xs ${
                    perm.role === 'gm' ? 'bg-purple-600' :
                    perm.role === 'co_gm' ? 'bg-blue-600' :
                    perm.role === 'player' ? 'bg-green-600' :
                    'bg-slate-600'
                  }`}>
                    {perm.role.replace('_', '-').toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUserMutation.mutate(perm.id)}
                  disabled={removeUserMutation.isPending}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}