
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useBIMElements } from '@/hooks/useBIMElements';
import { useFEAAnalyses } from '@/hooks/useFEAAnalyses';

export interface ViewerElement {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material?: {
    name: string;
    color: string;
    properties: any;
  };
  properties: any;
}

export const use3DViewer = (uploadId?: string, projectId?: string) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'model' | 'analysis'>('model');
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  
  const filterType = projectId ? 'project' : 'upload';
  const filterId = projectId || uploadId;
  
  const { elements, refreshElements } = useBIMElements(filterId, filterType);
  const { analyses, results } = useFEAAnalyses();

  const viewerElements = useMemo((): ViewerElement[] => {
    return elements.map(element => {
      // Safely parse geometry data
      let geometry = element.geometry;
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry);
        } catch {
          geometry = {};
        }
      }

      return {
        id: element.id,
        type: element.element_type,
        position: geometry?.position || { x: 0, y: 0, z: 0 },
        rotation: geometry?.rotation || { x: 0, y: 0, z: 0 },
        scale: geometry?.scale || { x: 1, y: 1, z: 1 },
        material: element.materials ? {
          name: element.materials.name,
          color: '#888888',
          properties: element.materials.properties
        } : undefined,
        properties: element.parameters || {}
      };
    });
  }, [elements]);

  const updateElementPosition = useCallback((elementId: string, position: { x: number; y: number; z: number }) => {
    // Implementation would update element position in database
    console.log('Updating element position:', elementId, position);
  }, []);

  const updateElementRotation = useCallback((elementId: string, rotation: { x: number; y: number; z: number }) => {
    // Implementation would update element rotation in database
    console.log('Updating element rotation:', elementId, rotation);
  }, []);

  const refreshViewer = useCallback(() => {
    refreshElements();
  }, [refreshElements]);

  return {
    elements: viewerElements,
    selectedElement,
    setSelectedElement,
    viewMode,
    setViewMode,
    showAnalysisResults,
    setShowAnalysisResults,
    updateElementPosition,
    updateElementRotation,
    refreshViewer,
    analyses,
    results
  };
};
