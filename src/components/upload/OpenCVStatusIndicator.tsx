import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Cpu,
  Zap,
  RefreshCw,
  Info
} from "lucide-react";

interface OpenCVStatusIndicatorProps {
  isReady: boolean;
  loadingState: {
    isLoading: boolean;
    progress: number;
    status: 'initializing' | 'ready' | 'processing' | 'error';
    error?: string;
  };
  onRetry?: () => void;
}

export const OpenCVStatusIndicator: React.FC<OpenCVStatusIndicatorProps> = ({
  isReady,
  loadingState,
  onRetry
}) => {
  const getStatusInfo = () => {
    if (loadingState.status === 'error') {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        title: 'Computer Vision Unavailable',
        message: loadingState.error || 'OpenCV failed to initialize',
        badge: 'Error'
      };
    }
    
    if (loadingState.isLoading || loadingState.status === 'initializing') {
      return {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        title: 'Loading Computer Vision',
        message: `Initializing OpenCV.js library... ${loadingState.progress}%`,
        badge: 'Loading'
      };
    }
    
    if (isReady && loadingState.status === 'ready') {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        title: 'Computer Vision Ready',
        message: 'OpenCV.js loaded successfully - enhanced architectural analysis available',
        badge: 'Ready'
      };
    }
    
    return {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      title: 'Computer Vision Initializing',
      message: 'OpenCV.js is being prepared for enhanced blueprint analysis',
      badge: 'Pending'
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const getBadgeVariant = () => {
    switch (loadingState.status) {
      case 'ready': return 'default';
      case 'error': return 'destructive';
      case 'initializing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Computer Vision Status
          </div>
          <Badge variant={getBadgeVariant()}>
            {statusInfo.badge}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center gap-3 p-3 rounded-lg ${statusInfo.bgColor}`}>
          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
          <div className="flex-1">
            <h4 className="font-medium">{statusInfo.title}</h4>
            <p className="text-sm text-muted-foreground">{statusInfo.message}</p>
          </div>
        </div>

        {loadingState.status === 'error' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p>Computer vision analysis is not available. Your blueprints will be processed using geometric pattern analysis instead.</p>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-3 w-3" />
                  <span>Geometric analysis still provides excellent architectural element detection</span>
                </div>
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Computer Vision
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isReady && loadingState.status === 'ready' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span>Enhanced computer vision analysis will automatically detect rooms, walls, doors, windows, and architectural elements</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {loadingState.isLoading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Loading computer vision library from CDN...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};