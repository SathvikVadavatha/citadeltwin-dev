
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Share2, 
  Mail, 
  Eye, 
  MessageSquare, 
  CheckCircle,
  Copy,
  Send,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectSharing } from '@/hooks/useProjectSharing';

interface ProjectSharingManagerProps {
  projectId: string;
}

export const ProjectSharingManager: React.FC<ProjectSharingManagerProps> = ({ projectId }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState({
    can_view: true,
    can_comment: false,
    can_approve: false,
  });
  const [expirationDays, setExpirationDays] = useState('30');
  
  const { shares, shareProject, revokeShare, loading } = useProjectSharing(projectId);

  const handleShareProject = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    await shareProject({
      email,
      message,
      permissions,
      expirationDays: parseInt(expirationDays),
    });

    // Reset form
    setEmail('');
    setMessage('');
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const shareLink = `${baseUrl}/shared/${projectId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Share Project Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Client Email</Label>
            <Input
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Personal Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal message for the client..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>View Project</span>
                </div>
                <Switch
                  checked={permissions.can_view}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_view: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Submit Feedback</span>
                </div>
                <Switch
                  checked={permissions.can_comment}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_comment: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve Changes</span>
                </div>
                <Switch
                  checked={permissions.can_approve}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_approve: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Access Duration</Label>
            <Select value={expirationDays} onValueChange={setExpirationDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleShareProject} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              Share Project
            </Button>
            <Button variant="outline" onClick={generateShareLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Shares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared With
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Project not shared with anyone yet</p>
              </div>
            ) : (
              shares.map((share: any) => (
                <div key={share.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{share.shared_with_email}</span>
                      <Badge variant={share.status === 'active' ? 'default' : 'secondary'}>
                        {share.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {share.permissions.can_view && (
                        <Badge variant="outline" className="text-xs">View</Badge>
                      )}
                      {share.permissions.can_comment && (
                        <Badge variant="outline" className="text-xs">Comment</Badge>
                      )}
                      {share.permissions.can_approve && (
                        <Badge variant="outline" className="text-xs">Approve</Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => revokeShare(share.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
