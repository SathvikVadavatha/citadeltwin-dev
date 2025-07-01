
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('Converting image to base64:', imageUrl);
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Image blob size:', blob.size, 'type:', blob.type);

    // Check file size (limit to 10MB for Gemini API)
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('Image file too large (>10MB). Please use a smaller image.');
    }

    // Verify it's an image
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${blob.type}. Please upload an image file.`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    console.log('Base64 conversion complete. Length:', base64String.length);
    return base64String;

  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const createAnalysisPrompt = () => {
  return `Analyze this architectural blueprint and identify structural elements like walls, doors, windows, beams, columns, and room layouts. 
  
  For each element, provide:
  - Precise coordinates and dimensions
  - Element type and confidence score
  - Spatial relationships to other elements
  
  Return structured JSON in this format:
  {
    "elements": [
      {
        "type": "wall|door|window|beam|column|fixture",
        "confidence": 0.95,
        "position": {"x": 10, "y": 20},
        "dimensions": {"width": 100, "height": 5}
      }
    ],
    "rooms": [
      {
        "name": "Living Room",
        "type": "living_room",
        "area": 250,
        "bounds": {"x": 10, "y": 10, "width": 50, "height": 40}
      }
    ],
    "buildingType": "residential|commercial|industrial",
    "scale": "1/4 inch = 1 foot"
  }`;
};

export const analyzeImageCharacteristics = (imageUrl: string): Promise<{
  dimensions: { width: number; height: number };
  complexity: 'low' | 'medium' | 'high';
  estimatedElements: number;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          dimensions: { width: img.width, height: img.height },
          complexity: 'medium',
          estimatedElements: 10
        });
        return;
      }

      canvas.width = Math.min(img.width, 800);
      canvas.height = Math.min(img.height, 800);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Basic complexity analysis based on image characteristics
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let edgeCount = 0;
      let varianceSum = 0;
      
      // Simple edge detection and variance calculation
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Simple edge detection
        if (i > canvas.width * 4 && Math.abs(gray - (0.299 * data[i - canvas.width * 4] + 0.587 * data[i - canvas.width * 4 + 1] + 0.114 * data[i - canvas.width * 4 + 2])) > 30) {
          edgeCount++;
        }
        
        varianceSum += gray;
      }
      
      const avgIntensity = varianceSum / (data.length / 4);
      const normalizedEdgeCount = edgeCount / (canvas.width * canvas.height);
      
      let complexity: 'low' | 'medium' | 'high' = 'medium';
      let estimatedElements = 10;
      
      if (normalizedEdgeCount > 0.15 || avgIntensity < 50) {
        complexity = 'high';
        estimatedElements = 15 + Math.floor(normalizedEdgeCount * 20);
      } else if (normalizedEdgeCount < 0.05) {
        complexity = 'low';
        estimatedElements = 5 + Math.floor(normalizedEdgeCount * 10);
      } else {
        estimatedElements = 8 + Math.floor(normalizedEdgeCount * 15);
      }
      
      console.log('Image analysis complete:', { 
        dimensions: { width: img.width, height: img.height },
        complexity, 
        estimatedElements,
        normalizedEdgeCount,
        avgIntensity
      });
      
      resolve({
        dimensions: { width: img.width, height: img.height },
        complexity,
        estimatedElements: Math.min(estimatedElements, 25) // Cap at 25 elements
      });
    };
    
    img.onerror = () => {
      resolve({
        dimensions: { width: 800, height: 600 },
        complexity: 'medium',
        estimatedElements: 10
      });
    };
    
    img.src = imageUrl;
  });
};
