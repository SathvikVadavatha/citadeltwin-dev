
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Users, Plus, UserCheck, UserX, Settings, Eye, Edit, Crown } from 'lucide-react';
import { useCollaboration } from '@/hooks/useCollaboration';

interface CollaborationPanelProps {
  projectId: string;
}

export const CollaborationPanel = ({ projectId }: CollaborationPanelProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<'view' | 'edit'>('view');

  const {
    sessions,
    activeSession,
    userPresence,
    loading,
    createSession,
    joinSession,
    leaveSession,
    grantPermission,
  } = useCollaboration(projectId);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    const session = await createSession({
      project_id: projectId,
      name: sessionName,
      settings: {},
    });

    if (session) {
      setSessionName('');
      setShowCreateModal(false);
      await joinSession(session.id);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    await joinSession(sessionId);
  };

  const handleLeaveSession = async () => {
    await leaveSession();
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'edit':
        return <Edit className="w-4 h-4 text-green-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50';
      case 'edit':
        return 'bg-green-500/20 text-green-400 border-green-400/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading collaboration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground glow-cyan">Real-time Collaboration</h2>
          <p className="text-muted-foreground">Collaborate with your team in real-time</p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="cyber-button">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="gradient-border">
            <DialogHeader>
              <DialogTitle className="glow-cyan">Create Collaboration Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="cyber-button"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="cyber-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!sessionName.trim()}
                  className="cyber-button bg-primary text-primary-foreground"
                >
                  Create Session
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Session Status */}
      {activeSession && (
        <Card className="gradient-border glow-cyan">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-green-400" />
                <div>
                  <CardTitle className="text-lg">{activeSession.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Active collaboration session</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLeaveSession}
                className="cyber-button hover:bg-destructive/20"
              >
                <UserX className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Online Users */}
              <div>
                <Label className="text-sm font-medium">Online Users ({userPresence.length})</Label>
                <div className="mt-2 space-y-2">
                  {userPresence.map((presence) => (
                    <div key={presence.id} className="flex items-center space-x-3 p-2 rounded border border-border">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: presence.user_color }}
                      />
                      <span className="flex-1 text-sm">
                        {(presence as any).profiles?.full_name || 'Anonymous User'}
                      </span>
                      <Badge variant="outline">
                        {presence.is_active ? 'Online' : 'Away'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Invite Users */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Invite Users</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="flex-1 cyber-button"
                  />
                  <Select value={newUserPermission} onValueChange={(value: 'view' | 'edit') => setNewUserPermission(value)}>
                    <SelectTrigger className="w-24 cyber-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="cyber-button">
                    Invite
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Sessions */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Available Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
              <p className="text-muted-foreground mb-4">
                Create a new collaboration session to work with your team.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeSession?.id === session.id ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/50">
                        Active
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(session.id)}
                        className="cyber-button"
                      >
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
