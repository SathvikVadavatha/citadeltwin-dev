
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  GitBranch, 
  GitMerge, 
  Edit, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  Clock,
  User,
  FileText,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditEvent {
  id: string;
  type: 'snapshot' | 'branch' | 'merge' | 'edit' | 'delete' | 'export';
  action: string;
  user_id: string;
  user_name: string;
  timestamp: string;
  details: any;
  affected_items: string[];
  metadata: any;
}

interface AuditTrailPanelProps {
  events: AuditEvent[];
  isLoading?: boolean;
  onExportAudit?: () => void;
}

export const AuditTrailPanel = ({ 
  events, 
  isLoading = false, 
  onExportAudit 
}: AuditTrailPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'snapshot': return <Camera className="h-4 w-4 text-blue-500" />;
      case 'branch': return <GitBranch className="h-4 w-4 text-green-500" />;
      case 'merge': return <GitMerge className="h-4 w-4 text-purple-500" />;
      case 'edit': return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'export': return <Download className="h-4 w-4 text-gray-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'snapshot': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'branch': return 'text-green-600 bg-green-50 border-green-200';
      case 'merge': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'edit': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'delete': return 'text-red-600 bg-red-50 border-red-200';
      case 'export': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.affected_items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const eventTypeOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'snapshot', label: 'Snapshots' },
    { value: 'branch', label: 'Branches' },
    { value: 'merge', label: 'Merges' },
    { value: 'edit', label: 'Edits' },
    { value: 'delete', label: 'Deletions' },
    { value: 'export', label: 'Exports' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Complete history of all project changes and actions
          </p>
        </div>
        {onExportAudit && (
          <Button variant="outline" onClick={onExportAudit} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Audit Log
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events, users, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            {eventTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-background bg-card flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                    <Card className="flex-1">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                              {event.action}
                              <Badge variant="outline" className={getEventColor(event.type)}>
                                {event.type}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.user_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                              </span>
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {event.affected_items.length > 0 && (
                            <div>
                              <strong>Affected items:</strong> {event.affected_items.join(', ')}
                            </div>
                          )}
                          {event.details?.description && (
                            <div className="mt-1">{event.details.description}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="detailed">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                        <CardTitle className="text-sm">{event.action}</CardTitle>
                        <Badge variant="outline" className={getEventColor(event.type)}>
                          {event.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>User:</strong> {event.user_name}
                      </div>
                      <div>
                        <strong>Event ID:</strong> {event.id}
                      </div>
                      {event.affected_items.length > 0 && (
                        <div className="col-span-2">
                          <strong>Affected Items:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {event.affected_items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {event.details && (
                        <div className="col-span-2">
                          <strong>Details:</strong>
                          <pre className="text-xs bg-secondary p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {eventTypeOptions.slice(1).map((type) => {
              const count = events.filter(e => e.type === type.value).length;
              return (
                <Card key={type.value}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getEventIcon(type.value)}
                      <CardTitle className="text-sm">{type.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">
                      {count === 1 ? 'event' : 'events'}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {selectedEvent && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Event Details
              <Badge variant="outline" className={getEventColor(selectedEvent.type)}>
                {selectedEvent.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-secondary p-4 rounded overflow-auto">
              {JSON.stringify(selectedEvent, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
