import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings,
  Info,
  Building2,
  Ruler,
  Package
} from "lucide-react";

interface GenerationOptions {
  buildingName: string;
  units: 'metric' | 'imperial';
  includeStructural: boolean;
  includeMaterials: boolean;
  includeSpaces: boolean;
  detailLevel: 'basic' | 'medium' | 'detailed';
}

interface IFCGenerationOptionsProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
  geminiAnalysis?: any;
}

export const IFCGenerationOptions: React.FC<IFCGenerationOptionsProps> = ({
  options,
  onChange,
  geminiAnalysis
}) => {
  const updateOption = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Configure how your IFC model will be generated. These settings affect the structure, level of detail, and included components in your 3D model.
        </AlertDescription>
      </Alert>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Basic Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buildingName">Building Name</Label>
            <Input
              id="buildingName"
              value={options.buildingName}
              onChange={(e) => updateOption('buildingName', e.target.value)}
              placeholder="Enter building name"
            />
            <p className="text-xs text-muted-foreground">
              This name will be used in the IFC file metadata and model hierarchy.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units">Unit System</Label>
            <Select value={options.units} onValueChange={(value: 'metric' | 'imperial') => updateOption('units', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (meters, mm)</SelectItem>
                <SelectItem value="imperial">Imperial (feet, inches)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detailLevel">Detail Level</Label>
            <Select value={options.detailLevel} onValueChange={(value: 'basic' | 'medium' | 'detailed') => updateOption('detailLevel', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Core elements only</SelectItem>
                <SelectItem value="medium">Medium - Standard detail</SelectItem>
                <SelectItem value="detailed">Detailed - Full geometry</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Higher detail levels include more geometry but create larger files.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Content Inclusion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Content Inclusion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeStructural">Structural Elements</Label>
              <p className="text-xs text-muted-foreground">Include walls, beams, columns, and structural components</p>
            </div>
            <Switch
              id="includeStructural"
              checked={options.includeStructural}
              onCheckedChange={(checked) => updateOption('includeStructural', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeMaterials">Material Properties</Label>
              <p className="text-xs text-muted-foreground">Include material definitions and properties</p>
            </div>
            <Switch
              id="includeMaterials"
              checked={options.includeMaterials}
              onCheckedChange={(checked) => updateOption('includeMaterials', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="includeSpaces">Spaces & Rooms</Label>
              <p className="text-xs text-muted-foreground">Include room boundaries and space definitions</p>
            </div>
            <Switch
              id="includeSpaces"
              checked={options.includeSpaces}
              onCheckedChange={(checked) => updateOption('includeSpaces', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Data Preview */}
      {geminiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler className="h-4 w-4" />
              Source Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Elements Detected:</span>
                <span className="ml-2 font-medium">{geminiAnalysis.elements?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rooms Found:</span>
                <span className="ml-2 font-medium">{geminiAnalysis.rooms?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Scale Detected:</span>
                <span className="ml-2 font-medium">{geminiAnalysis.scale?.value || 'Auto'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Building Type:</span>
                <span className="ml-2 font-medium">{geminiAnalysis.metadata?.buildingType || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};