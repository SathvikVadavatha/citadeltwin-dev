import { useState, useCallback, useMemo } from 'react';
import { useBIMElements } from '@/hooks/useBIMElements';

export interface ViewerState {
  selectedElementId?: string;
  viewMode: '3d' | 'exploded' | 'cross-section';
  crossSectionPosition: [number, number, number];
  crossSectionEnabled: boolean;
  explodeDistance: number;
  feaOverlayEnabled: boolean;
  feaAnalysisType: 'stress' | 'displacement' | 'safety_factor';
  lightingIntensity: number;
  showGrid: boolean;
  cameraPosition: [number, number, number];
}

export const use3DViewer = (uploadId?: string, projectId?: string) => {
  // Use project-based filtering if projectId is provided, otherwise use upload-based
  const filterType = projectId ? 'project' : 'upload';
  const filterId = projectId || uploadId;
  
  const { elements, loading: elementsLoading, refreshElements } = useBIMElements(filterId, filterType);

  const [viewerState, setViewerState] = useState<ViewerState>({
    viewMode: '3d',
    crossSectionPosition: [0, 0, 0],
    crossSectionEnabled: false,
    explodeDistance: 0,
    feaOverlayEnabled: false,
    feaAnalysisType: 'stress',
    lightingIntensity: 1,
    showGrid: true,
    cameraPosition: [10, 10, 10]
  });

  // Transform BIM elements for 3D viewer with better error handling
  const transformedElements = useMemo(() => {
    try {
      if (!elements || !Array.isArray(elements)) {
        console.log('No elements array found, returning empty array');
        return [];
      }
      
      console.log('Transforming elements:', elements.length);
      return elements.map((element, index) => ({
        id: element.id,
        name: element.name || `Element ${index + 1}`,
        element_type: element.element_type,
        geometry: element.geometry || {
          dimensions: { width: 1, height: 1, depth: 1 },
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        material: element.materials || {
          id: 'default',
          name: 'Default Material',
          material_type: 'concrete',
          properties: {}
        },
        position: element.geometry?.position || [index * 2, 0, 0],
        rotation: element.geometry?.rotation || [0, 0, 0],
        scale: element.geometry?.scale || [1, 1, 1],
        visible: true
      }));
    } catch (error) {
      console.error('Error transforming BIM elements:', error);
      return [];
    }
  }, [elements]);

  const updateViewerState = useCallback((updates: Partial<ViewerState>) => {
    setViewerState(prev => ({ ...prev, ...updates }));
  }, []);

  const selectElement = useCallback((elementId: string) => {
    setViewerState(prev => ({ ...prev, selectedElementId: elementId }));
  }, []);

  const toggleExplodedView = useCallback((distance: number = 5) => {
    setViewerState(prev => ({
      ...prev,
      viewMode: prev.explodeDistance > 0 ? '3d' : 'exploded',
      explodeDistance: prev.explodeDistance > 0 ? 0 : distance
    }));
  }, []);

  const toggleCrossSection = useCallback((position?: [number, number, number]) => {
    setViewerState(prev => ({
      ...prev,
      viewMode: prev.crossSectionEnabled ? '3d' : 'cross-section',
      crossSectionEnabled: !prev.crossSectionEnabled,
      crossSectionPosition: position || prev.crossSectionPosition
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewerState({
      viewMode: '3d',
      crossSectionPosition: [0, 0, 0],
      crossSectionEnabled: false,
      explodeDistance: 0,
      feaOverlayEnabled: false,
      feaAnalysisType: 'stress',
      lightingIntensity: 1,
      showGrid: true,
      cameraPosition: [10, 10, 10]
    });
  }, []);

  const exportView = useCallback(async (format: 'png' | 'jpeg' | 'json' = 'png') => {
    // This would integrate with the Canvas export functionality
    console.log('Exporting view in format:', format);
    // Implementation would depend on Three.js canvas export
  }, []);

  const getElementByIndex = useCallback((index: number) => {
    return transformedElements[index];
  }, [transformedElements]);

  const getSelectedElementIndex = useCallback(() => {
    if (!viewerState.selectedElementId) return undefined;
    return transformedElements.findIndex(el => el.id === viewerState.selectedElementId);
  }, [transformedElements, viewerState.selectedElementId]);

  return {
    // Data
    elements: transformedElements,
    feaResults: undefined,
    loading: elementsLoading,

    // State
    viewerState,
    selectedElementIndex: getSelectedElementIndex(),

    // Actions
    updateViewerState,
    selectElement,
    toggleExplodedView,
    toggleCrossSection,
    resetView,
    exportView,
    getElementByIndex,
    refreshElements,

    // Computed
    hasElements: transformedElements.length > 0,
    hasFEAResults: false,
    isLoading: elementsLoading,
    elementCount: transformedElements.length
  };
};
