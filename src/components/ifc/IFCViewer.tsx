import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Eye,
  EyeOff,
  Info,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface IFCViewerProps {
  modelUrl?: string;
  modelName?: string;
  onElementSelect?: (elementData: any) => void;
  className?: string;
}

interface IFCElement {
  expressID: number;
  type: string;
  name?: string;
  globalId?: string;
  properties: Record<string, any>;
}

export const IFCViewer = ({ 
  modelUrl, 
  modelName = 'IFC Model',
  onElementSelect,
  className = ''
}: IFCViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<IFCElement | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const initIFCViewer = async () => {
      try {
        setLoading(true);
        
        // Dynamically import IFC.js modules
        const { IfcViewerAPI } = await import('web-ifc-viewer');
        const { IFCSPACE } = await import('web-ifc');

        // Initialize viewer
        const viewer = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new (await import('three')).Color(0x263238)
        });

        // Set up camera and controls
        viewer.axes.setAxes();
        viewer.grid.setGrid();
        viewer.IFC.setWasmPath('https://unpkg.com/web-ifc@0.0.57/');

        // Set up lighting (comment out for now due to API differences)
        // viewer.shadowDropper.renderShadow = true;
        
        viewerRef.current = viewer;

        // Load model
        await loadModel(viewer, modelUrl);

        // Set up element selection
        setupElementSelection(viewer);

      } catch (error) {
        console.error('Error initializing IFC viewer:', error);
        toast.error('Failed to initialize IFC viewer');
      } finally {
        setLoading(false);
      }
    };

    initIFCViewer();

    return () => {
      // Cleanup
      if (viewerRef.current) {
        viewerRef.current.dispose();
      }
    };
  }, [modelUrl]);

  const loadModel = async (viewer: any, url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch IFC file');
      }
      
      const data = await response.arrayBuffer();
      const model = await viewer.IFC.loadIfc(data, true);
      modelRef.current = model;
      
      // Fit model to view
      await viewer.context.fitToFrame();
      
      toast.success('IFC model loaded successfully');
    } catch (error) {
      console.error('Error loading IFC model:', error);
      toast.error('Failed to load IFC model');
    }
  };

  const setupElementSelection = (viewer: any) => {
    window.addEventListener('dblclick', async (event) => {
      if (!modelRef.current) return;

      try {
        const result = await viewer.IFC.selector.pickIfcItem(true);
        if (result) {
          const { modelID, id } = result;
          
          // Get element properties
          const properties = await viewer.IFC.getProperties(modelID, id, true);
          
          const elementData: IFCElement = {
            expressID: id,
            type: properties.type || 'Unknown',
            name: properties.Name?.value || `Element ${id}`,
            globalId: properties.GlobalId?.value,
            properties: properties
          };

          setSelectedElement(elementData);
          setShowMetadata(true);
          onElementSelect?.(elementData);

          // Highlight element
          await viewer.IFC.selector.highlightIfcItem(modelID, [id]);
          
          toast.success(`Selected: ${elementData.name || elementData.type}`);
        }
      } catch (error) {
        console.error('Error selecting element:', error);
      }
    });
  };

  const resetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.context.fitToFrame();
    }
  };

  const toggleVisibility = () => {
    if (viewerRef.current && modelRef.current) {
      const visible = modelRef.current.visible;
      modelRef.current.visible = !visible;
    }
  };

  const clearSelection = () => {
    if (viewerRef.current) {
      viewerRef.current.IFC.selector.unHighlightIfcItems();
      setSelectedElement(null);
      setShowMetadata(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Viewer Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">{modelName}</h3>
          {selectedElement && (
            <Badge variant="secondary" className="text-xs">
              {selectedElement.name || selectedElement.type}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={resetCamera}
            className="cyber-button"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={toggleVisibility}
            className="cyber-button"
            title="Toggle Visibility"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="cyber-button"
            title="Clear Selection"
            disabled={!selectedElement}
          >
            Clear
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMetadata(!showMetadata)}
            className="cyber-button"
            title="Toggle Metadata"
            disabled={!selectedElement}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Viewer */}
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full h-[500px] bg-gray-900 rounded-lg border border-border overflow-hidden"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
              <p className="text-sm text-muted-foreground">Loading IFC model...</p>
            </div>
          </div>
        )}

        {!modelUrl && !loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <p className="text-muted-foreground">No IFC model loaded</p>
          </div>
        )}
      </div>

      {/* Element Metadata Panel */}
      {showMetadata && selectedElement && (
        <Card className="cyber-tool-palette">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Element Properties</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMetadata(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{selectedElement.type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{selectedElement.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Express ID:</span>
                <p className="font-medium">{selectedElement.expressID}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Global ID:</span>
                <p className="font-medium text-xs break-all">
                  {selectedElement.globalId || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Additional Properties */}
            {Object.keys(selectedElement.properties).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Additional Properties</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {Object.entries(selectedElement.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};