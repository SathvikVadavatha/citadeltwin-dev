
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'

export type AIRequestType = 'text-analysis' | 'code-generation' | 'technical-consulting' | 'engineering-calculations' | 'blueprint-analysis' | '3d-generation' | 'architectural-modeling' | 'app-navigation'

export interface AIRequest {
  prompt: string
  type: AIRequestType
  context?: string
  maxTokens?: number
  imageData?: string // Base64 encoded image for vision tasks
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

      console.log('Calling Gemini AI with request:', { 
        ...request, 
        prompt: request.prompt.slice(0, 100) + '...',
        hasImage: !!request.imageData
      })

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

  // New specialized methods for 3D generation
  const analyzeBlueprintImage = async (imageData: string, context?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: `Analyze this architectural blueprint/floor plan image. Identify all structural elements, rooms, dimensions, and architectural features. Return detailed analysis as structured JSON suitable for 3D model generation.`,
      type: 'blueprint-analysis',
      context,
      imageData,
      maxTokens: 3000
    })
  }

  const generate3DFromBlueprint = async (blueprintAnalysis: string, requirements?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: `Based on the following blueprint analysis, generate detailed 3D model specifications including coordinates, geometries, materials, and Three.js/glTF compatible definitions:\n\n${blueprintAnalysis}\n\nAdditional requirements: ${requirements || 'Standard residential building'}`,
      type: '3d-generation',
      context: 'Generate precise 3D model data from architectural analysis',
      maxTokens: 4000
    })
  }

  const createArchitecturalModel = async (blueprintData: string, buildingType?: string): Promise<AIResponse | null> => {
    return generateResponse({
      prompt: `Create a comprehensive architectural model from this blueprint data. Include room layouts, structural elements, building systems, and intelligent furniture placement:\n\n${blueprintData}`,
      type: 'architectural-modeling',
      context: `Building type: ${buildingType || 'Mixed-use'}`,
      maxTokens: 4000
    })
  }

  // Add the generateContent mutation that's being used in the components
  const generateContent = useMutation({
    mutationFn: async (request: AIRequest): Promise<AIResponse> => {
      const response = await generateResponse(request)
      if (!response) {
        throw new Error('Failed to generate content')
      }
      return response
    },
    onError: (error) => {
      console.error('Content generation error:', error)
      toast.error(`Content generation failed: ${error.message}`)
    }
  })

  const clearError = () => setError(null)
  const clearLastResponse = () => setLastResponse(null)

  return {
    loading,
    lastResponse,
    error,
    generateResponse,
    generateContent,
    analyzeText,
    generateCode,
    getTechnicalConsulting,
    analyzeBlueprintImage,
    generate3DFromBlueprint,
    createArchitecturalModel,
    clearError,
    clearLastResponse,
    isAvailable: !!user
  }
}
