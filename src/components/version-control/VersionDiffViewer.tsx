
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Edit, 
  FileText, 
  Eye, 
  Download,
  ChevronRight,
  ChevronDown 
} from 'lucide-react';
import { format } from 'date-fns';

interface VersionDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot1: any;
  snapshot2: any;
  diffData: any[];
}

export const VersionDiffViewer = ({ 
  isOpen, 
  onClose, 
  snapshot1, 
  snapshot2, 
  diffData 
}: VersionDiffViewerProps) => {
  const [selectedDiff, setSelectedDiff] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getDiffStats = () => {
    const stats = {
      added: diffData.filter(d => d.change_type === 'added').length,
      modified: diffData.filter(d => d.change_type === 'modified').length,
      deleted: diffData.filter(d => d.change_type === 'deleted').length,
      total: diffData.length
    };
    return stats;
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added': return <Plus className="h-4 w-4 text-green-500" />;
      case 'deleted': return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified': return <Edit className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added': return 'bg-green-50 border-green-200 text-green-800';
      case 'deleted': return 'bg-red-50 border-red-200 text-red-800';
      case 'modified': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const stats = getDiffStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Version Comparison
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              <strong>From:</strong> {snapshot1?.snapshot_name} 
              ({format(new Date(snapshot1?.created_at), 'MMM d, yyyy HH:mm')})
            </div>
            <div>
              <strong>To:</strong> {snapshot2?.snapshot_name}
              ({format(new Date(snapshot2?.created_at), 'MMM d, yyyy HH:mm')})
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <Plus className="h-3 w-3 text-green-500" />
            {stats.added} added
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Edit className="h-3 w-3 text-yellow-500" />
            {stats.modified} modified
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Minus className="h-3 w-3 text-red-500" />
            {stats.deleted} deleted
          </Badge>
          <Badge variant="outline">
            {stats.total} total changes
          </Badge>
        </div>

        <Tabs defaultValue="unified" className="flex-1">
          <TabsList>
            <TabsTrigger value="unified">Unified View</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="files">Files Changed</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="flex-1">
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {diffData.map((diff, index) => (
                  <Card key={index} className={`${getChangeColor(diff.change_type)} border`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getChangeIcon(diff.change_type)}
                          <CardTitle className="text-sm">
                            {diff.element_id || diff.file_path || `Change ${index + 1}`}
                          </CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {diff.change_type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(`diff-${index}`)}
                        >
                          {expandedSections.has(`diff-${index}`) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                      {diff.properties_changed && (
                        <CardDescription>
                          Properties: {diff.properties_changed.join(', ')}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {expandedSections.has(`diff-${index}`) && (
                      <CardContent>
                        <div className="space-y-3">
                          {diff.change_type === 'modified' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium text-red-600 mb-2">Before</h5>
                                <pre className="text-xs bg-red-50 p-3 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(diff.before, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-green-600 mb-2">After</h5>
                                <pre className="text-xs bg-green-50 p-3 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(diff.after, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          {diff.change_type === 'added' && (
                            <div>
                              <h5 className="text-sm font-medium text-green-600 mb-2">Added</h5>
                              <pre className="text-xs bg-green-50 p-3 rounded border overflow-auto max-h-32">
                                {JSON.stringify(diff.after, null, 2)}
                              </pre>
                            </div>
                          )}
                          {diff.change_type === 'deleted' && (
                            <div>
                              <h5 className="text-sm font-medium text-red-600 mb-2">Deleted</h5>
                              <pre className="text-xs bg-red-50 p-3 rounded border overflow-auto max-h-32">
                                {JSON.stringify(diff.before, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="split" className="flex-1">
            <div className="grid grid-cols-2 gap-4 h-[600px]">
              <div>
                <h4 className="font-medium mb-2">Before ({snapshot1?.snapshot_name})</h4>
                <ScrollArea className="h-full border rounded">
                  <pre className="text-xs p-4">
                    {JSON.stringify(snapshot1?.snapshot_data, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              <div>
                <h4 className="font-medium mb-2">After ({snapshot2?.snapshot_name})</h4>
                <ScrollArea className="h-full border rounded">
                  <pre className="text-xs p-4">
                    {JSON.stringify(snapshot2?.snapshot_data, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="flex-1">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {diffData.map((diff, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded border hover:bg-secondary/50 cursor-pointer"
                    onClick={() => setSelectedDiff(diff)}
                  >
                    {getChangeIcon(diff.change_type)}
                    <span className="flex-1 text-sm">
                      {diff.element_id || diff.file_path || `Change ${index + 1}`}
                    </span>
                    <Badge variant="outline" className="capitalize text-xs">
                      {diff.change_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Comparing {stats.total} changes between snapshots
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Diff
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
