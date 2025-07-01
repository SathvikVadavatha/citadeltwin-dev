
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('🖼️ Converting image to base64:', imageUrl);
    
    // Handle different URL formats
    let fetchUrl = imageUrl;
    if (imageUrl.startsWith('blob:')) {
      console.log('📎 Processing blob URL');
    } else if (imageUrl.includes('supabase')) {
      console.log('☁️ Processing Supabase storage URL');
    }
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('📊 Image blob info:', { 
      size: blob.size, 
      type: blob.type,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2)
    });

    // Check file size (Gemini has limits)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      throw new Error(`Image too large: ${(blob.size / (1024 * 1024)).toFixed(2)}MB. Please use an image smaller than 10MB.`);
    }

    // Verify it's an image
    if (!blob.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${blob.type}. Please upload an image file (PNG, JPEG, GIF, etc.).`);
    }

    // Convert to base64
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64String = btoa(String.fromCharCode(...uint8Array));
    
    console.log('✅ Base64 conversion complete:', { 
      originalSize: blob.size,
      base64Length: base64String.length,
      compression: ((blob.size - base64String.length) / blob.size * 100).toFixed(1) + '%'
    });
    
    return base64String;

  } catch (error) {
    console.error('💥 Image conversion error:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeImageCharacteristics = (imageUrl: string): Promise<{
  dimensions: { width: number; height: number };
  complexity: 'low' | 'medium' | 'high';
  estimatedElements: number;
}> => {
  return new Promise((resolve) => {
    console.log('🔬 Analyzing image characteristics...');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
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

        // Scale down for analysis
        const maxSize = 800;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Analyze image complexity
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let edgeCount = 0;
        let totalIntensity = 0;
        let contrastSum = 0;
        
        // Simple edge detection and contrast analysis
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          totalIntensity += gray;
          
          // Check for edges (horizontal and vertical)
          if (i > canvas.width * 4) {
            const prevGray = 0.299 * data[i - canvas.width * 4] + 0.587 * data[i - canvas.width * 4 + 1] + 0.114 * data[i - canvas.width * 4 + 2];
            const diff = Math.abs(gray - prevGray);
            contrastSum += diff;
            if (diff > 30) edgeCount++;
          }
        }
        
        const totalPixels = data.length / 4;
        const avgIntensity = totalIntensity / totalPixels;
        const avgContrast = contrastSum / totalPixels;
        const normalizedEdgeCount = edgeCount / totalPixels;
        
        // Determine complexity based on edges and contrast
        let complexity: 'low' | 'medium' | 'high' = 'medium';
        let estimatedElements = 10;
        
        if (normalizedEdgeCount > 0.15 && avgContrast > 20) {
          complexity = 'high';
          estimatedElements = 15 + Math.floor(normalizedEdgeCount * 25);
        } else if (normalizedEdgeCount < 0.05 || avgContrast < 10) {
          complexity = 'low';
          estimatedElements = 5 + Math.floor(normalizedEdgeCount * 15);
        } else {
          estimatedElements = 8 + Math.floor(normalizedEdgeCount * 20);
        }
        
        // Cap the estimated elements
        estimatedElements = Math.min(Math.max(estimatedElements, 5), 30);
        
        const result = {
          dimensions: { width: img.width, height: img.height },
          complexity,
          estimatedElements
        };
        
        console.log('📈 Image analysis complete:', result);
        resolve(result);
        
      } catch (error) {
        console.error('Image analysis error:', error);
        resolve({
          dimensions: { width: img.width, height: img.height },
          complexity: 'medium',
          estimatedElements: 10
        });
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image for analysis:', error);
      resolve({
        dimensions: { width: 800, height: 600 },
        complexity: 'medium',
        estimatedElements: 10
      });
    };
    
    img.src = imageUrl;
  });
};
