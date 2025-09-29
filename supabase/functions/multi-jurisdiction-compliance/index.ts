
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

interface ComplianceRequest {
  uploadId?: string;
  projectId?: string;
  jurisdiction: string;
  elements: any[];
  buildingType: string;
  analysisType: 'full' | 'incremental' | 'targeted';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ComplianceRequest = await req.json();
    console.log('Multi-jurisdiction compliance check started:', requestData);

    // Get jurisdiction-specific rules
    const { data: jurisdictionRules, error: rulesError } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('jurisdiction', requestData.jurisdiction)
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    console.log(`Found ${jurisdictionRules.length} rules for jurisdiction: ${requestData.jurisdiction}`);

    // Get jurisdiction codes
    const { data: jurisdictionData, error: jurisdictionError } = await supabase
      .from('jurisdictions')
      .select(`
        *,
        jurisdiction_codes (*)
      `)
      .eq('name', requestData.jurisdiction)
      .single();

    if (jurisdictionError) {
      console.log('Jurisdiction not found, using general rules');
    }

    // AI-powered compliance analysis using Gemini
    const compliancePrompt = `
    Analyze building compliance for jurisdiction: ${requestData.jurisdiction}
    Building Type: ${requestData.buildingType}
    Elements to check: ${JSON.stringify(requestData.elements.slice(0, 5))}
    
    Applicable codes: ${jurisdictionData ? JSON.stringify(jurisdictionData.jurisdiction_codes) : 'General building codes'}
    
    Provide detailed compliance analysis including:
    1. Code violations and their severity
    2. Required corrections with specific code references
    3. Recommendations for compliance
    4. Risk assessment
    
    Format as JSON with violations array, each containing:
    - violation_type, severity, description, code_reference, remediation_suggestions, affected_elements
    `;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: compliancePrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    const geminiResult = await geminiResponse.json();
    const aiAnalysis = geminiResult.candidates[0].content.parts[0].text;

    console.log('Gemini AI analysis completed');

    // Process violations from AI analysis
    let violations = [];
    try {
      const analysisJson = JSON.parse(aiAnalysis);
      violations = analysisJson.violations || [];
    } catch (e) {
      console.log('AI response not JSON, parsing text analysis');
      // Fallback: create violations from text analysis
      violations = [{
        violation_type: 'ai_analysis',
        severity: 'medium',
        description: aiAnalysis,
        code_reference: 'AI Analysis',
        remediation_suggestions: ['Review AI recommendations'],
        affected_elements: requestData.elements.map(e => e.id)
      }];
    }

    // Store compliance check results
    const { data: checkRecord, error: checkError } = await supabase
      .from('compliance_checks')
      .insert({
        upload_id: requestData.uploadId,
        user_id: requestData.projectId, // Using project_id as user_id for now
        check_type: requestData.analysisType,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        violations_found: violations.length,
        rules_checked: jurisdictionRules.length,
        metadata: {
          jurisdiction: requestData.jurisdiction,
          building_type: requestData.buildingType,
          ai_analysis: aiAnalysis
        }
      })
      .select()
      .single();

    if (checkError) throw checkError;

    // Store individual violations
    const violationRecords = violations.map((violation: any) => ({
      upload_id: requestData.uploadId,
      rule_id: jurisdictionRules[0]?.id, // Link to first applicable rule
      violation_type: violation.violation_type,
      severity: violation.severity,
      description: violation.description,
      current_value: violation.current_value || {},
      required_value: violation.required_value || {},
      location: violation.location || {},
      remediation_suggestions: violation.remediation_suggestions || [],
      status: 'open'
    }));

    if (violationRecords.length > 0) {
      const { error: violationsError } = await supabase
        .from('compliance_violations')
        .insert(violationRecords);

      if (violationsError) throw violationsError;
    }

    console.log(`Compliance check completed. Found ${violations.length} violations`);

    return new Response(
      JSON.stringify({
        success: true,
        checkId: checkRecord.id,
        jurisdiction: requestData.jurisdiction,
        violations_found: violations.length,
        rules_checked: jurisdictionRules.length,
        violations: violations,
        ai_analysis: aiAnalysis,
        compliance_status: violations.length === 0 ? 'compliant' : 'violations_found'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Multi-jurisdiction compliance error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        details: 'Failed to complete multi-jurisdiction compliance check'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
