
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGeminiAI, AIRequestType } from '@/hooks/useGeminiAI';
import { Brain, Calculator, Zap, MessageSquare, Send, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: AIRequestType;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface AIMode {
  id: AIRequestType | 'design-optimization' | 'engineering-calculations';
  name: string;
  description: string;
  icon: React.ReactNode;
  systemPrompt: string;
}

const AI_MODES: AIMode[] = [
  {
    id: 'technical-consulting',
    name: 'Technical Consultant',
    description: 'Expert advice on civil engineering, BIM, and structural analysis',
    icon: <MessageSquare className="h-4 w-4" />,
    systemPrompt: 'You are a senior civil engineering consultant specializing in digital twins, BIM, CAD, and structural analysis. Provide expert technical advice with practical implementation guidance.'
  },
  {
    id: 'text-analysis',
    name: 'Code Compliance Analyzer',
    description: 'Analyze building codes, regulations, and compliance requirements',
    icon: <Brain className="h-4 w-4" />,
    systemPrompt: 'You are a building code compliance expert. Analyze documents, plans, and requirements for compliance with building codes and safety regulations.'
  },
  {
    id: 'engineering-calculations',
    name: 'Engineering Calculator',
    description: 'Perform structural calculations and engineering analysis',
    icon: <Calculator className="h-4 w-4" />,
    systemPrompt: 'You are a structural engineer specializing in calculations. Provide detailed engineering calculations, load analysis, and structural design guidance with proper formulas and safety factors.'
  },
  {
    id: 'design-optimization',
    name: 'Design Optimizer',
    description: 'Suggest design improvements and optimizations',
    icon: <Zap className="h-4 w-4" />,
    systemPrompt: 'You are a design optimization expert. Analyze designs for efficiency, cost-effectiveness, sustainability, and performance improvements.'
  },
  {
    id: 'code-generation',
    name: 'Code Assistant',
    description: 'Generate code for engineering applications',
    icon: <Brain className="h-4 w-4" />,
    systemPrompt: 'You are a software engineer specializing in engineering applications. Generate clean, efficient code for CAD, BIM, and structural analysis tools.'
  }
];

export const EnhancedAIAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<AIMode>(AI_MODES[0]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generateResponse, loading } = useGeminiAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      type: selectedMode.id as AIRequestType,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await generateResponse({
        prompt: currentMessage,
        type: selectedMode.id as AIRequestType,
        context: `${selectedMode.systemPrompt}\n\nCurrent conversation context: ${messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`,
        maxTokens: 2000
      });

      if (response) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.result,
          type: selectedMode.id as AIRequestType,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    toast.success(`Feedback recorded: ${feedback}`);
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className="flex flex-col h-[800px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                CitadelTwin AI Assistant
              </CardTitle>
              <CardDescription>
                Advanced AI-powered engineering assistant with specialized modes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat}>
              Clear Chat
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Select 
                value={selectedMode.id} 
                onValueChange={(value) => {
                  const mode = AI_MODES.find(m => m.id === value);
                  if (mode) setSelectedMode(mode);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODES.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div className="flex items-center gap-2">
                        {mode.icon}
                        {mode.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="ml-auto">
              {selectedMode.name}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {selectedMode.description}
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with the AI assistant</p>
                  <p className="text-sm">Ask questions about engineering, get design suggestions, or request calculations</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {message.role === 'user' ? 'You' : selectedMode.name}
                      </Badge>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'positive')}
                          className={message.feedback === 'positive' ? 'text-green-500' : ''}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback(message.id, 'negative')}
                          className={message.feedback === 'negative' ? 'text-red-500' : ''}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedMode.name}
                      </Badge>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={`Ask ${selectedMode.name.toLowerCase()} a question...`}
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || loading}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
