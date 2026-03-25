
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";
import { useFEAAnalyses, type CreateLoadData } from "@/hooks/useFEAAnalyses";
import type { Database } from '@/integrations/supabase/types';

type FEALoad = Database['public']['Tables']['fea_loads']['Row'];

interface FEALoadsManagerProps {
  analysisId: string;
  loads: FEALoad[];
  onRefresh: () => void;
}

export const FEALoadsManager = ({ analysisId, loads, onRefresh }: FEALoadsManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLoad, setNewLoad] = useState<Partial<CreateLoadData>>({
    analysis_id: analysisId,
    load_type: 'point_load',
    name: '',
    magnitude: 0,
    direction: { x: 0, y: -1, z: 0 }, // Default downward force
    location: { x: 0, y: 0, z: 0 },
  });

  const { createLoad } = useFEAAnalyses();

  // Helper function to safely access JSON data
  const getJsonValue = (json: any, path: string, defaultValue: any = 0) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return json?.[path] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const handleCreateLoad = async () => {
    if (!newLoad.name || newLoad.magnitude === 0) return;

    await createLoad(newLoad as CreateLoadData);
    setNewLoad({
      analysis_id: analysisId,
      load_type: 'point_load',
      name: '',
      magnitude: 0,
      direction: { x: 0, y: -1, z: 0 },
      location: { x: 0, y: 0, z: 0 },
    });
    setIsCreating(false);
    onRefresh();
  };

  const getLoadTypeIcon = (loadType: string) => {
    switch (loadType) {
      case 'point_load':
        return '📍';
      case 'distributed_load':
        return '📏';
      case 'moment':
        return '🔄';
      case 'pressure':
        return '💨';
      case 'temperature':
        return '🌡️';
      case 'gravity':
        return '⬇️';
      default:
        return '⚡';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-primary flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Loads & Forces
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Define forces and loads acting on the structure
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Load
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Create New Load Form */}
        {isCreating && (
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-foreground">Create New Load</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Load Name</Label>
                <Input
                  value={newLoad.name}
                  onChange={(e) => setNewLoad({ ...newLoad, name: e.target.value })}
                  placeholder="Enter load name"
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Load Type</Label>
                <Select 
                  value={newLoad.load_type} 
                  onValueChange={(value: any) => setNewLoad({ ...newLoad, load_type: value })}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="point_load">Point Load</SelectItem>
                    <SelectItem value="distributed_load">Distributed Load</SelectItem>
                    <SelectItem value="moment">Moment</SelectItem>
                    <SelectItem value="pressure">Pressure</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="gravity">Gravity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Magnitude (N)</Label>
                <Input
                  type="number"
                  value={newLoad.magnitude}
                  onChange={(e) => setNewLoad({ ...newLoad, magnitude: parseFloat(e.target.value) || 0 })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Dir X</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.direction?.x}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    direction: { ...newLoad.direction!, x: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Dir Y</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.direction?.y}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    direction: { ...newLoad.direction!, y: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Dir Z</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.direction?.z}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    direction: { ...newLoad.direction!, z: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Position X (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.location?.x}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    location: { ...newLoad.location!, x: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Position Y (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.location?.y}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    location: { ...newLoad.location!, y: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Position Z (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newLoad.location?.z}
                  onChange={(e) => setNewLoad({ 
                    ...newLoad, 
                    location: { ...newLoad.location!, z: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateLoad}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!newLoad.name || newLoad.magnitude === 0}
              >
                Create Load
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Loads */}
        {loads.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No loads defined. Add loads to perform structural analysis.
          </div>
        ) : (
          <div className="space-y-3">
            {loads.map((load) => (
              <div key={load.id} className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getLoadTypeIcon(load.load_type)}</span>
                    <span className="font-medium text-foreground">{load.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {load.load_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Magnitude:</span> {load.magnitude} N
                  </div>
                  <div>
                    <span className="font-medium">Direction:</span> (
                    {getJsonValue(load.direction, 'x', 0)}, {getJsonValue(load.direction, 'y', 0)}, {getJsonValue(load.direction, 'z', 0)})
                  </div>
                  <div>
                    <span className="font-medium">Position:</span> (
                    {getJsonValue(load.location, 'x', 0)}, {getJsonValue(load.location, 'y', 0)}, {getJsonValue(load.location, 'z', 0)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
