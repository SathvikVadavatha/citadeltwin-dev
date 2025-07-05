// Gemini AI connection testing utilities

import { supabase } from "@/integrations/supabase/client";

export const testGeminiConnection = async (): Promise<{success: boolean, message: string, details?: any}> => {
  try {
    console.log('🔌 Testing Gemini AI connection...');
    
    // Test with a simple text prompt first
    const { data: testResult, error: testError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: 'Respond with exactly "CONNECTION_TEST_SUCCESS" to confirm the API is working.',
        type: 'text-analysis',
        maxTokens: 50
      }
    });

    if (testError) {
      console.error('❌ Gemini connection test failed:', testError);
      console.error('Full error details:', JSON.stringify(testError, null, 2));
      
      // Enhanced error analysis
      const errorMessage = testError.message || 'Unknown error';
      const errorContext = testError.context || '';
      
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return {
          success: false,
          message: 'Gemini AI edge function not deployed or not found',
          details: { error: testError, suggestion: 'Check if the edge function is properly deployed' }
        };
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return {
          success: false,
          message: 'Authentication failed - check Supabase configuration',
          details: { error: testError, suggestion: 'Verify Supabase keys and authentication' }
        };
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return {
          success: false,
          message: 'Access denied - Gemini API key not configured or invalid',
          details: { error: testError, suggestion: 'Check GEMINI_API_KEY in Supabase secrets' }
        };
      } else if (errorMessage.includes('500') || errorMessage.includes('internal server')) {
        return {
          success: false,
          message: 'Internal server error in Gemini AI edge function',
          details: { 
            error: testError, 
            suggestion: 'Check edge function logs for detailed error information',
            context: errorContext
          }
        };
      } else if (errorMessage.includes('timeout')) {
        return {
          success: false,
          message: 'Request timeout - Gemini AI taking too long to respond',
          details: { error: testError, suggestion: 'Try again or check Gemini API status' }
        };
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return {
          success: false,
          message: 'Network error connecting to Gemini AI',
          details: { error: testError, suggestion: 'Check internet connection and API endpoints' }
        };
      } else {
        return {
          success: false,
          message: `Connection test failed: ${errorMessage}`,
          details: { 
            error: testError, 
            fullError: JSON.stringify(testError),
            suggestion: 'Check console logs for more details'
          }
        };
      }
    }

    if (!testResult) {
      return {
        success: false,
        message: 'Gemini AI returned null response',
        details: { suggestion: 'Check edge function implementation' }
      };
    }

    if (!testResult.result) {
      return {
        success: false,
        message: 'Gemini AI returned response without result field',
        details: { 
          response: testResult,
          suggestion: 'Check edge function response format'
        }
      };
    }

    const resultText = testResult.result.toLowerCase();
    console.log('🔍 Gemini response text:', resultText.substring(0, 100));
    
    if (resultText.includes('connection_test_success')) {
      console.log('✅ Gemini AI connection test successful');
      return {
        success: true,
        message: 'Gemini AI connection working correctly',
        details: {
          model: testResult.model || 'gemini-1.5-flash',
          usage: testResult.usage,
          response: resultText.substring(0, 200)
        }
      };
    } else {
      console.warn('⚠️ Gemini AI responded but with unexpected content:', resultText.substring(0, 200));
      return {
        success: true,
        message: 'Gemini AI connected but response format may be inconsistent',
        details: {
          actualResponse: resultText.substring(0, 200),
          expected: 'connection_test_success',
          suggestion: 'Response format is different than expected but connection works'
        }
      };
    }

  } catch (error) {
    console.error('💥 Gemini connection test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return {
      success: false,
      message: `Connection test error: ${errorMessage}`,
      details: { 
        error: errorMessage,
        stack: errorStack?.split('\n').slice(0, 5),
        suggestion: 'Check network connection and Supabase configuration'
      }
    };
  }
};

export const testGeminiVision = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('🖼️ Testing Gemini AI vision capabilities...');
    
    // Create a simple test image (1x1 red pixel as base64 with proper data URL format)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const { data: visionResult, error: visionError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: 'Describe what you see in this image. Respond with "VISION_TEST_SUCCESS" if you can see it.',
        type: 'blueprint-analysis',
        imageData: testImageBase64,
        maxTokens: 100,
        forceModel: 'gemini-1.5-flash' // Ensure we use flash for testing
      }
    });

    if (visionError) {
      console.error('❌ Gemini vision test failed:', visionError);
      return {
        success: false,
        message: `Vision test failed: ${visionError.message}`
      };
    }

    if (!visionResult || !visionResult.result) {
      return {
        success: false,
        message: 'Gemini vision returned empty response'
      };
    }

    console.log('✅ Gemini AI vision test completed');
    return {
      success: true,
      message: 'Gemini AI vision capabilities working'
    };

  } catch (error) {
    console.error('💥 Gemini vision test error:', error);
    return {
      success: false,
      message: `Vision test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};