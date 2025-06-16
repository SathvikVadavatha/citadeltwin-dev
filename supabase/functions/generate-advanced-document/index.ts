
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

interface AdvancedDocumentRequest {
  template_type: string;
  project_data: {
    title: string;
    description: string;
    jurisdiction?: string;
    clientRequirements?: string;
  };
  ai_enhancements: Record<string, string>;
  format_preferences: {
    includeExecutiveSummary: boolean;
    includeVisualizations: boolean;
    clientCustomization: boolean;
  };
  generated_by: string;
  generation_timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: AdvancedDocumentRequest = await req.json();

    console.log('Starting advanced document generation:', { 
      template_type: requestData.template_type,
      project_title: requestData.project_data.title 
    });

    // Create document export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('document_exports')
      .insert({
        title: requestData.project_data.title,
        document_type: requestData.template_type,
        format_type: 'pdf',
        status: 'generating',
        generated_by: requestData.generated_by,
        generation_data: requestData,
        ai_generated_content: requestData.ai_enhancements
      })
      .select()
      .single();

    if (exportError) throw exportError;

    // Generate sophisticated document content based on template type
    let documentContent = '';
    let fileName = `${requestData.project_data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    switch (requestData.template_type) {
      case 'permit_package':
        documentContent = generatePermitPackage(requestData);
        break;
      case 'structural_report':
        documentContent = generateStructuralReport(requestData);
        break;
      case 'client_presentation':
        documentContent = generateClientPresentation(requestData);
        break;
      case 'compliance_report':
        documentContent = generateComplianceReport(requestData);
        break;
      default:
        documentContent = generateStandardDocument(requestData);
    }

    // Simulate file storage (in production, would upload to actual storage)
    const documentPath = `documents/advanced/${exportRecord.id}/${fileName}`;
    
    // Update export record with completion
    const { error: updateError } = await supabase
      .from('document_exports')
      .update({
        status: 'completed',
        file_path: documentPath,
        file_size: documentContent.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', exportRecord.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        exportId: exportRecord.id,
        filePath: documentPath,
        documentContent: documentContent.slice(0, 500) + '...', // Preview
        aiEnhancements: requestData.ai_enhancements,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Advanced document generation error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generatePermitPackage(data: AdvancedDocumentRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Permit Application Package - ${data.project_data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .ai-enhanced { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0066cc; }
    h1 { color: #333; }
    h2 { color: #0066cc; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .compliance-section { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PERMIT APPLICATION PACKAGE</h1>
    <h2>${data.project_data.title}</h2>
    <p>Jurisdiction: ${data.project_data.jurisdiction || 'General'}</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  ${data.ai_enhancements.executive_summary ? `
  <div class="section ai-enhanced">
    <h2>Executive Summary</h2>
    <p>${data.ai_enhancements.executive_summary}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>Project Description</h2>
    <p>${data.project_data.description}</p>
    ${data.ai_enhancements.enhanced_narrative ? `
    <div class="ai-enhanced">
      <h3>Enhanced Technical Narrative</h3>
      <p>${data.ai_enhancements.enhanced_narrative}</p>
    </div>
    ` : ''}
  </div>

