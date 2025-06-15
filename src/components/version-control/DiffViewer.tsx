
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VersionDiff } from '@/types/version-control';
import { Plus, Minus, Edit } from 'lucide-react';

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot1Id: string;
  snapshot2Id: string;
  compareSnapshots: (id1: string, id2: string) => Promise<VersionDiff[]>;
}

export const DiffViewer = ({ isOpen, onClose, snapshot1Id, snapshot2Id, compareSnapshots }: DiffViewerProps) => {
  const [diffs, setDiffs] = useState<VersionDiff[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && snapshot1Id && snapshot2Id) {
      loadDiffs();
    }
  }, [isOpen, snapshot1Id, snapshot2Id]);

  const loadDiffs = async () => {
    setLoading(true);
    try {
      const result = await compareSnapshots(snapshot1Id, snapshot2Id);
      setDiffs(result);
    } catch (error) {
      console.error('Failed to load diffs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'deleted':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'deleted':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const renderPropertyDiff = (diff: VersionDiff) => {
    if (diff.change_type === 'added') {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-700">Added Element</p>
          <pre className="text-xs bg-green-100 p-2 rounded overflow-auto">
            {JSON.stringify(diff.after, null, 2)}
          </pre>
        </div>
      );
    }

    if (diff.change_type === 'deleted') {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-700">Deleted Element</p>
          <pre className="text-xs bg-red-100 p-2 rounded overflow-auto">
            {JSON.stringify(diff.before, null, 2)}
          </pre>
        </div>
      );
    }

    if (diff.change_type === 'modified') {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-yellow-700">Modified Properties</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">Before:</p>
              <pre className="text-xs bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(
                  Object.fromEntries(
                    diff.properties_changed.map(prop => [prop, diff.before[prop]])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600 mb-1">After:</p>
              <pre className="text-xs bg-green-100 p-2 rounded overflow-auto">
                {JSON.stringify(
                  Object.fromEntries(
                    diff.properties_changed.map(prop => [prop, diff.after[prop]])
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Snapshot Comparison</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Total changes: {diffs.length}</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3 text-green-500" />
                {diffs.filter(d => d.change_type === 'added').length} added
              </span>
              <span className="flex items-center gap-1">
                <Edit className="h-3 w-3 text-yellow-500" />
                {diffs.filter(d => d.change_type === 'modified').length} modified
              </span>
              <span className="flex items-center gap-1">
                <Minus className="h-3 w-3 text-red-500" />
                {diffs.filter(d => d.change_type === 'deleted').length} deleted
              </span>
            </div>

            <div className="space-y-3">
              {diffs.map((diff, index) => (
                <Card key={index} className={getChangeColor(diff.change_type)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getChangeIcon(diff.change_type)}
                      <CardTitle className="text-sm">
                        Element: {diff.element_id}
                      </CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {diff.change_type}
                      </Badge>
                    </div>
                    {diff.properties_changed.length > 0 && (
                      <CardDescription>
                        Properties changed: {diff.properties_changed.join(', ')}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderPropertyDiff(diff)}
                  </CardContent>
                </Card>
              ))}
            </div>

            {diffs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No differences found between the selected snapshots.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
