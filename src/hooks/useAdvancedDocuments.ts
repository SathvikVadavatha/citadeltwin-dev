
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { toast } from 'sonner';

export interface AdvancedDocumentRequest {
  templateType: string;
  projectData: {
    title: string;
    description: string;
    jurisdiction?: string;
    clientRequirements?: string;
  };
  aiOptimizations: {
    enhanceNarrative: boolean;
    optimizeCompliance: boolean;
    generateExecutiveSummary: boolean;
    createVisualElements: boolean;
  };
  formatPreferences: {
    includeExecutiveSummary: boolean;
    includeVisualizations: boolean;
    clientCustomization: boolean;
  };
}

export const useAdvancedDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { generateContent } = useGeminiAI();
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  const generateAdvancedDocument = useMutation({
    mutationFn: async (request: AdvancedDocumentRequest) => {
      if (!user) throw new Error('User not authenticated');

      setGenerationProgress(10);
      
      // Step 1: AI Content Enhancement
      const aiEnhancements: Record<string, string> = {};
      
      if (request.aiOptimizations.enhanceNarrative) {
        setGenerationProgress(25);
        const narrativePrompt = `Create a professional engineering narrative for project: "${request.projectData.title}". 
        Description: ${request.projectData.description}
        Jurisdiction: ${request.projectData.jurisdiction || 'General'}
        Focus on technical accuracy, regulatory compliance, and professional presentation.`;
        
        const narrativeResult = await generateContent.mutateAsync({
          prompt: narrativePrompt,
          type: 'technical-consulting'
        });
        aiEnhancements.enhanced_narrative = narrativeResult.result;
      }

      if (request.aiOptimizations.optimizeCompliance && request.projectData.jurisdiction) {
        setGenerationProgress(40);
        const compliancePrompt = `Analyze compliance requirements for jurisdiction: ${request.projectData.jurisdiction}
        Project type: ${request.templateType}
        Project details: ${request.projectData.description}
        Provide specific code references, requirements, and compliance strategies.`;
        
        const complianceResult = await generateContent.mutateAsync({
          prompt: compliancePrompt,
          type: 'technical-consulting'
        });
        aiEnhancements.compliance_analysis = complianceResult.result;
      }

      if (request.aiOptimizations.generateExecutiveSummary) {
        setGenerationProgress(55);
        const summaryPrompt = `Create an executive summary for project: "${request.projectData.title}"
        Description: ${request.projectData.description}
        Client requirements: ${request.projectData.clientRequirements || 'Standard requirements'}
        Make it professional, concise, and suitable for stakeholder presentation.`;
        
        const summaryResult = await generateContent.mutateAsync({
          prompt: summaryPrompt,
          type: 'technical-consulting'
        });
        aiEnhancements.executive_summary = summaryResult.result;
      }

      setGenerationProgress(70);

      // Step 2: Document Assembly
      const documentData = {
        template_type: request.templateType,
        project_data: request.projectData,
        ai_enhancements: aiEnhancements,
        format_preferences: request.formatPreferences,
        generated_by: user.id,
        generation_timestamp: new Date().toISOString()
      };

      setGenerationProgress(85);

      // Step 3: Call document generation service
      const { data, error } = await supabase.functions.invoke('generate-advanced-document', {
        body: documentData
      });

      if (error) throw error;

      setGenerationProgress(100);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-exports'] });
      toast.success('Advanced document generated successfully');
      setGenerationProgress(0);
    },
    onError: (error: any) => {
      toast.error(`Document generation failed: ${error.message}`);
      setGenerationProgress(0);
    }
  });

  const getDocumentTemplatesByCategory = useQuery({
    queryKey: ['document-templates-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      // Group templates by category
      const grouped = data.reduce((acc: Record<string, any[]>, template) => {
        if (!acc[template.category]) {
          acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
      }, {});

      return grouped;
    },
    enabled: !!user
  });

  const getJurisdictionSpecificTemplates = useQuery({
    queryKey: ['jurisdiction-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .like('name', '%jurisdiction%')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  return {
    generateAdvancedDocument,
    generationProgress,
    templatesByCategory: getDocumentTemplatesByCategory.data || {},
    jurisdictionTemplates: getJurisdictionSpecificTemplates.data || [],
    isLoading: generateAdvancedDocument.isPending
  };
};
