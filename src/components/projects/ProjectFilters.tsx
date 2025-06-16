
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Grid, List } from 'lucide-react';

interface ProjectFiltersProps {
  searchTerm: string;
  filterStatus: string;
  filterType: string;
  viewMode: "grid" | "list";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  searchTerm,
  filterStatus,
  filterType,
  viewMode,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onViewModeChange,
}) => {
  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Select value={filterStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40 bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-40 bg-background border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "bg-primary" : "border-border hover:bg-secondary/20"}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "bg-primary" : "border-border hover:bg-secondary/20"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
