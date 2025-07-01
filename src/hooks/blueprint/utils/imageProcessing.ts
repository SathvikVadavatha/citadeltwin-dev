
import { logger } from '@/utils/logger';

export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    logger.debug('Converting image to base64', 'Image Processing', { imageUrl: imageUrl.substring(0, 100) + '...' });
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        logger.debug('Image converted to base64', 'Image Processing', {
          originalSize: blob.size,
          base64Length: result.length
        });
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('Image conversion failed', 'Image Processing', { error: error.message });
    throw error;
  }
};

export const analyzeImageCharacteristics = async (imageUrl: string) => {
  try {
    logger.debug('Analyzing image characteristics', 'Image Processing');
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image for analysis: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const characteristics = {
          width: img.width,
          height: img.height,
          size: blob.size,
          aspectRatio: (img.width / img.height).toFixed(2),
          complexity: blob.size > 500000 ? 'high' : blob.size > 100000 ? 'medium' : 'low'
        };
        
        logger.info('Image characteristics analyzed', 'Image Processing', characteristics);
        resolve(characteristics);
      };
      img.onerror = () => {
        logger.warn('Could not analyze image characteristics', 'Image Processing');
        resolve({
          width: 0,
          height: 0,
          size: blob.size,
          aspectRatio: '1.0',
          complexity: 'unknown'
        });
      };
      img.src = imageUrl;
    });
  } catch (error) {
    logger.error('Image analysis failed', 'Image Processing', { error: error.message });
    return {
      width: 0,
      height: 0,
      size: 0,
      aspectRatio: '1.0',
      complexity: 'unknown'
    };
  }
};
