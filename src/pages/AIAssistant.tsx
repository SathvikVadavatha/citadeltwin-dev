
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedAIAssistant } from '@/components/ai/EnhancedAIAssistant';
import { DesignOptimizationPanel } from '@/components/ai/DesignOptimizationPanel';
import { EngineeringCalculatorPanel } from '@/components/ai/EngineeringCalculatorPanel';
import { AIComplianceAnalyzer } from '@/components/ai/AIComplianceAnalyzer';
import { AIServicePanel } from '@/components/ai/AIServicePanel';
import { Brain, Calculator, Zap, Shield, MessageSquare } from 'lucide-react';

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            CitadelTwin AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Advanced AI-powered tools for engineering design, analysis, and optimization
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Service Panel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <EnhancedAIAssistant />
          </TabsContent>

          <TabsContent value="optimization">
            <DesignOptimizationPanel />
          </TabsContent>

          <TabsContent value="calculator">
            <EngineeringCalculatorPanel />
          </TabsContent>

          <TabsContent value="compliance">
            <AIComplianceAnalyzer />
          </TabsContent>

          <TabsContent value="service">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Basic AI Service Panel
                </CardTitle>
                <CardDescription>
                  Direct access to core Gemini AI functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIServicePanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
