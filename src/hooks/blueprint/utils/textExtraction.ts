import { createWorker } from 'tesseract.js';
import { logger } from '@/utils/logger';

export interface ExtractedTextData {
  text: string;
  confidence: number;
  dimensions: string[];
  roomLabels: string[];
  annotations: string[];
  scaleInfo: string[];
  structuredData: {
    rooms: Array<{
      name: string;
      type: string;
      dimensions: string;
    }>;
    elements: Array<{
      type: string;
      description: string;
    }>;
    measurements: string[];
  };
}

export const extractTextFromBlueprint = async (imageUrl: string): Promise<ExtractedTextData> => {
  let worker: Tesseract.Worker | null = null;

  try {
    logger.info('🔍 Starting OCR text extraction from blueprint', 'Text Extraction', {
      imageUrl: imageUrl.substring(0, 100) + '...'
    });

    // Initialize Tesseract worker
    worker = await createWorker('eng');
    
    // Configure for blueprint/technical drawing recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-\'"'
    });

    // Perform OCR
    const { data } = await worker.recognize(imageUrl);
    const extractedText = data.text;
    const confidence = data.confidence;

    logger.info('📝 OCR extraction completed', 'Text Extraction', {
      textLength: extractedText.length,
      confidence: confidence.toFixed(2),
      hasText: extractedText.length > 0
    });

    // Process and structure the extracted text
    const structuredData = processExtractedText(extractedText);

    logger.info('✅ Text processing completed', 'Text Extraction', {
      roomsFound: structuredData.rooms.length,
      elementsFound: structuredData.elements.length,
      measurementsFound: structuredData.measurements.length
    });

    return {
      text: extractedText,
      confidence,
      dimensions: structuredData.measurements,
      roomLabels: structuredData.rooms.map(r => r.name),
      annotations: extractTextAnnotations(extractedText),
      scaleInfo: extractScaleInformation(extractedText),
      structuredData
    };

  } catch (error) {
    logger.error('❌ Text extraction failed', 'Text Extraction', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return minimal structure for fallback
    return {
      text: '',
      confidence: 0,
      dimensions: [],
      roomLabels: [],
      annotations: [],
      scaleInfo: [],
      structuredData: {
        rooms: [],
        elements: [],
        measurements: []
      }
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

const processExtractedText = (text: string) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const rooms: Array<{ name: string; type: string; dimensions: string }> = [];
  const elements: Array<{ type: string; description: string }> = [];
  const measurements: string[] = [];

  // Room type patterns
  const roomPatterns = [
    /(?:living\s*room|family\s*room|lounge)/i,
    /(?:bed\s*room|bedroom|master\s*bed)/i,
    /(?:kitchen|kit)/i,
    /(?:bath\s*room|bathroom|bath)/i,
    /(?:dining\s*room|dining)/i,
    /(?:office|study)/i,
    /(?:closet|walk.*in)/i,
    /(?:hallway|corridor|hall)/i,
    /(?:garage|car\s*port)/i,
    /(?:utility|laundry)/i
  ];

  // Measurement patterns
  const measurementPattern = /(\d+(?:\.\d+)?)\s*['"x×]\s*(\d+(?:\.\d+)?)/g;
  
  // Element patterns
  const elementPatterns = [
    /door/i,
    /window/i,
    /stair/i,
    /fireplace/i,
    /cabinet/i,
    /counter/i
  ];

  lines.forEach(line => {
    // Extract measurements
    const measurementMatches = line.match(measurementPattern);
    if (measurementMatches) {
      measurements.push(...measurementMatches);
    }

    // Extract room information
    roomPatterns.forEach((pattern, index) => {
      if (pattern.test(line)) {
        const roomType = getRoomTypeFromPattern(index);
        rooms.push({
          name: line,
          type: roomType,
          dimensions: extractDimensionsFromLine(line)
        });
      }
    });

    // Extract elements
    elementPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        elements.push({
          type: pattern.source.replace(/[/\\ig]/g, ''),
          description: line
        });
      }
    });
  });

  return { rooms, elements, measurements };
};

const getRoomTypeFromPattern = (patternIndex: number): string => {
  const types = [
    'living_room', 'bedroom', 'kitchen', 'bathroom', 
    'dining_room', 'office', 'closet', 'hallway', 
    'garage', 'utility'
  ];
  return types[patternIndex] || 'room';
};

const extractDimensionsFromLine = (line: string): string => {
  const dimensionMatch = line.match(/(\d+(?:\.\d+)?)\s*['"x×]\s*(\d+(?:\.\d+)?)/);
  return dimensionMatch ? dimensionMatch[0] : '';
};

const extractTextAnnotations = (text: string): string[] => {
  // Extract annotations like notes, specifications, etc.
  const lines = text.split('\n');
  const annotations: string[] = [];
  
  lines.forEach(line => {
    const cleanLine = line.trim();
    // Look for lines that seem like annotations (contain specific keywords)
    if (cleanLine.length > 3 && (
      cleanLine.includes('NOTE:') ||
      cleanLine.includes('SPEC:') ||
      cleanLine.includes('SCALE:') ||
      cleanLine.match(/[A-Z]{2,}:/) ||
      cleanLine.includes('MATERIAL:')
    )) {
      annotations.push(cleanLine);
    }
  });
  
  return annotations;
};

const extractScaleInformation = (text: string): string[] => {
  const scalePatterns = [
    /scale\s*[:\-=]\s*[\d/'"]+/i,
    /1\s*[:\-=]\s*\d+/i,
    /\d+\s*['"]\s*=\s*\d+\s*['"]/i
  ];
  
  const scaleInfo: string[] = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    scalePatterns.forEach(pattern => {
      const match = line.match(pattern);
      if (match) {
        scaleInfo.push(match[0]);
      }
    });
  });
  
  return scaleInfo;
};