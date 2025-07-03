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
      
      if (testError.message?.includes('404')) {
        return {
          success: false,
          message: 'Gemini AI edge function not found - deployment issue',
          details: testError
        };
      } else if (testError.message?.includes('401') || testError.message?.includes('403')) {
        return {
          success: false,
          message: 'Gemini API key not configured or invalid',
          details: testError
        };
      } else if (testError.message?.includes('500')) {
        return {
          success: false,
          message: 'Gemini AI service error - temporary outage',
          details: testError
        };
      } else {
        return {
          success: false,
          message: `Connection test failed: ${testError.message}`,
          details: testError
        };
      }
    }

    if (!testResult || !testResult.result) {
      return {
        success: false,
        message: 'Gemini AI returned empty response',
        details: testResult
      };
    }

    const resultText = testResult.result.toLowerCase();
    
    if (resultText.includes('connection_test_success')) {
      console.log('✅ Gemini AI connection test successful');
      return {
        success: true,
        message: 'Gemini AI connection working correctly',
        details: {
          model: testResult.model || 'gemini-1.5-flash',
          usage: testResult.usage
        }
      };
    } else {
      console.warn('⚠️ Gemini AI responded but with unexpected content:', resultText);
      return {
        success: true,
        message: 'Gemini AI connected but response format may be inconsistent',
        details: testResult
      };
    }

  } catch (error) {
    console.error('💥 Gemini connection test error:', error);
    return {
      success: false,
      message: `Connection test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
};

export const testGeminiVision = async (): Promise<{success: boolean, message: string}> => {
  try {
    console.log('🖼️ Testing Gemini AI vision capabilities...');
    
    // Create a simple test image (1x1 red pixel as base64)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    const { data: visionResult, error: visionError } = await supabase.functions.invoke('gemini-ai', {
      body: {
        prompt: 'Describe what you see in this image. Respond with "VISION_TEST_SUCCESS" if you can see it.',
        type: 'blueprint-analysis',
        imageData: testImageBase64,
        maxTokens: 100
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