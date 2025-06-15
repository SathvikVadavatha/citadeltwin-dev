import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'

export type AIRequestType = 'text-analysis' | 'code-generation' | 'technical-consulting' | 'engineering-calculations'

export interface AIRequest {
  prompt: string
  type: AIRequestType
  context?: string
  maxTokens?: number
}

export interface AIResponse {
  result: string
  type: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIError {
  error: string
  details?: string
  rateLimitReset?: number
}

export const useGeminiAI = () => {
  const [loading, setLoading] = useState(false)
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const generateResponse = async (request: AIRequest): Promise<AIResponse | null> => {
    if (!user) {
      toast.error('Please sign in to use AI features')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Calling Gemini AI with request:', { ...request, prompt: request.prompt.slice(0, 100) + '...' })

      const { data, error: functionError } = await supabase.functions.invoke('gemini-ai', {
        body: request
      })

      if (functionError) {
        console.error('Supabase function error:', functionError)
        const errorMessage = functionError.message || 'Failed to call AI service'
        setError(errorMessage)
        toast.error(errorMessage)
        return null
      }

      if (data.error) {
        console.error('AI service error:', data)
        const errorMessage = data.error || 'AI service returned an error'
        setError(errorMessage)
        
        if (data.rateLimitReset) {
          const resetTime = new Date(data.rateLimitReset).toLocaleTimeString()
          toast.error(`${errorMessage} Try again after ${resetTime}`)
        } else {
          toast.error(errorMessage)
        }
        return null
      }

      const response: AIResponse = data
      setLastResponse(response)
      
      console.log('AI response received:', { 
        type: response.type, 
        usage: response.usage,
        resultLength: response.result.length 
      })

      return response

    } catch (err) {
      console.error('Error calling Gemini AI:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unexpected error occurred'
      setError(errorMessage)
      toast.error(`AI service error: ${errorMessage}`)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Specialized methods for different AI use cases
  const analyzeText = async (text: string, context?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: text,
      type: 'text-analysis',
      context,
      maxTokens: 1500
    })
  }

  const generateCode = async (requirements: string, context?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: requirements,
      type: 'code-generation',
      context,
      maxTokens: 2000
    })
  }

  const getTechnicalConsulting = async (question: string, context?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: question,
      type: 'technical-consulting',
      context,
      maxTokens: 1500
    })
  }

  const clearError = () => setError(null)
  const clearLastResponse = () => setLastResponse(null)

  return {
    loading,
    lastResponse,
    error,
    generateResponse,
    analyzeText,
    generateCode,
    getTechnicalConsulting,
    clearError,
    clearLastResponse,
    isAvailable: !!user
  }
}
