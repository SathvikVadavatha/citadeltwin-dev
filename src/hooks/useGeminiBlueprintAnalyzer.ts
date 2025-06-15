
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

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

interface StructuralAnalysis {
  loadBearingElements: ArchitecturalElement[];
  structuralSystem: string;
  foundationType: string;
  seismicConsiderations: string[];
  codeCompliance: {
    building: string[];
    fire: string[];
    accessibility: string[];
  };
  recommendations: string[];
}

interface TechnicalInsights {
  buildingType: string;
  constructionMethod: string;
  estimatedArea: number;
  floorCount: number;
  occupancyType: string;
  energyEfficiencyNotes: string[];
  sustainabilityFeatures: string[];
  potentialIssues: string[];
}

interface GeminiAnalysisResult {
  architecturalElements: ArchitecturalElement[];
  structuralAnalysis: StructuralAnalysis;
  technicalInsights: TechnicalInsights;
  engineeringDescription: string;
  processingTime: number;
}

export const useGeminiBlueprintAnalyzer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);

  const analyzeBlueprint = useCallback(async (
    imageUrl: string, 
    uploadId: string,
    existingDetections?: any[]
  ): Promise<GeminiAnalysisResult | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use advanced analysis.",
        variant: "destructive",
      });
      return null;
    }

    try {
      setAnalyzing(true);
      const startTime = Date.now();

      // Create detailed prompt for Gemini analysis
      const analysisPrompt = `You are an expert civil engineer and architect analyzing a blueprint. Please provide a comprehensive technical analysis of this architectural drawing.

ANALYZE THE FOLLOWING:

1. ARCHITECTURAL ELEMENTS: Identify and catalog all visible elements including:
   - Walls (load-bearing vs partition, materials, dimensions)
   - Doors and windows (types, sizes, locations, accessibility compliance)
   - Structural elements (columns, beams, foundations)
   - Stairs, elevators, and circulation elements
   - Rooms and spaces (function, area calculations)
   - Fixtures and utilities

2. STRUCTURAL ANALYSIS: Evaluate:
   - Load-bearing elements and structural system type
   - Foundation type and adequacy
   - Seismic and wind load considerations
   - Structural integrity and safety factors
   - Code compliance (IBC, ADA, local codes)

3. TECHNICAL INSIGHTS: Provide:
   - Building classification and occupancy type
   - Construction methodology recommendations
   - Energy efficiency opportunities
   - Sustainability features and potential improvements
   - Potential engineering challenges or issues

4. ENGINEERING DESCRIPTION: Write a detailed technical description suitable for engineering documentation.

${existingDetections ? `CONTEXT: Previous object detection found these elements: ${JSON.stringify(existingDetections.map(d => d.label))}. Use this as additional context but provide your own detailed analysis.` : ''}

Please respond with a detailed JSON structure containing your analysis. Be specific with measurements, materials, and engineering considerations.`;

      // Call Gemini AI service
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          prompt: analysisPrompt,
          type: 'text-analysis',
          context: `Blueprint analysis for upload ID: ${uploadId}. Image URL: ${imageUrl}`,
          maxTokens: 3000
        }
      });

      if (error) {
        throw new Error(`Gemini AI analysis failed: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse Gemini response and structure the data
      const geminiResponse = data.result;
      const processingTime = Date.now() - startTime;

      // Try to parse as JSON, fallback to structured text parsing
      let structuredResult: GeminiAnalysisResult;
      
      try {
        const parsed = JSON.parse(geminiResponse);
        structuredResult = parsed;
      } catch {
        // Fallback: create structured result from text analysis
        structuredResult = parseGeminiTextResponse(geminiResponse, existingDetections || []);
      }

      // Add processing time
      structuredResult.processingTime = processingTime;

      // Save enhanced analysis results to database
      const { error: saveError } = await supabase
        .from('detection_results')
        .insert({
          upload_id: uploadId,
          detected_objects: structuredResult.architecturalElements as any,
          processing_time_ms: processingTime,
          model_used: 'gemini-pro-enhanced',
          confidence_threshold: 0.7
        });

      if (saveError) {
        console.error('Failed to save enhanced analysis:', saveError);
      }

      setAnalysisResult(structuredResult);

      toast({
        title: "Advanced analysis complete",
        description: `Gemini AI analyzed ${structuredResult.architecturalElements.length} architectural elements with engineering insights.`,
      });

      return structuredResult;

    } catch (error) {
      console.error('Gemini blueprint analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze blueprint with Gemini AI.",
        variant: "destructive",
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [user, toast]);

  const resetAnalysis = () => {
    setAnalysisResult(null);
  };

  return {
    analyzing,
    analysisResult,
    analyzeBlueprint,
    resetAnalysis
  };
};

// Helper function to parse text response into structured format
function parseGeminiTextResponse(textResponse: string, existingDetections: any[]): GeminiAnalysisResult {
  // Create a structured result by parsing the text response
  // This is a fallback when Gemini doesn't return valid JSON
  
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

  // Add elements identified in Gemini text
  const additionalElements = extractElementsFromText(textResponse);
  architecturalElements.push(...additionalElements);

  return {
    architecturalElements,
    structuralAnalysis: {
      loadBearingElements: architecturalElements.filter(e => e.properties.loadBearing),
      structuralSystem: extractFromText(textResponse, 'structural system', 'Frame construction'),
      foundationType: extractFromText(textResponse, 'foundation', 'Concrete slab'),
      seismicConsiderations: extractListFromText(textResponse, 'seismic'),
      codeCompliance: {
        building: extractListFromText(textResponse, 'building code'),
        fire: extractListFromText(textResponse, 'fire code'),
        accessibility: extractListFromText(textResponse, 'ADA')
      },
      recommendations: extractListFromText(textResponse, 'recommend')
    },
    technicalInsights: {
      buildingType: extractFromText(textResponse, 'building type', 'Commercial'),
      constructionMethod: extractFromText(textResponse, 'construction', 'Traditional'),
      estimatedArea: extractNumberFromText(textResponse, 'area', 1000),
      floorCount: extractNumberFromText(textResponse, 'floor', 1),
      occupancyType: extractFromText(textResponse, 'occupancy', 'Mixed use'),
      energyEfficiencyNotes: extractListFromText(textResponse, 'energy'),
      sustainabilityFeatures: extractListFromText(textResponse, 'sustain'),
      potentialIssues: extractListFromText(textResponse, 'issue')
    },
    engineeringDescription: textResponse.slice(0, 1000) + '...',
    processingTime: 0
  };
}

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
  return (bbox.width * bbox.height) / 100; // Convert to approximate sq ft
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

function extractFromText(text: string, keyword: string, defaultValue: string): string {
  const regex = new RegExp(`${keyword}[^.]*`, 'i');
  const match = text.match(regex);
  return match ? match[0] : defaultValue;
}

function extractListFromText(text: string, keyword: string): string[] {
  const regex = new RegExp(`${keyword}[^.]*`, 'gi');
  const matches = text.match(regex) || [];
  return matches.slice(0, 3); // Limit to 3 items
}

function extractNumberFromText(text: string, keyword: string, defaultValue: number): number {
  const regex = new RegExp(`${keyword}[^0-9]*([0-9,]+)`, 'i');
  const match = text.match(regex);
  return match ? parseInt(match[1].replace(',', '')) : defaultValue;
}

function extractElementsFromText(text: string): ArchitecturalElement[] {
  // Simple extraction of additional elements mentioned in text
  const elements: ArchitecturalElement[] = [];
  const keywords = ['column', 'beam', 'foundation', 'stair', 'elevator'];
  
  keywords.forEach((keyword, index) => {
    if (text.toLowerCase().includes(keyword)) {
      elements.push({
        id: `text-element-${index}`,
        type: keyword as ArchitecturalElement['type'],
        label: keyword,
        description: `${keyword} identified from text analysis`,
        dimensions: {},
        location: { x: 0, y: 0 },
        properties: {
          loadBearing: isLoadBearing(keyword)
        },
        confidence: 0.8
      });
    }
  });
  
  return elements;
}
