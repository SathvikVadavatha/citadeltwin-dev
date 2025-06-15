
import { useState, useCallback, useMemo } from 'react';
import { useBIMElements } from '@/hooks/useBIMElements';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';

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

export const use3DViewer = (uploadId?: string) => {
  const { elements, loading: elementsLoading } = useBIMElements(uploadId);
  const { analyses, results, loading: feaLoading } = useFEAAnalyses();

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

  // Transform BIM elements for 3D viewer
  const transformedElements = useMemo(() => {
    return elements.map((element) => ({
      id: element.id,
      name: element.name,
      element_type: element.element_type,
      geometry: element.geometry,
      material: element.materials,
      position: element.geometry?.position || [0, 0, 0],
      rotation: element.geometry?.rotation || [0, 0, 0],
      scale: element.geometry?.scale || [1, 1, 1],
      visible: true
    }));
  }, [elements]);

  // Transform FEA results for visualization
  const transformedFEAResults = useMemo(() => {
    if (!results || results.length === 0) return undefined;

    const feaData: any = {};
    
    results.forEach((result) => {
      if (result.result_type && result.data) {
        try {
          const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
          const metadata = typeof result.metadata === 'string' ? JSON.parse(result.metadata) : result.metadata;
          
          feaData[result.result_type] = {
            values: data.values || [],
            max: data.max || 0,
            min: data.min || 0,
            unit: metadata?.units || ''
          };
        } catch (error) {
          console.error('Error parsing FEA result:', error);
        }
      }
    });

    return Object.keys(feaData).length > 0 ? feaData : undefined;
  }, [results]);

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

  const toggleFEAOverlay = useCallback((analysisType?: 'stress' | 'displacement' | 'safety_factor') => {
    setViewerState(prev => ({
      ...prev,
      feaOverlayEnabled: !prev.feaOverlayEnabled,
      feaAnalysisType: analysisType || prev.feaAnalysisType
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
    feaResults: transformedFEAResults,
    analyses,
    loading: elementsLoading || feaLoading,
    
    // State
    viewerState,
    selectedElementIndex: getSelectedElementIndex(),
    
    // Actions
    updateViewerState,
    selectElement,
    toggleExplodedView,
    toggleCrossSection,
    toggleFEAOverlay,
    resetView,
    exportView,
    getElementByIndex,
    
    // Computed
    hasElements: transformedElements.length > 0,
    hasFEAResults: !!transformedFEAResults,
    isLoading: elementsLoading || feaLoading
  };
};
