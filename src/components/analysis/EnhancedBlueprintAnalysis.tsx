
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Image, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Eye,
  Building2,
  Ruler,
  Home,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface BlueprintAnalysisProps {
  uploadResult: {
    id: string;
    filename: string;
    detectedObjects: any[];
    imageUrl: string;
    floorPlanData?: {
      dimensions: {
        width: number;
        height: number;
      };
      rooms: Array<{
        name: string;
        type: string;
        area: number;
        bounds: { x: number; y: number; width: number; height: number };
      }>;
      elements: Array<{
        type: string;
        name: string;
        position: { x: number; y: number };
        dimensions: { width: number; height: number };
      }>;
    };
    geminiAnalysis?: any;
  };
}

export const EnhancedBlueprintAnalysis: React.FC<BlueprintAnalysisProps> = ({ uploadResult }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Draw annotations on canvas
  useEffect(() => {
    if (!canvasRef.current || !imageLoaded || imageError) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match image
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    // Draw detected objects annotations
    if (uploadResult.detectedObjects && uploadResult.detectedObjects.length > 0) {
      uploadResult.detectedObjects.forEach((obj, index) => {
        if (obj.bbox) {
          const { x, y, width, height } = obj.bbox;
          
          // Scale coordinates to image size
          const scaleX = canvas.width / 100; // Assuming bbox is in percentage
          const scaleY = canvas.height / 100;
          
          const rectX = x * scaleX;
          const rectY = y * scaleY;
          const rectWidth = width * scaleX;
          const rectHeight = height * scaleY;

          // Draw bounding box
          ctx.strokeStyle = getColorForType(obj.label);
          ctx.lineWidth = 2;
          ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

          // Draw label background
          ctx.fillStyle = getColorForType(obj.label);
          ctx.globalAlpha = 0.8;
          const textMetrics = ctx.measureText(obj.label);
          ctx.fillRect(rectX, rectY - 20, textMetrics.width + 10, 20);

          // Draw label text
          ctx.fillStyle = 'white';
          ctx.globalAlpha = 1;
          ctx.font = '12px Arial';
          ctx.fillText(obj.label, rectX + 5, rectY - 5);

          // Draw confidence
          ctx.fillStyle = getColorForType(obj.label);
          ctx.globalAlpha = 0.6;
          ctx.font = '10px Arial';
          ctx.fillText(`${Math.round(obj.confidence * 100)}%`, rectX + 5, rectY + 15);
          ctx.globalAlpha = 1;
        }
      });
    }

    // Draw floor plan elements if available
    if (uploadResult.floorPlanData?.rooms) {
      uploadResult.floorPlanData.rooms.forEach((room) => {
        const { x, y, width, height } = room.bounds;
        
        // Scale coordinates
        const scaleX = canvas.width / (uploadResult.floorPlanData?.dimensions.width || 100);
        const scaleY = canvas.height / (uploadResult.floorPlanData?.dimensions.height || 100);
        
        const roomX = x * scaleX;
        const roomY = y * scaleY;
        const roomWidth = width * scaleX;
        const roomHeight = height * scaleY;

        // Draw room outline
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(roomX, roomY, roomWidth, roomHeight);
        ctx.setLineDash([]);

        // Draw room label
        ctx.fillStyle = '#3B82F6';
        ctx.font = 'bold 14px Arial';
        const roomLabel = `${room.name} (${room.area} ft²)`;
        const roomTextMetrics = ctx.measureText(roomLabel);
        ctx.fillText(roomLabel, roomX + roomWidth/2 - roomTextMetrics.width/2, roomY + roomHeight/2);
      });
    }
  }, [imageLoaded, imageError, uploadResult, zoom]);

  const getColorForType = (type: string): string => {
    const colors: Record<string, string> = {
      wall: '#ef4444',
      door: '#22c55e', 
      window: '#3b82f6',
      room: '#8b5cf6',
      kitchen: '#f59e0b',
      bedroom: '#ec4899',
      bathroom: '#06b6d4',
      fixture: '#84cc16'
    };
    return colors[type.toLowerCase()] || '#6b7280';
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    console.error('Failed to load blueprint image:', uploadResult.imageUrl);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const totalDetectedObjects = uploadResult.detectedObjects?.length || 0;
  const totalRooms = uploadResult.floorPlanData?.rooms?.length || 0;
  const totalArea = uploadResult.floorPlanData?.rooms?.reduce((sum, room) => sum + room.area, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Blueprint Analysis Results
            {imageLoaded && !imageError ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Analysis of {uploadResult.filename} - Enhanced with Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalDetectedObjects}</div>
              <div className="text-sm text-muted-foreground">Elements Detected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalRooms}</div>
              <div className="text-sm text-muted-foreground">Rooms Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{totalArea.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Total Area (ft²)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {uploadResult.floorPlanData?.dimensions ? 
                  `${uploadResult.floorPlanData.dimensions.width}×${uploadResult.floorPlanData.dimensions.height}` : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">Dimensions (ft)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blueprint Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Blueprint Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {setZoom(1); setPosition({x: 0, y: 0})}}>
                <RotateCw className="h-4 w-4" />
                Reset
              </Button>
              <Badge variant="secondary">{Math.round(zoom * 100)}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-lg overflow-hidden bg-gray-50 h-96">
              {imageError ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Failed to load blueprint image</p>
                    <p className="text-sm">URL: {uploadResult.imageUrl}</p>
                  </div>
                </div>
              ) : (
                <div
                  className="relative w-full h-full cursor-grab"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease'
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={uploadResult.imageUrl}
                      alt="Blueprint"
                      className="max-w-full max-h-full object-contain"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ 
                        display: imageLoaded ? 'block' : 'none',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                  {!imageLoaded && !imageError && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Loading blueprint...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Floor Plan Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Floor Plan Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {/* Rooms Section */}
                {uploadResult.floorPlanData?.rooms && uploadResult.floorPlanData.rooms.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Rooms ({uploadResult.floorPlanData.rooms.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadResult.floorPlanData.rooms.map((room, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <div className="font-medium">{room.name}</div>
                            <div className="text-sm text-muted-foreground capitalize">{room.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{room.area} ft²</div>
                            <div className="text-sm text-muted-foreground">
                              {room.bounds.width}×{room.bounds.height} ft
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Detected Elements */}
                {uploadResult.detectedObjects && uploadResult.detectedObjects.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Detected Elements ({uploadResult.detectedObjects.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadResult.detectedObjects.map((obj, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getColorForType(obj.label) }}
                            />
                            <span className="font-medium capitalize">{obj.label}</span>
                          </div>
                          <Badge variant="secondary">
                            {Math.round(obj.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floor Plan Elements */}
                {uploadResult.floorPlanData?.elements && uploadResult.floorPlanData.elements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Architectural Elements ({uploadResult.floorPlanData.elements.length})
                      </h4>
                      <div className="space-y-2">
                        {uploadResult.floorPlanData.elements.map((element, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <div className="font-medium">{element.name}</div>
                              <div className="text-sm text-muted-foreground capitalize">{element.type}</div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {element.dimensions.width}×{element.dimensions.height} ft
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Gemini Analysis Summary */}
                {uploadResult.geminiAnalysis && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        AI Analysis Summary
                      </h4>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm">
                          {typeof uploadResult.geminiAnalysis === 'string' 
                            ? uploadResult.geminiAnalysis.substring(0, 200) + '...'
                            : 'Enhanced analysis completed with Gemini AI'
                          }
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
