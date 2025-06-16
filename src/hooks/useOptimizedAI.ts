import { useCallback } from 'react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

export const useOptimizedAI = () => {
  const geminiAI = useGeminiAI();

  const optimizedGenerateResponse = useCallback(async (request: any) => {
    const requestKey = JSON.stringify(request);
    return PerformanceOptimizer.optimizeAIRequests(
      requestKey,
      () => geminiAI.generateResponse(request),
      600000 // 10 minutes cache for AI responses
    );
  }, [geminiAI.generateResponse]);

  const optimizedAnalyzeText = useCallback(async (text: string, context?: string) => {
    const requestKey = `analyze-${text.slice(0, 50)}-${context || ''}`;
    return PerformanceOptimizer.optimizeAIRequests(
      requestKey,
      () => geminiAI.analyzeText(text, context),
      300000 // 5 minutes cache for analysis
    );
  }, [geminiAI.analyzeText]);

  const optimizedGenerateCode = useCallback(async (requirements: string, context?: string) => {
    const requestKey = `code-${requirements.slice(0, 50)}-${context || ''}`;
    return PerformanceOptimizer.optimizeAIRequests(
      requestKey,
      () => geminiAI.generateCode(requirements, context),
      600000 // 10 minutes cache for code generation
    );
  }, [geminiAI.generateCode]);

  return {
    ...geminiAI,
    optimizedGenerateResponse,
    optimizedAnalyzeText,
    optimizedGenerateCode,
    // Keep the original methods available as well
    generateResponse: geminiAI.generateResponse,
    analyzeText: geminiAI.analyzeText,
    generateCode: geminiAI.generateCode,
  };
};
