
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  upload_id: string;
  template_id: string;
  document_type: string;
  user_id: string;
  variables?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { upload_id, template_id, document_type, user_id, variables }: DocumentRequest = await req.json();

    console.log(`Starting document generation for upload ${upload_id}, template ${template_id}`);

    // Get template
    const { data: template, error: templateError } = await supabaseClient
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError) throw templateError;

    // Create document export record
    const { data: docExport, error: exportError } = await supabaseClient
      .from('document_exports')
      .insert({
        upload_id,
        template_id,
        document_type,
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        status: 'generating',
        format_type: 'pdf',
        generated_by: user_id,
        generation_data: variables || {}
      })
      .select()
      .single();

    if (exportError) throw exportError;

    // Generate document asynchronously
    EdgeRuntime.waitUntil(generateDocument(
      supabaseClient,
      docExport.id,
      template,
      upload_id,
      variables || {}
    ));

    return new Response(
      JSON.stringify({
        success: true,
        export_id: docExport.id,
        message: 'Document generation started',
        template_name: template.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in document generation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateDocument(
  supabaseClient: any,
  exportId: string,
  template: any,
  uploadId: string,
  variables: Record<string, any>
) {
  try {
    // Gather data from various sources
    const documentData = await gatherDocumentData(supabaseClient, uploadId, template.variables);

    // Merge with provided variables
    const allVariables = { ...documentData, ...variables };

    // Generate AI content for AI-generated variables
    const aiContent = await generateAIContent(template.variables, allVariables);
    const finalVariables = { ...allVariables, ...aiContent };

    // Generate document content based on template
    const documentContent = await processTemplate(template.template_content, finalVariables);

    // Convert to PDF/DOCX (simplified - would use actual document generation library)
    const filePath = await generateDocumentFile(documentContent, template.format_type, exportId);

    // Update export record
    await supabaseClient
      .from('document_exports')
      .update({
        status: 'completed',
        file_path: filePath,
        file_size: 1024000, // Placeholder
        ai_generated_content: aiContent,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId);

    console.log(`Document generation completed for export ${exportId}`);

  } catch (error) {
    console.error('Error generating document:', error);
    
    await supabaseClient
      .from('document_exports')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', exportId);
  }
}

async function gatherDocumentData(supabaseClient: any, uploadId: string, variables: any[]) {
  const data: Record<string, any> = {};

  // Get blueprint upload info
  const { data: upload } = await supabaseClient
    .from('blueprint_uploads')
    .select('*, projects(*)')
    .eq('id', uploadId)
    .single();

  if (upload) {
    data.project_name = upload.projects?.name || 'Untitled Project';
    data.upload_filename = upload.original_filename;
    data.upload_date = new Date(upload.created_at).toLocaleDateString();
  }

  // Get BIM elements data
  const { data: bimElements } = await supabaseClient
    .from('bim_elements')
    .select('*')
    .eq('upload_id', uploadId);

  if (bimElements) {
    data.element_count = bimElements.length;
    data.element_types = [...new Set(bimElements.map(e => e.element_type))];
    data.element_details = bimElements;
  }

  // Get compliance violations
  const { data: violations } = await supabaseClient
    .from('compliance_violations')
    .select('*')
    .eq('upload_id', uploadId);

  if (violations) {
    data.compliance_status = violations.length === 0 ? 'Compliant' : 'Non-Compliant';
    data.violation_count = violations.length;
    data.violations_by_severity = violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});
  }

  // Get FEA results
  const { data: feaResults } = await supabaseClient
    .from('fea_analyses')
    .select('*, fea_results(*)')
    .eq('upload_id', uploadId);

  if (feaResults) {
    data.fea_analyses_count = feaResults.length;
    data.fea_results = feaResults;
  }

  return data;
}

async function generateAIContent(variables: any[], data: Record<string, any>) {
  const aiContent: Record<string, any> = {};
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not found, skipping AI content generation');
    return aiContent;
  }

  for (const variable of variables) {
    if (variable.type === 'ai_generated' && variable.prompt) {
      try {
        const prompt = `${variable.prompt}. Context: ${JSON.stringify(data, null, 2)}`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const result = await response.json();
        aiContent[variable.name] = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Content generation failed';

      } catch (error) {
        console.error(`Error generating AI content for ${variable.name}:`, error);
        aiContent[variable.name] = 'Error generating content';
      }
    }
  }

  return aiContent;
}

async function processTemplate(templateContent: any, variables: Record<string, any>) {
  // Simple template processing - replace {{variable}} with actual values
  let content = JSON.stringify(templateContent);
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value) : String(value);
    content = content.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return JSON.parse(content);
}

async function generateDocumentFile(content: any, format: string, exportId: string): Promise<string> {
  // Placeholder for actual document generation
  // In real implementation, would use libraries like jsPDF, docx, etc.
  const filePath = `documents/${exportId}.${format}`;
  
  console.log(`Generated ${format} document at ${filePath}`);
  return filePath;
}
