
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Share2, 
  Download,
  ZoomIn,
  ZoomOut 
} from 'lucide-react';
import { TouchGestureHandler } from './TouchGestureHandler';

interface MobilePresentationModeProps {
  title: string;
  content: React.ReactNode;
  onShare?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export const MobilePresentationMode: React.FC<MobilePresentationModeProps> = ({
  title,
  content,
  onShare,
  onDownload,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-3 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate max-w-[150px]">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {Math.round(zoom * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleZoomOut}
            className="p-2 touch-manipulation"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleZoomIn}
            className="p-2 touch-manipulation"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRotate}
            className="p-2 touch-manipulation"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFullscreen}
            className="p-2 touch-manipulation"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <TouchGestureHandler
          onPinch={(scale) => setZoom(prev => Math.max(0.5, Math.min(3, prev * scale)))}
          onDoubleTap={handleReset}
          className="h-full flex items-center justify-center"
        >
          <div 
            className="transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          >
            {content}
          </div>
        </TouchGestureHandler>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-2 p-3 bg-background/90 backdrop-blur-sm">
        {onShare && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShare}
            className="touch-manipulation min-h-[44px]"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
        
        {onDownload && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownload}
            className="touch-manipulation min-h-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
        
        {onClose && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
            className="touch-manipulation min-h-[44px]"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
