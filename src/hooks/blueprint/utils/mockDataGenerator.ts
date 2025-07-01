
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
  console.warn('🚨 FALLBACK MODE: Using mock data - AI analysis unavailable');
  
  const rng = new SeededRandom(uploadId);
  const numElements = Math.floor(rng.next() * 15) + 8; // 8-22 elements
  const results: DetectedObject[] = [];

  // Track used positions to avoid overlaps
  const usedPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

  for (let i = 0; i < numElements; i++) {
    // Select element type based on weights
    let randomValue = rng.next();
    let selectedType = ELEMENT_TYPES[0];
    
    for (const elementType of ELEMENT_TYPES) {
      if (randomValue <= elementType.weight) {
        selectedType = elementType;
        break;
      }
      randomValue -= elementType.weight;
    }

    // Generate position with collision avoidance
    let attempts = 0;
    let position = { x: 0, y: 0 };
    let size = {
      width: selectedType.minSize.width + rng.next() * (selectedType.maxSize.width - selectedType.minSize.width),
      height: selectedType.minSize.height + rng.next() * (selectedType.maxSize.height - selectedType.minSize.height)
    };

    do {
      position = {
        x: rng.next() * (100 - size.width),
        y: rng.next() * (100 - size.height)
      };
      attempts++;
    } while (attempts < 10 && isOverlapping(position, size, usedPositions));

    usedPositions.push({ ...position, ...size });

    const confidence = 0.6 + rng.next() * 0.35; // 0.6-0.95 confidence

    results.push({
      label: selectedType.type,
      confidence: Math.round(confidence * 100) / 100,
      bbox: {
        x: Math.round(position.x * 10) / 10,
        y: Math.round(position.y * 10) / 10,
        width: Math.round(size.width * 10) / 10,
        height: Math.round(size.height * 10) / 10
      }
    });
  }

  console.log(`Generated ${results.length} unique mock elements for upload ${uploadId}`);
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
