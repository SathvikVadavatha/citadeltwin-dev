
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useSecurity } from '@/hooks/useSecurity';
import { AlertTriangle, Shield, CheckCircle, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const SecurityEventsPanel: React.FC = () => {
  const { securityEvents, securityEventsLoading, logSecurityEvent, resolveSecurityEvent } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: ''
  });

  const filteredEvents = securityEvents?.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'resolved' && event.resolved) ||
                         (statusFilter === 'open' && !event.resolved);
    
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.event_type || !newEvent.description) return;
    
    await logSecurityEvent.mutateAsync(newEvent);
    setNewEvent({ event_type: '', severity: 'medium', description: '' });
    setIsCreating(false);
  };

  const handleResolveEvent = async (eventId: string) => {
    await resolveSecurityEvent.mutateAsync(eventId);
  };

  if (securityEventsLoading) {
    return <div className="flex items-center justify-center h-32">Loading security events...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search security events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Security Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Event type (e.g., login_attempt, data_breach)"
                value={newEvent.event_type}
                onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
              />
              
              <Select value={newEvent.severity} onValueChange={(value: any) => setNewEvent({ ...newEvent, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              
              <Textarea
                placeholder="Event description..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={4}
              />
              
              <div className="flex gap-2">
                <Button onClick={handleCreateEvent} disabled={!newEvent.event_type || !newEvent.description}>
                  Log Event
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Events List */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(event.severity)}
                    <Badge variant={getSeverityBadgeVariant(event.severity)}>
                      {event.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">{event.event_type}</Badge>
                    {event.resolved ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Open
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm mb-2">{event.description}</p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <span className="font-medium">Time:</span> {format(new Date(event.created_at), 'PPpp')}
                    </div>
                    {event.ip_address && (
                      <div>
                        <span className="font-medium">IP:</span> {event.ip_address}
                      </div>
                    )}
                    {event.resolved_at && (
                      <div>
                        <span className="font-medium">Resolved:</span> {format(new Date(event.resolved_at), 'PPpp')}
                      </div>
                    )}
                  </div>
                  
                  {Object.keys(event.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm font-medium cursor-pointer">Metadata</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                
                {!event.resolved && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResolveEvent(event.id)}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </Card>
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No security events found matching your criteria
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
