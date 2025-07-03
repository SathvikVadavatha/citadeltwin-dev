// Intelligent architectural layout generation for fallback mode

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
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export function generateCoreStructure(results: DetectedObject[], rng: SeededRandom, buildingType: string): void {
  // Generate exterior walls in a realistic rectangular pattern
  const buildingWidth = buildingType === 'residential' ? 40 + rng.next() * 20 : 60 + rng.next() * 40;
  const buildingHeight = buildingType === 'residential' ? 30 + rng.next() * 15 : 40 + rng.next() * 30;
  
  // North wall
  results.push({
    label: 'wall',
    confidence: 0.95,
    bbox: { x: 5, y: 5, width: buildingWidth, height: 1 }
  });
  
  // South wall  
  results.push({
    label: 'wall',
    confidence: 0.95,
    bbox: { x: 5, y: 5 + buildingHeight, width: buildingWidth, height: 1 }
  });
  
  // East wall
  results.push({
    label: 'wall', 
    confidence: 0.95,
    bbox: { x: 5, y: 5, width: 1, height: buildingHeight }
  });
  
  // West wall
  results.push({
    label: 'wall',
    confidence: 0.95, 
    bbox: { x: 5 + buildingWidth, y: 5, width: 1, height: buildingHeight }
  });
  
  // Interior walls for room division
  const interiorWalls = buildingType === 'residential' ? 2 + Math.floor(rng.next() * 3) : 4 + Math.floor(rng.next() * 6);
  
  for (let i = 0; i < interiorWalls; i++) {
    const isVertical = rng.next() > 0.5;
    
    if (isVertical) {
      // Vertical interior wall
      const x = 10 + rng.next() * (buildingWidth - 10);
      const wallHeight = 10 + rng.next() * (buildingHeight - 15);
      
      results.push({
        label: 'wall',
        confidence: 0.85 + rng.next() * 0.1,
        bbox: { x, y: 10 + rng.next() * 10, width: 1, height: wallHeight }
      });
    } else {
      // Horizontal interior wall
      const y = 10 + rng.next() * (buildingHeight - 10);
      const wallWidth = 10 + rng.next() * (buildingWidth - 15);
      
      results.push({
        label: 'wall',
        confidence: 0.85 + rng.next() * 0.1,
        bbox: { x: 10 + rng.next() * 10, y, width: wallWidth, height: 1 }
      });
    }
  }
}

export function generateRoomsLayout(results: DetectedObject[], rng: SeededRandom, buildingType: string): void {
  if (buildingType === 'residential') {
    // Generate typical residential rooms
    const rooms = [
      { type: 'living_room', minSize: 20, name: 'Living Room' },
      { type: 'kitchen', minSize: 12, name: 'Kitchen' },
      { type: 'bedroom', minSize: 15, name: 'Master Bedroom' },
      { type: 'bedroom', minSize: 12, name: 'Bedroom' },
      { type: 'bathroom', minSize: 8, name: 'Bathroom' }
    ];
    
    rooms.forEach((room, index) => {
      const roomWidth = room.minSize + rng.next() * 10;
      const roomHeight = room.minSize + rng.next() * 8;
      const x = 10 + (index % 2) * 25 + rng.next() * 10;
      const y = 10 + Math.floor(index / 2) * 20 + rng.next() * 8;
      
      results.push({
        label: room.type,
        confidence: 0.88 + rng.next() * 0.1,
        bbox: { x, y, width: roomWidth, height: roomHeight }
      });
    });
  } else {
    // Generate commercial spaces
    const rooms = [
      { type: 'office', minSize: 15, name: 'Office Space' },
      { type: 'conference_room', minSize: 20, name: 'Conference Room' },
      { type: 'reception', minSize: 25, name: 'Reception Area' },
      { type: 'storage', minSize: 10, name: 'Storage Room' },
      { type: 'bathroom', minSize: 8, name: 'Restroom' }
    ];
    
    rooms.forEach((room, index) => {
      const roomWidth = room.minSize + rng.next() * 15;
      const roomHeight = room.minSize + rng.next() * 12;
      const x = 15 + (index % 3) * 25 + rng.next() * 8;
      const y = 15 + Math.floor(index / 3) * 25 + rng.next() * 10;
      
      results.push({
        label: room.type,
        confidence: 0.86 + rng.next() * 0.12,
        bbox: { x, y, width: roomWidth, height: roomHeight }
      });
    });
  }
}

export function generateArchitecturalFeatures(results: DetectedObject[], rng: SeededRandom, buildingType: string): void {
  // Generate doors - at least one exterior door and interior doors for each room
  const roomCount = results.filter(r => r.label.includes('room') || ['kitchen', 'bathroom', 'office'].includes(r.label)).length;
  const doorCount = Math.max(2, roomCount + 1); // At least exterior + interior doors
  
  for (let i = 0; i < doorCount; i++) {
    const isExterior = i === 0; // First door is exterior
    const doorWidth = isExterior ? 4 : 3;
    const doorHeight = 7;
    
    // Position doors on walls
    const wallNearby = results.find(r => r.label === 'wall');
    if (wallNearby) {
      const x = wallNearby.bbox.x + rng.next() * Math.max(1, wallNearby.bbox.width - doorWidth);
      const y = wallNearby.bbox.y + rng.next() * Math.max(1, wallNearby.bbox.height - doorHeight);
      
      results.push({
        label: 'door',
        confidence: 0.92 + rng.next() * 0.06,
        bbox: { x, y, width: doorWidth, height: doorHeight }
      });
    }
  }
  
  // Generate windows - typically 1-2 per exterior wall
  const exteriorWalls = results.filter(r => r.label === 'wall').slice(0, 4); // First 4 are exterior
  const windowsPerWall = buildingType === 'residential' ? 1 + Math.floor(rng.next() * 2) : 2 + Math.floor(rng.next() * 3);
  
  exteriorWalls.forEach((wall, wallIndex) => {
    for (let i = 0; i < windowsPerWall; i++) {
      const windowWidth = 4 + rng.next() * 3;
      const windowHeight = 3 + rng.next() * 2;
      
      // Position windows on the wall
      const x = wall.bbox.x + (i + 1) * (wall.bbox.width / (windowsPerWall + 1)) - windowWidth/2;
      const y = wall.bbox.y + wall.bbox.height/2 - windowHeight/2;
      
      results.push({
        label: 'window',
        confidence: 0.89 + rng.next() * 0.09,
        bbox: { x: Math.max(0, x), y: Math.max(0, y), width: windowWidth, height: windowHeight }
      });
    }
  });
  
  // Add some fixtures and features
  const fixtures = ['fixture', 'stairs', 'closet'];
  const numFixtures = 1 + Math.floor(rng.next() * 3);
  
  for (let i = 0; i < numFixtures; i++) {
    const fixtureType = fixtures[Math.floor(rng.next() * fixtures.length)];
    const size = fixtureType === 'stairs' ? 8 + rng.next() * 4 : 3 + rng.next() * 2;
    
    results.push({
      label: fixtureType,
      confidence: 0.75 + rng.next() * 0.15,
      bbox: { 
        x: 20 + rng.next() * 40, 
        y: 20 + rng.next() * 30, 
        width: size, 
        height: size 
      }
    });
  }
}