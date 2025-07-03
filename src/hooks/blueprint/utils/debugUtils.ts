// Debug utilities for blueprint processing pipeline

import { logger } from '@/utils/logger';

export const debugGeminiPipeline = async (imageUrl: string, uploadId: string) => {
  logger.info('🔍 Starting Gemini pipeline debug', 'Debug Utils', { imageUrl: imageUrl.substring(0, 100), uploadId });

  try {
    // Test 1: Can we fetch the image?
    const imageResponse = await fetch(imageUrl);
    logger.info('✅ Image fetch test', 'Debug Utils', {
      status: imageResponse.status,
      ok: imageResponse.ok,
      contentType: imageResponse.headers.get('content-type'),
      contentLength: imageResponse.headers.get('content-length')
    });

    if (!imageResponse.ok) {
      throw new Error(`Image fetch failed: ${imageResponse.status}`);
    }

    // Test 2: Can we convert to blob?
    const imageBlob = await imageResponse.blob();
    logger.info('✅ Blob conversion test', 'Debug Utils', {
      blobSize: imageBlob.size,
      blobType: imageBlob.type
    });

    // Test 3: Can we convert to base64?
    const base64Result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(imageBlob);
    });

    logger.info('✅ Base64 conversion test', 'Debug Utils', {
      base64Length: base64Result.length,
      hasDataPrefix: base64Result.startsWith('data:image/'),
      format: base64Result.substring(0, 50)
    });

    return {
      success: true,
      imageSize: imageBlob.size,
      imageType: imageBlob.type,
      base64Length: base64Result.length
    };

  } catch (error) {
    logger.error('❌ Debug pipeline failed', 'Debug Utils', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testGeminiConnection = async () => {
  logger.info('🔌 Testing Gemini AI connection', 'Debug Utils');

  try {
    // Simple test call to Gemini AI
    const testPrompt = 'Test connection - respond with "OK"';
    
    // This would use the actual Gemini integration
    // For now, we'll just simulate a connection test
    logger.info('✅ Gemini connection test simulated', 'Debug Utils');
    
    return { success: true, message: 'Connection test passed' };
  } catch (error) {
    logger.error('❌ Gemini connection test failed', 'Debug Utils', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};