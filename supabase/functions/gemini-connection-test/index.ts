import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🧪 Gemini connection test function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔑 Checking GEMINI_API_KEY...')
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'GEMINI_API_KEY not configured in Supabase secrets',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ GEMINI_API_KEY found:', {
      length: GEMINI_API_KEY.length,
      first4: GEMINI_API_KEY.substring(0, 4),
      last4: GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)
    })

    // Test with minimal Gemini API call
    console.log('🚀 Making test API call to Gemini...')
    
    const testRequest = {
      contents: [{
        parts: [{
          text: 'Respond with exactly "CONNECTION_TEST_SUCCESS" to confirm the API is working.'
        }]
      }],
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1
      }
    }

    console.log('📤 Sending test request to Gemini API...')
    
    let geminiResponse
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testRequest)
        }
      )
      
      console.log('📡 Gemini API response received:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        ok: geminiResponse.ok
      })
      
    } catch (fetchError) {
      console.error('💥 Network error calling Gemini API:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Network error: ${fetchError.message}`,
          errorType: 'FETCH_ERROR',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini API error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        errorText
      })
      
      let errorDetails = errorText
      try {
        errorDetails = JSON.parse(errorText)
      } catch {}
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`,
          errorType: 'API_ERROR',
          details: errorDetails,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const geminiData = await geminiResponse.json()
    console.log('📥 Gemini response data:', JSON.stringify(geminiData, null, 2))

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error('❌ No candidates in response')
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No response candidates from Gemini API',
          errorType: 'NO_CANDIDATES',
          details: geminiData,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const candidate = geminiData.candidates[0]
    const responseText = candidate.content?.parts?.[0]?.text || ''
    
    console.log('💬 Gemini response text:', responseText)

    const isConnectionSuccessful = responseText.toLowerCase().includes('connection_test_success')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        connectionWorking: isConnectionSuccessful,
        message: isConnectionSuccessful 
          ? 'Gemini API connection test successful' 
          : 'Gemini API connected but response format unexpected',
        responseText: responseText.substring(0, 200),
        usage: geminiData.usageMetadata,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Critical error in connection test:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: `Critical error: ${error.message}`,
        errorType: 'CRITICAL_ERROR',
        details: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})