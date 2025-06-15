
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_REQUESTS = 50 // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

interface GeminiRequest {
  prompt: string
  type: 'text-analysis' | 'code-generation' | 'technical-consulting'
  context?: string
  maxTokens?: number
}

interface GeminiResponse {
  result: string
  type: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)
  
  if (!userLimit) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false
  }
  
  userLimit.count++
  return true
}

function buildSystemPrompt(type: string): string {
  switch (type) {
    case 'text-analysis':
      return `You are an expert technical analyst for CitadelTwin, a civil engineering digital twin platform. 
      Analyze the provided text for engineering insights, compliance issues, structural concerns, and provide actionable recommendations.
      Focus on civil engineering best practices, building codes, and safety considerations.`
    
    case 'code-generation':
      return `You are a senior software engineer specializing in civil engineering applications and digital twins.
      Generate clean, efficient, and well-documented code that follows best practices.
      Consider performance, maintainability, and integration with existing systems.
      Use TypeScript, React, and modern web development patterns.`
    
    case 'technical-consulting':
      return `You are a senior civil engineering consultant with expertise in digital twins, BIM, CAD, and structural analysis.
      Provide expert technical advice, problem-solving guidance, and industry best practices.
      Consider regulatory compliance, safety standards, and practical implementation challenges.`
    
    default:
      return `You are an AI assistant specialized in civil engineering and digital twin platforms.
      Provide helpful, accurate, and professional responses.`
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user ID from authorization header for rate limiting
    const authHeader = req.headers.get('authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    let userId = 'anonymous'
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
      }
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          rateLimitReset: rateLimitStore.get(userId)?.resetTime 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestBody: GeminiRequest = await req.json()
    const { prompt, type, context, maxTokens = 1000 } = requestBody

    if (!prompt || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const systemPrompt = buildSystemPrompt(type)
    const fullPrompt = context 
      ? `${systemPrompt}\n\nContext: ${context}\n\nUser Request: ${prompt}`
      : `${systemPrompt}\n\nUser Request: ${prompt}`

    console.log(`Gemini AI request - Type: ${type}, User: ${userId}`)

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get response from Gemini AI',
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No response generated by Gemini AI',
          details: geminiData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = geminiData.candidates[0].content.parts[0].text
    const usage = geminiData.usageMetadata

    const response: GeminiResponse = {
      result,
      type,
      usage: usage ? {
        promptTokens: usage.promptTokenCount || 0,
        completionTokens: usage.candidatesTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0
      } : undefined
    }

    console.log(`Gemini AI response generated successfully - Type: ${type}, Tokens: ${usage?.totalTokenCount || 'unknown'}`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in gemini-ai function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
