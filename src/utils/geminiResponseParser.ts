
interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'column' | 'beam' | 'stair' | 'elevator' | 'room' | 'fixture';
  label: string;
  description: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
  };
  location: {
    x: number;
    y: number;
    floor?: string;
  };
  properties: {
    material?: string;
    loadBearing?: boolean;
    structuralRole?: string;
    compliance?: string[];
  };
  confidence: number;
}

interface GeminiAnalysisResult {
  architecturalElements: ArchitecturalElement[];
  structuralAnalysis: any;
  technicalInsights: any;
  engineeringDescription: string;
  processingTime: number;
}

export const parseGeminiResponse = (textResponse: string, existingDetections: any[]): GeminiAnalysisResult => {
  try {
    const parsed = JSON.parse(textResponse);
    if (parsed.architecturalElements && parsed.structuralAnalysis && parsed.technicalInsights) {
      return parsed;
    }
    throw new Error('Invalid JSON structure');
  } catch {
    // Fallback: create structured result from existing detections and text analysis
    const architecturalElements: ArchitecturalElement[] = existingDetections.map((detection, index) => ({
      id: `element-${index}`,
      type: mapDetectionToElementType(detection.label),
      label: detection.label,
      description: `${detection.label} identified with ${(detection.confidence * 100).toFixed(1)}% confidence`,
      dimensions: {
        area: calculateAreaFromBbox(detection.bbox)
      },
      location: {
        x: detection.bbox.x,
        y: detection.bbox.y
      },
      properties: {
        material: inferMaterial(detection.label),
        loadBearing: isLoadBearing(detection.label)
      },
      confidence: detection.confidence
    }));

    return {
      architecturalElements,
      structuralAnalysis: {
        loadBearingElements: architecturalElements.filter(e => e.properties.loadBearing),
        structuralSystem: 'Frame construction',
        foundationType: 'Concrete slab',
        seismicConsiderations: [],
        codeCompliance: {
          building: [],
          fire: [],
          accessibility: []
        },
        recommendations: []
      },
      technicalInsights: {
        buildingType: 'Commercial',
        constructionMethod: 'Traditional',
        estimatedArea: 1000,
        floorCount: 1,
        occupancyType: 'Mixed use',
        energyEfficiencyNotes: [],
        sustainabilityFeatures: [],
        potentialIssues: []
      },
      engineeringDescription: textResponse.slice(0, 1000) + (textResponse.length > 1000 ? '...' : ''),
      processingTime: 0
    };
  }
};

function mapDetectionToElementType(label: string): ArchitecturalElement['type'] {
  const mapping: Record<string, ArchitecturalElement['type']> = {
    'door': 'door',
    'window': 'window',
    'wall': 'wall',
    'column': 'column',
    'beam': 'beam',
    'stair': 'stair',
    'room': 'room'
  };
  return mapping[label.toLowerCase()] || 'fixture';
}

function calculateAreaFromBbox(bbox: any): number {
  return (bbox.width * bbox.height) / 100;
}

function inferMaterial(label: string): string {
  const materials: Record<string, string> = {
    'wall': 'Concrete/Masonry',
    'door': 'Wood/Metal',
    'window': 'Glass/Aluminum',
    'column': 'Concrete/Steel',
    'beam': 'Steel/Concrete'
  };
  return materials[label.toLowerCase()] || 'Unknown';
}

function isLoadBearing(label: string): boolean {
  return ['wall', 'column', 'beam'].includes(label.toLowerCase());
}
