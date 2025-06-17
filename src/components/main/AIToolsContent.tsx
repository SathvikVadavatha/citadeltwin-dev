
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIServicePanel } from '@/components/ai/AIServicePanel';
import { useViewport } from '@/hooks/useViewport';
import { MessageSquare, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AIToolsContent: React.FC = () => {
  const { isMobile, isTouch } = useViewport();

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Chat Assistant
            </CardTitle>
            <CardDescription>
              Interactive AI assistant for technical consulting and guidance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className={`w-full ${isTouch ? 'min-h-[44px]' : ''}`}>
              <Link to="/ai-assistant">
                Open AI Assistant
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Engineering Tools
            </CardTitle>
            <CardDescription>
              AI-powered calculations and design optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className={`w-full ${isTouch ? 'min-h-[44px]' : ''}`}>
              <Link to="/ai-assistant?tab=calculator">
                Open Calculator
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick AI Service</CardTitle>
          <CardDescription>
            Test AI functionality directly from the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIServicePanel />
        </CardContent>
      </Card>
    </div>
  );
};
