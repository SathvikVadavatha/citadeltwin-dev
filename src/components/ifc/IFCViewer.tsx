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
  Loader2,
  Layers,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { IFCClassifier, IFCElementMetadata } from '@/services/ifcClassifier';
import { IFCElementPropertiesPanel } from './IFCElementPropertiesPanel';

interface IFCViewerProps {
  modelUrl?: string;
  modelName?: string;
  onElementSelect?: (elementData: any) => void;
  onElementCreateBIM?: (elementData: any) => void;
  className?: string;
  projectId?: string;
  ifcModelId?: string;
}

// Remove this interface as we'll use IFCElementMetadata from the service

export const IFCViewer = ({ 
  modelUrl, 
  modelName = 'IFC Model',
  onElementSelect,
  onElementCreateBIM,
  className = '',
  projectId,
  ifcModelId
}: IFCViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedElement, setSelectedElement] = useState<IFCElementMetadata | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [isolatedElements, setIsolatedElements] = useState<number[]>([]);
  const [highlightedElements, setHighlightedElements] = useState<number[]>([]);

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
          
          // Use IFC Classifier to extract comprehensive metadata
          const metadata = await IFCClassifier.extractMetadata(id, properties, viewer, modelID);

          setSelectedElement(metadata);
          setShowPropertiesPanel(true);
          onElementSelect?.(metadata);

          // Highlight element
          await highlightElement(id);
          
          toast.success(`Selected: ${metadata.name || metadata.type}`);
        }
      } catch (error) {
        console.error('Error selecting element:', error);
        toast.error('Failed to select element');
      }
    });
  };

  const highlightElement = async (expressID: number) => {
    if (!viewerRef.current || !modelRef.current) return;
    
    try {
      await viewerRef.current.IFC.selector.highlightIfcItem(modelRef.current.modelID, [expressID]);
      setHighlightedElements([expressID]);
    } catch (error) {
      console.error('Error highlighting element:', error);
    }
  };

  const isolateElements = async (expressIDs: number[]) => {
    if (!viewerRef.current || !modelRef.current) return;
    
    try {
      // Hide all elements first
      await viewerRef.current.IFC.hideAllItems();
      
      // Show only selected elements
      for (const id of expressIDs) {
        await viewerRef.current.IFC.showItem(modelRef.current.modelID, [id]);
      }
      
      setIsolatedElements(expressIDs);
      toast.success(`Isolated ${expressIDs.length} element(s)`);
    } catch (error) {
      console.error('Error isolating elements:', error);
      toast.error('Failed to isolate elements');
    }
  };

  const showAllElements = async () => {
    if (!viewerRef.current || !modelRef.current) return;
    
    try {
      await viewerRef.current.IFC.showAllItems();
      setIsolatedElements([]);
      toast.success('All elements visible');
    } catch (error) {
      console.error('Error showing all elements:', error);
    }
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
      setShowPropertiesPanel(false);
      setHighlightedElements([]);
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Main Viewer Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Viewer Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">{modelName}</h3>
            {selectedElement && (
              <Badge variant="secondary" className="text-xs">
                {selectedElement.name || selectedElement.type}
              </Badge>
            )}
            {isolatedElements.length > 0 && (
              <Badge variant="outline" className="text-xs border-accent text-accent">
                {isolatedElements.length} isolated
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
              title="Toggle Model Visibility"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {isolatedElements.length > 0 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={showAllElements}
                className="cyber-button"
                title="Show All Elements"
              >
                <Layers className="w-4 h-4" />
              </Button>
            ) : (
              selectedElement && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => isolateElements([selectedElement.expressID])}
                  className="cyber-button"
                  title="Isolate Selected"
                >
                  <Layers className="w-4 h-4" />
                </Button>
              )
            )}
            
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
              onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
              className="cyber-button"
              title="Toggle Properties Panel"
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
            className="w-full h-[600px] bg-gray-900 rounded-lg border border-border overflow-hidden"
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
      </div>

      {/* Properties Panel */}
      <div className="lg:col-span-1">
        {showPropertiesPanel && selectedElement ? (
          <IFCElementPropertiesPanel
            element={selectedElement}
            onClose={() => setShowPropertiesPanel(false)}
            onCreateBIMElement={onElementCreateBIM}
            onUpdateElement={(updates) => {
              if (selectedElement) {
                const updatedElement = { ...selectedElement, ...updates };
                setSelectedElement(updatedElement);
                onElementSelect?.(updatedElement);
              }
            }}
            projectId={projectId}
            ifcModelId={ifcModelId}
          />
        ) : (
          <Card className="cyber-tool-palette h-full">
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
              <p className="text-muted-foreground">
                Double-click on an element in the 3D viewer to view its properties and create BIM elements.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};