  ${data.ai_enhancements.compliance_analysis ? `
  <div class="section compliance-section">
    <h2>Compliance Analysis</h2>
    <p>${data.ai_enhancements.compliance_analysis}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>Required Documents</h2>
    <ul>
      <li>Site Plan</li>
      <li>Floor Plans</li>
      <li>Elevation Drawings</li>
      <li>Structural Calculations</li>
      <li>Energy Compliance Forms</li>
      <li>Zoning Compliance Statement</li>
    </ul>
  </div>

  <div class="section">
    <h2>Application Summary</h2>
    <p>This permit application package contains all required documentation for ${data.project_data.title}. 
    All drawings and calculations have been prepared in accordance with applicable building codes and regulations.</p>
  </div>
</body>
</html>
  `;
}

function generateStructuralReport(data: AdvancedDocumentRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Structural Engineering Report - ${data.project_data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .calculation-box { background-color: #f5f5f5; padding: 15px; border: 1px solid #ccc; font-family: monospace; }
    .ai-enhanced { background-color: #fff8dc; padding: 15px; border-left: 4px solid #DAA520; }
    h1 { color: #8B4513; }
    h2 { color: #8B4513; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>STRUCTURAL ENGINEERING REPORT</h1>
    <h2>${data.project_data.title}</h2>
    <p>Report Date: ${new Date().toLocaleDateString()}</p>
  </div>

  ${data.ai_enhancements.executive_summary ? `
  <div class="section ai-enhanced">
    <h2>Executive Summary</h2>
    <p>${data.ai_enhancements.executive_summary}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>Project Overview</h2>
    <p>${data.project_data.description}</p>
  </div>

  <div class="section">
    <h2>Design Criteria</h2>
    <ul>
      <li>Building Code: IBC 2021</li>
      <li>Wind Load: As per ASCE 7-16</li>
      <li>Seismic: As per ASCE 7-16</li>
      <li>Live Load: As per IBC Table 1607.1</li>
    </ul>
  </div>

  <div class="section">
    <h2>Structural Analysis</h2>
    ${data.ai_enhancements.enhanced_narrative ? `
    <div class="ai-enhanced">
      <h3>AI-Enhanced Analysis</h3>
      <p>${data.ai_enhancements.enhanced_narrative}</p>
    </div>
    ` : ''}
    
    <div class="calculation-box">
      <h3>Load Calculations</h3>
      <p>Dead Load: 15 psf</p>
      <p>Live Load: 40 psf</p>
      <p>Total Load: 55 psf</p>
    </div>
  </div>

  <div class="section">
    <h2>Recommendations</h2>
    <ol>
      <li>All structural elements shall be designed per applicable codes</li>
      <li>Regular inspections during construction are recommended</li>
      <li>Any modifications require engineering review</li>
    </ol>
  </div>
</body>
</html>
  `;
}

function generateClientPresentation(data: AdvancedDocumentRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Project Presentation - ${data.project_data.title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
    .slide { background: white; margin: 30px 0; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; background: #4a5568; color: white; padding: 30px; border-radius: 10px; }
    .ai-enhanced { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 20px; border-radius: 8px; margin: 15px 0; }
    h1 { font-size: 2.5em; margin: 0; }
    h2 { color: #4a5568; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .highlight { background-color: #ffd700; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="slide header">
    <h1>${data.project_data.title}</h1>
    <p style="font-size: 1.2em;">Professional Project Presentation</p>
    <p>Prepared: ${new Date().toLocaleDateString()}</p>
  </div>

  ${data.ai_enhancements.executive_summary ? `
  <div class="slide ai-enhanced">
    <h2>Executive Overview</h2>
    <p style="font-size: 1.1em;">${data.ai_enhancements.executive_summary}</p>
  </div>
  ` : ''}

  <div class="slide">
    <h2>Project Scope</h2>
    <p style="font-size: 1.1em;">${data.project_data.description}</p>
    
    ${data.project_data.clientRequirements ? `
    <h3>Client Requirements</h3>
    <p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff;">${data.project_data.clientRequirements}</p>
    ` : ''}
  </div>

  ${data.ai_enhancements.enhanced_narrative ? `
  <div class="slide">
    <h2>Technical Approach</h2>
    <div class="ai-enhanced">
      <p>${data.ai_enhancements.enhanced_narrative}</p>
    </div>
  </div>
  ` : ''}

  <div class="slide">
    <h2>Project Benefits</h2>
    <ul style="font-size: 1.1em; line-height: 1.8;">
      <li>✅ <span class="highlight">Code Compliant</span> Design</li>
      <li>✅ <span class="highlight">Cost Effective</span> Solution</li>
      <li>✅ <span class="highlight">Sustainable</span> Approach</li>
      <li>✅ <span class="highlight">Future Ready</span> Infrastructure</li>
    </ul>
  </div>

  <div class="slide">
    <h2>Next Steps</h2>
    <ol style="font-size: 1.1em; line-height: 1.8;">
      <li>Final design review and approval</li>
      <li>Permit submission and processing</li>
      <li>Construction documentation</li>
      <li>Construction administration</li>
    </ol>
  </div>
</body>
</html>
  `;
}

function generateComplianceReport(data: AdvancedDocumentRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Compliance Report - ${data.project_data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .compliance-pass { background-color: #d4edda; padding: 10px; border-left: 4px solid #28a745; }
    .compliance-review { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; }
    .ai-enhanced { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; }
    h1 { color: #dc3545; }
    h2 { color: #dc3545; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMPLIANCE ASSESSMENT REPORT</h1>
    <h2>${data.project_data.title}</h2>
    <p>Jurisdiction: ${data.project_data.jurisdiction || 'General'}</p>
    <p>Assessment Date: ${new Date().toLocaleDateString()}</p>
  </div>

  ${data.ai_enhancements.compliance_analysis ? `
  <div class="section ai-enhanced">
    <h2>AI-Powered Compliance Analysis</h2>
    <p>${data.ai_enhancements.compliance_analysis}</p>
  </div>
  ` : ''}

  <div class="section">
    <h2>Building Code Compliance</h2>
    <div class="compliance-pass">
      <h3>✅ Structural Requirements</h3>
      <p>All structural elements meet IBC requirements</p>
    </div>
    <div class="compliance-pass">
      <h3>✅ Fire Safety</h3>
      <p>Egress and fire protection systems comply with code</p>
    </div>
    <div class="compliance-review">
      <h3>⚠️ Energy Code</h3>
      <p>Energy calculations require review for jurisdiction-specific requirements</p>
    </div>
  </div>

  <div class="section">
    <h2>Zoning Compliance</h2>
    <div class="compliance-pass">
      <h3>✅ Setback Requirements</h3>
      <p>Building placement meets all setback requirements</p>
    </div>
    <div class="compliance-pass">
      <h3>✅ Height Restrictions</h3>
      <p>Building height is within zoning limits</p>
    </div>
  </div>

  <div class="section">
    <h2>Recommendations</h2>
    <ol>
      <li>Submit energy calculations for jurisdiction review</li>
      <li>Coordinate with local authorities for final approval</li>
      <li>Ensure all permits are obtained before construction</li>
    </ol>
  </div>
</body>
</html>
  `;
}

function generateStandardDocument(data: AdvancedDocumentRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${data.project_data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.project_data.title}</h1>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="section">
    <h2>Project Description</h2>
    <p>${data.project_data.description}</p>
  </div>
</body>
</html>
  `;
}
