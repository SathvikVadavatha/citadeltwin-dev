
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useGeminiAI, AIRequestType } from '@/hooks/useGeminiAI'
import { Brain, Code, MessageSquare, Zap, AlertCircle, CheckCircle } from 'lucide-react'

export const AIServicePanel = () => {
  const [prompt, setPrompt] = useState('')
  const [aiType, setAIType] = useState<AIRequestType>('technical-consulting')
  const [context, setContext] = useState('')
  
  const { 
    loading, 
    lastResponse, 
    error, 
    generateResponse, 
    analyzeText, 
    generateCode, 
    getTechnicalConsulting,
    clearError,
    clearLastResponse,
    isAvailable 
  } = useGeminiAI()

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    let response = null
    switch (aiType) {
      case 'text-analysis':
        response = await analyzeText(prompt, context || undefined)
        break
      case 'code-generation':
        response = await generateCode(prompt, context || undefined)
        break
      case 'technical-consulting':
        response = await getTechnicalConsulting(prompt, context || undefined)
        break
      default:
        response = await generateResponse({
          prompt,
          type: aiType,
          context: context || undefined
        })
    }

    if (response) {
      // Clear form on success
      setPrompt('')
      setContext('')
    }
  }

  const getTypeIcon = (type: AIRequestType) => {
    switch (type) {
      case 'text-analysis':
        return <Brain className="h-4 w-4" />
      case 'code-generation':
        return <Code className="h-4 w-4" />
      case 'technical-consulting':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getTypeDescription = (type: AIRequestType) => {
    switch (type) {
      case 'text-analysis':
        return 'Analyze engineering documents, reports, and technical content for insights and compliance'
      case 'code-generation':
        return 'Generate clean, efficient code for engineering applications and digital twin systems'
      case 'technical-consulting':
        return 'Get expert advice on civil engineering, BIM, structural analysis, and industry best practices'
      default:
        return 'AI-powered assistance for engineering tasks'
    }
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gemini AI Service
          </CardTitle>
          <CardDescription>
            AI-powered technical assistance for CitadelTwin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access AI services
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gemini AI Service
          </CardTitle>
          <CardDescription>
            AI-powered technical assistance for CitadelTwin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                {error}
                <Button variant="outline" size="sm" onClick={clearError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">AI Service Type</label>
              <Select value={aiType} onValueChange={(value: AIRequestType) => setAIType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical-consulting">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Technical Consulting
                    </div>
                  </SelectItem>
                  <SelectItem value="text-analysis">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Text Analysis
                    </div>
                  </SelectItem>
                  <SelectItem value="code-generation">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Code Generation
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {getTypeDescription(aiType)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Context (Optional)</label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide additional context about your project, requirements, or specific domain..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your question, request, or content to analyze..."
                rows={4}
                required
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !prompt.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {getTypeIcon(aiType)}
                  <span className="ml-2">Generate Response</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              AI Response
              <Badge variant="outline" className="ml-auto">
                {lastResponse.type}
              </Badge>
            </CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>Generated response from Gemini AI</span>
              <Button variant="ghost" size="sm" onClick={clearLastResponse}>
                Clear
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {lastResponse.result}
                </pre>
              </div>
              
              {lastResponse.usage && (
                <>
                  <Separator />
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Tokens: {lastResponse.usage.totalTokens}</span>
                    <span>Prompt: {lastResponse.usage.promptTokens}</span>
                    <span>Response: {lastResponse.usage.completionTokens}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
