
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  value?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const MobileDashboardCard: React.FC<MobileDashboardCardProps> = ({
  title,
  description,
  icon: Icon,
  value,
  trend,
  action,
  className
}) => {
  return (
    <Card className={cn("touch-manipulation", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {trend && (
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      
      {(value || action) && (
        <CardContent className="pt-0">
          {value && (
            <div className="text-2xl font-bold mb-3">{value}</div>
          )}
          {action && (
            <Button 
              onClick={action.onClick}
              className="w-full touch-manipulation min-h-[44px]"
            >
              {action.label}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};
