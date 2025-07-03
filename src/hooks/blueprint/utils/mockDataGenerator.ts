
import { generateCoreStructure, generateRoomsLayout, generateArchitecturalFeatures, type SeededRandom as ISeededRandom } from './intelligentLayoutGenerator';

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Seeded random number generator for consistent results per upload
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

const ELEMENT_TYPES = [
  { type: 'wall', weight: 0.3, minSize: { width: 20, height: 3 }, maxSize: { width: 100, height: 8 } },
  { type: 'door', weight: 0.15, minSize: { width: 6, height: 15 }, maxSize: { width: 12, height: 25 } },
  { type: 'window', weight: 0.15, minSize: { width: 8, height: 6 }, maxSize: { width: 20, height: 12 } },
  { type: 'room', weight: 0.1, minSize: { width: 30, height: 30 }, maxSize: { width: 80, height: 60 } },
  { type: 'kitchen', weight: 0.05, minSize: { width: 25, height: 20 }, maxSize: { width: 50, height: 40 } },
  { type: 'bathroom', weight: 0.05, minSize: { width: 15, height: 15 }, maxSize: { width: 30, height: 25 } },
  { type: 'bedroom', weight: 0.05, minSize: { width: 35, height: 30 }, maxSize: { width: 60, height: 50 } },
  { type: 'stairs', weight: 0.03, minSize: { width: 10, height: 20 }, maxSize: { width: 18, height: 40 } },
  { type: 'fixture', weight: 0.04, minSize: { width: 3, height: 3 }, maxSize: { width: 8, height: 8 } },
  { type: 'beam', weight: 0.03, minSize: { width: 40, height: 2 }, maxSize: { width: 120, height: 5 } },
  { type: 'column', weight: 0.02, minSize: { width: 3, height: 3 }, maxSize: { width: 8, height: 8 } },
  { type: 'closet', weight: 0.03, minSize: { width: 8, height: 12 }, maxSize: { width: 15, height: 20 } }
];

export const generateMockDetectionResults = (uploadId: string): DetectedObject[] => {
  console.warn('🚨 INTELLIGENT FALLBACK MODE: Generating realistic architectural sample data per blueprint - Gemini AI analysis unavailable');
  
  const rng = new SeededRandom(uploadId);
  
  // Generate more realistic building layout
  const buildingType = rng.next() > 0.5 ? 'residential' : 'commercial';
  const numElements = buildingType === 'residential' ? 
    Math.floor(rng.next() * 8) + 8 : // 8-15 elements for residential
    Math.floor(rng.next() * 15) + 10; // 10-24 elements for commercial
  
  console.log(`🏗️ Generating intelligent ${buildingType} architectural layout with ${numElements} elements for upload ${uploadId}`);

  const results: DetectedObject[] = [];
  
  // Generate core structural elements first
  generateCoreStructure(results, rng, buildingType);
  
  // Add rooms based on building type
  generateRoomsLayout(results, rng, buildingType);
  
  // Add architectural features
  generateArchitecturalFeatures(results, rng, buildingType);
  
  console.log(`Generated intelligent ${buildingType} layout:`, {
    walls: results.filter(r => r.label === 'wall').length,
    rooms: results.filter(r => r.label.includes('room') || r.label === 'kitchen' || r.label === 'bathroom').length,
    doors: results.filter(r => r.label === 'door').length,
    windows: results.filter(r => r.label === 'window').length,
    total: results.length
  });

  return results;
};

function isOverlapping(
  pos: { x: number; y: number }, 
  size: { width: number; height: number }, 
  existing: Array<{ x: number; y: number; width: number; height: number }>
): boolean {
  return existing.some(rect => {
    const overlap = !(
      pos.x + size.width < rect.x ||
      rect.x + rect.width < pos.x ||
      pos.y + size.height < rect.y ||
      rect.y + rect.height < pos.y
    );
    return overlap;
  });
}
