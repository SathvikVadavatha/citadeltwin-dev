
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Settings, Play, Pause, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

interface OptimizationSettings {
  enabled: boolean;
  frequency: 'realtime' | 'onchange' | 'scheduled';
  criteria: string[];
  threshold: number;
  autoApply: boolean;
}

interface OptimizationResult {
  id: string;
  timestamp: Date;
  type: 'automated' | 'manual';
  changes: Array<{
    element: string;
    oldValue: any;
    newValue: any;
    improvement: string;
  }>;
  score: number;
  applied: boolean;
}

export const AutomatedDesignOptimizer = () => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    enabled: false,
    frequency: 'onchange',
    criteria: ['cost', 'performance'],
    threshold: 10,
    autoApply: false
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');
  
  const { generateResponse, loading } = useGeminiAI();

  const optimizationCriteria = [
    { id: 'cost', name: 'Cost Optimization', description: 'Minimize material and construction costs' },
    { id: 'performance', name: 'Structural Performance', description: 'Optimize load capacity and efficiency' },
    { id: 'sustainability', name: 'Environmental Impact', description: 'Reduce carbon footprint and waste' },
    { id: 'maintenance', name: 'Maintainability', description: 'Reduce long-term maintenance needs' },
    { id: 'safety', name: 'Safety Factor', description: 'Improve safety margins and reliability' }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (settings.enabled && settings.frequency === 'realtime') {
      interval = setInterval(() => {
        if (!isRunning) {
          runAutomatedOptimization();
        }
      }, 30000); // Run every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.enabled, settings.frequency, isRunning]);

  const runAutomatedOptimization = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentAnalysis('Initializing optimization analysis...');

    try {
      // Simulate progressive analysis
      const steps = [
        'Analyzing current design parameters...',
        'Evaluating optimization criteria...',
        'Calculating potential improvements...',
        'Generating optimization recommendations...',
        'Validating proposed changes...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentAnalysis(steps[i]);
        setProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate AI optimization suggestions
      const prompt = `
        Analyze the current design for automated optimization based on these criteria: ${settings.criteria.join(', ')}.
        
        Current optimization settings:
        - Improvement threshold: ${settings.threshold}%
        - Auto-apply: ${settings.autoApply ? 'enabled' : 'disabled'}
        - Frequency: ${settings.frequency}
        
        Provide specific, actionable optimization recommendations that could be automatically applied to improve the design.
        Focus on measurable improvements and include confidence scores.
      `;

      const response = await generateResponse({
        prompt,
        type: 'technical-consulting',
        context: 'You are an automated design optimization engine for civil engineering projects.',
        maxTokens: 2000
      });

      if (response) {
        // Create mock optimization result
        const optimizationResult: OptimizationResult = {
          id: `opt_${Date.now()}`,
          timestamp: new Date(),
          type: 'automated',
          changes: [
            {
              element: 'Structural Beam B-1',
              oldValue: 'W14x30',
              newValue: 'W14x26',
              improvement: '12% material cost reduction'
            },
            {
              element: 'Column C-1',
              oldValue: 'HSS8x8x1/2',
              newValue: 'HSS8x8x3/8',
              improvement: '8% weight reduction, maintains capacity'
            }
          ],
          score: 85,
          applied: settings.autoApply
        };

        setResults(prev => [optimizationResult, ...prev.slice(0, 9)]);
        setProgress(100);
        setCurrentAnalysis('Optimization complete!');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      setCurrentAnalysis('Optimization failed - please try again');
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setProgress(0);
        setCurrentAnalysis('');
      }, 2000);
    }
  };

  const applyOptimization = (resultId: string) => {
    setResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, applied: true } : result
    ));
  };

  const revertOptimization = (resultId: string) => {
    setResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, applied: false } : result
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automated Design Optimization
          </CardTitle>
          <CardDescription>
            AI-powered continuous optimization of your design for cost, performance, and sustainability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="auto-optimize">Enable Automated Optimization</Label>
              <p className="text-sm text-muted-foreground">
                Automatically analyze and suggest design improvements
              </p>
            </div>
            <Switch
              id="auto-optimize"
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Optimization Frequency</Label>
                  <Select
                    value={settings.frequency}
                    onValueChange={(frequency: any) => setSettings(prev => ({ ...prev, frequency }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="onchange">On design changes</SelectItem>
                      <SelectItem value="scheduled">Scheduled intervals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Improvement Threshold (%)</Label>
                  <Select
                    value={settings.threshold.toString()}
                    onValueChange={(threshold) => setSettings(prev => ({ ...prev, threshold: parseInt(threshold) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5% - High sensitivity</SelectItem>
                      <SelectItem value="10">10% - Moderate</SelectItem>
                      <SelectItem value="15">15% - Conservative</SelectItem>
                      <SelectItem value="20">20% - Major changes only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Optimization Criteria</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {optimizationCriteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={criterion.id}
                        checked={settings.criteria.includes(criterion.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings(prev => ({ ...prev, criteria: [...prev.criteria, criterion.id] }));
                          } else {
                            setSettings(prev => ({ ...prev, criteria: prev.criteria.filter(c => c !== criterion.id) }));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={criterion.id} className="text-sm">
                        {criterion.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label htmlFor="auto-apply">Auto-apply Optimizations</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically apply optimizations that meet the threshold
                  </p>
                </div>
                <Switch
                  id="auto-apply"
                  checked={settings.autoApply}
                  onCheckedChange={(autoApply) => setSettings(prev => ({ ...prev, autoApply }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runAutomatedOptimization}
                  disabled={isRunning || loading}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Optimization Now
                    </>
                  )}
                </Button>
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentAnalysis}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optimization Results</CardTitle>
            <CardDescription>
              Recent automated optimization recommendations and applied changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={result.applied ? "default" : "secondary"}>
                        Score: {result.score}%
                      </Badge>
                      <Badge variant="outline">
                        {result.type}
                      </Badge>
                      {result.applied && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {result.timestamp.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {result.changes.map((change, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{change.element}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{change.oldValue}</span>
                          <span>→</span>
                          <span className="font-medium">{change.newValue}</span>
                          <Badge variant="outline" className="text-xs">
                            {change.improvement}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {!result.applied ? (
                      <Button
                        size="sm"
                        onClick={() => applyOptimization(result.id)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Apply Changes
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revertOptimization(result.id)}
                        className="flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Revert
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
