
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DocumentSection {
  type: string;
  content?: string;
  fields?: string[];
  auto_generate?: boolean;
}

interface DocumentTemplate {
  sections: DocumentSection[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exportId, templateId, uploadId, formatType, generationData } = await req.json();

    console.log('Starting document generation:', { exportId, templateId, formatType });

    // Get template data
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Get project data if uploadId is provided
    let projectData: any = {};
    if (uploadId) {
      const { data: uploadData } = await supabase
        .from('blueprint_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      const { data: bimElements } = await supabase
        .from('bim_elements')
        .select('*')
        .eq('upload_id', uploadId);

      const { data: complianceViolations } = await supabase
        .from('compliance_violations')
        .select('*')
        .eq('upload_id', uploadId);

      const { data: feaAnalyses } = await supabase
        .from('fea_analyses')
        .select('*')
        .eq('upload_id', uploadId);

      projectData = {
        upload: uploadData,
        bimElements: bimElements || [],
        complianceViolations: complianceViolations || [],
        feaAnalyses: feaAnalyses || [],
      };
    }

    // Generate AI content for template variables
    const aiGeneratedContent: Record<string, string> = {};
    const templateContent = template.template_content as DocumentTemplate;

    for (const variable of template.variables) {
      if (variable.type === 'ai_generated') {
        console.log('Generating AI content for:', variable.name);
        
        const aiPrompt = `${variable.prompt}
        
        Project Context:
        - Project Data: ${JSON.stringify(generationData, null, 2)}
        - BIM Elements: ${projectData.bimElements?.length || 0} elements
        - Compliance Issues: ${projectData.complianceViolations?.length || 0} violations
        - FEA Analyses: ${projectData.feaAnalyses?.length || 0} analyses
        
        Please provide professional, technical content appropriate for ${template.template_type} documentation.`;

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: aiPrompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
              }
            }),
          });

          const aiData = await response.json();
          const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'AI content generation failed';
          aiGeneratedContent[variable.name] = generatedText;
        } catch (aiError) {
          console.error('AI generation error:', aiError);
          aiGeneratedContent[variable.name] = `[AI content generation failed for ${variable.name}]`;
        }
      }
    }

    // Process template content and replace placeholders
    const processedContent = await processTemplateContent(templateContent, {
      ...generationData,
      ...aiGeneratedContent,
      projectData,
    });

    // Generate document based on format type
    let documentContent: string;
    let fileName: string;

    if (formatType === 'pdf') {
      documentContent = generatePDFContent(processedContent, template.name);
      fileName = `${generationData.project_name || 'document'}.pdf`;
    } else {
      documentContent = generateDOCXContent(processedContent, template.name);
      fileName = `${generationData.project_name || 'document'}.docx`;
    }

    // Store the generated document (simplified - would normally upload to storage)
    const documentPath = `documents/${exportId}/${fileName}`;
    
    // Update export record
    const { error: updateError } = await supabase
      .from('document_exports')
      .update({
        status: 'completed',
        file_path: documentPath,
        file_size: documentContent.length,
        ai_generated_content: aiGeneratedContent,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        exportId,
        filePath: documentPath,
        aiGeneratedContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Document generation error:', error);
    
    // Update export record with error
    if (req.body) {
      const { exportId } = await req.json();
      await supabase
        .from('document_exports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', exportId);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processTemplateContent(template: DocumentTemplate, variables: Record<string, any>): Promise<any> {
  const processedSections = [];

  for (const section of template.sections) {
    const processedSection = { ...section };

    if (section.content && typeof section.content === 'string') {
      // Replace template variables
      let content = section.content;
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      }
      processedSection.content = content;
    }

    processedSections.push(processedSection);
  }

  return { sections: processedSections };
}

function generatePDFContent(content: any, templateName: string): string {
  // Simplified PDF generation - in production would use a proper PDF library
  const sections = content.sections.map((section: any) => {
    return `
      <div class="section">
        <h3>${section.type.replace('_', ' ').toUpperCase()}</h3>
        <div>${section.content || 'Content not available'}</div>
      </div>
    `;
  }).join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${templateName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .section { margin-bottom: 30px; }
        h3 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
      </style>
    </head>
    <body>
      <h1>${templateName}</h1>
      ${sections}
    </body>
    </html>
  `;
}

function generateDOCXContent(content: any, templateName: string): string {
  // Simplified DOCX generation - in production would use a proper DOCX library
  const sections = content.sections.map((section: any) => {
    return `${section.type.replace('_', ' ').toUpperCase()}\n${section.content || 'Content not available'}\n\n`;
  }).join('');

  return `${templateName}\n\n${sections}`;
}
