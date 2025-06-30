
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useGeminiAI, AIRequestType } from '@/hooks/useGeminiAI'
import { Brain, Code, MessageSquare, Zap, AlertCircle, CheckCircle, Image, Cube } from 'lucide-react'

export const AIServicePanel = () => {
  const [prompt, setPrompt] = useState('')
  const [aiType, setAIType] = useState<AIRequestType>('technical-consulting')
  const [context, setContext] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  const { 
    loading, 
    lastResponse, 
    error, 
    generateResponse, 
    analyzeText, 
    generateCode, 
    getTechnicalConsulting,
    analyzeBlueprintImage,
    generate3DFromBlueprint,
    createArchitecturalModel,
    clearError,
    clearLastResponse,
    isAvailable 
  } = useGeminiAI()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
    }
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    let imageData: string | undefined
    if (imageFile && (aiType === 'blueprint-analysis' || aiType === '3d-generation' || aiType === 'architectural-modeling')) {
      try {
        imageData = await convertImageToBase64(imageFile)
      } catch (error) {
        console.error('Failed to convert image:', error)
      }
    }

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
      case 'blueprint-analysis':
        if (imageData) {
          response = await analyzeBlueprintImage(imageData, context || undefined)
        } else {
          response = await generateResponse({
            prompt,
            type: aiType,
            context: context || undefined
          })
        }
        break
      case '3d-generation':
        response = await generate3DFromBlueprint(prompt, context || undefined)
        break
      case 'architectural-modeling':
        if (imageData) {
          response = await createArchitecturalModel(prompt, context || undefined)
        } else {
          response = await generateResponse({
            prompt,
            type: aiType,
            context: context || undefined
          })
        }
        break
      default:
        response = await generateResponse({
          prompt,
          type: aiType,
          context: context || undefined,
          imageData
        })
    }

    if (response) {
      // Clear form on success
      setPrompt('')
      setContext('')
      setImageFile(null)
      const fileInput = document.getElementById('image-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
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
      case 'blueprint-analysis':
        return <Image className="h-4 w-4" />
      case '3d-generation':
      case 'architectural-modeling':
        return <Cube className="h-4 w-4" />
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
      case 'blueprint-analysis':
        return 'Analyze architectural blueprints and floor plans to identify elements, dimensions, and structures'
      case '3d-generation':
        return 'Generate detailed 3D model specifications from 2D blueprints and architectural data'
      case 'architectural-modeling':
        return 'Create comprehensive architectural models with room layouts, systems, and intelligent design'
      default:
        return 'AI-powered assistance for engineering tasks'
    }
  }

  const isImageTypeRequired = ['blueprint-analysis', '3d-generation', 'architectural-modeling'].includes(aiType)

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
            Enhanced Gemini AI Service
            <Badge variant="secondary">Vision + 3D Generation</Badge>
          </CardTitle>
          <CardDescription>
            AI-powered technical assistance with blueprint analysis and 3D model generation
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
                  <SelectItem value="blueprint-analysis">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Blueprint Analysis
                      <Badge variant="outline" className="ml-1">Vision</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="3d-generation">
                    <div className="flex items-center gap-2">
                      <Cube className="h-4 w-4" />
                      3D Model Generation
                      <Badge variant="outline" className="ml-1">New</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="architectural-modeling">
                    <div className="flex items-center gap-2">
                      <Cube className="h-4 w-4" />
                      Architectural Modeling
                      <Badge variant="outline" className="ml-1">Advanced</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {getTypeDescription(aiType)}
              </p>
            </div>

            {isImageTypeRequired && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Blueprint Image {isImageTypeRequired && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {imageFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Context (Optional)</label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide additional context about your project, building type, requirements, or specific domain..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  aiType === 'blueprint-analysis' 
                    ? "Describe what you want to analyze in the blueprint (e.g., 'Identify all rooms and structural elements')..."
                    : aiType === '3d-generation'
                    ? "Provide blueprint analysis data or describe the 3D model requirements..."
                    : "Enter your question, request, or content to analyze..."
                }
                rows={4}
                required
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={loading || !prompt.trim() || (isImageTypeRequired && !imageFile)}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing with Gemini AI...
                </>
              ) : (
                <>
                  {getTypeIcon(aiType)}
                  <span className="ml-2">Generate with Gemini AI</span>
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
              Gemini AI Response
              <Badge variant="outline" className="ml-auto">
                {lastResponse.type}
              </Badge>
            </CardTitle>
            <CardDescription className="flex justify-between items-center">
              <span>Generated response from Gemini AI with enhanced capabilities</span>
              <Button variant="ghost" size="sm" onClick={clearLastResponse}>
                Clear
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                  {lastResponse.result}
                </pre>
              </div>
              
              {lastResponse.usage && (
                <>
                  <Separator />
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Total Tokens: {lastResponse.usage.totalTokens}</span>
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
