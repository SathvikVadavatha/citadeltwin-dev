
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  upload_id: string;
  jurisdictions: string[];
  user_id: string;
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

    const { upload_id, jurisdictions, user_id }: ComplianceRequest = await req.json();

    console.log(`Starting multi-jurisdiction compliance check for upload ${upload_id}`);

    // Get BIM elements for the upload
    const { data: bimElements, error: bimError } = await supabaseClient
      .from('bim_elements')
      .select('*')
      .eq('upload_id', upload_id);

    if (bimError) throw bimError;

    // Get applicable compliance rules for all jurisdictions
    const { data: rules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select(`
        *,
        jurisdictions!inner(*)
      `)
      .in('jurisdictions.id', jurisdictions)
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    // Create compliance check record
    const { data: complianceCheck, error: checkError } = await supabaseClient
      .from('compliance_checks')
      .insert({
        upload_id,
        check_type: 'multi_jurisdiction',
        user_id,
        status: 'running',
        metadata: { jurisdictions, total_rules: rules.length }
      })
      .select()
      .single();

    if (checkError) throw checkError;

    // Process compliance rules asynchronously
    EdgeRuntime.waitUntil(processComplianceRules(
      supabaseClient,
      complianceCheck.id,
      bimElements,
      rules,
      upload_id
    ));

    return new Response(
      JSON.stringify({
        success: true,
        compliance_check_id: complianceCheck.id,
        message: 'Multi-jurisdiction compliance check started',
        rules_count: rules.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in multi-jurisdiction compliance:', error);
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

async function processComplianceRules(
  supabaseClient: any,
  checkId: string,
  bimElements: any[],
  rules: any[],
  uploadId: string
) {
  try {
    const violations = [];
    let processedRules = 0;

    for (const rule of rules) {
      processedRules++;
      
      // Apply rule logic to each relevant BIM element
      for (const element of bimElements) {
        const violation = await evaluateRule(rule, element);
        if (violation) {
          violations.push({
            upload_id: uploadId,
            element_id: element.id,
            rule_id: rule.id,
            violation_type: rule.rule_type,
            severity: determineSeverity(rule, violation),
            description: `${rule.title}: ${violation.description}`,
            location: element.geometry,
            current_value: violation.current_value,
            required_value: violation.required_value,
            remediation_suggestions: generateRemediationSuggestions(rule, violation)
          });
        }
      }

      // Update progress
      await supabaseClient
        .from('compliance_checks')
        .update({ 
          rules_checked: processedRules,
          metadata: { processed: processedRules, total: rules.length }
        })
        .eq('id', checkId);
    }

    // Insert all violations
    if (violations.length > 0) {
      await supabaseClient
        .from('compliance_violations')
        .insert(violations);
    }

    // Complete the check
    await supabaseClient
      .from('compliance_checks')
      .update({
        status: 'completed',
        violations_found: violations.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', checkId);

    console.log(`Compliance check completed: ${violations.length} violations found`);

  } catch (error) {
    console.error('Error processing compliance rules:', error);
    
    await supabaseClient
      .from('compliance_checks')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: { error: error.message }
      })
      .eq('id', checkId);
  }
}

async function evaluateRule(rule: any, element: any): Promise<any | null> {
  const ruleLogic = rule.rule_logic;
  
  switch (rule.rule_type) {
    case 'height_limit':
      return evaluateHeightLimit(ruleLogic, element);
    case 'area_limit':
      return evaluateAreaLimit(ruleLogic, element);
    case 'egress':
      return evaluateEgress(ruleLogic, element);
    case 'fire_rating':
      return evaluateFireRating(ruleLogic, element);
    default:
      return null;
  }
}

function evaluateHeightLimit(ruleLogic: any, element: any) {
  const elementHeight = element.geometry?.height || element.parameters?.height;
  const maxHeight = ruleLogic.max_height_feet?.[element.parameters?.occupancy_class] || ruleLogic.max_height_feet?.default;
  
  if (elementHeight && maxHeight && elementHeight > maxHeight) {
    return {
      description: `Element height ${elementHeight}ft exceeds maximum allowed ${maxHeight}ft`,
      current_value: { height: elementHeight, unit: 'feet' },
      required_value: { max_height: maxHeight, unit: 'feet' }
    };
  }
  return null;
}

function evaluateAreaLimit(ruleLogic: any, element: any) {
  const elementArea = element.geometry?.area || element.parameters?.area;
  const maxArea = ruleLogic.max_area_per_story?.[element.parameters?.occupancy_class] || ruleLogic.max_area_per_story?.default;
  
  if (elementArea && maxArea && elementArea > maxArea) {
    return {
      description: `Element area ${elementArea} sq ft exceeds maximum allowed ${maxArea} sq ft`,
      current_value: { area: elementArea, unit: 'square_feet' },
      required_value: { max_area: maxArea, unit: 'square_feet' }
    };
  }
  return null;
}

function evaluateEgress(ruleLogic: any, element: any) {
  if (element.element_type === 'door' || element.element_type === 'corridor') {
    const width = element.geometry?.width || element.parameters?.width;
    const minWidth = ruleLogic.min_width_inches || 44;
    
    if (width && width < minWidth) {
      return {
        description: `Egress width ${width} inches is below minimum required ${minWidth} inches`,
        current_value: { width: width, unit: 'inches' },
        required_value: { min_width: minWidth, unit: 'inches' }
      };
    }
  }
  return null;
}

function evaluateFireRating(ruleLogic: any, element: any) {
  // Placeholder for fire rating evaluation
  return null;
}

function determineSeverity(rule: any, violation: any): string {
  // Critical violations for safety-related rules
  if (['egress', 'fire_rating', 'structural'].includes(rule.rule_type)) {
    return 'critical';
  }
  // Major violations for significant code violations
  if (['height_limit', 'area_limit'].includes(rule.rule_type)) {
    return 'major';
  }
  return 'minor';
}

function generateRemediationSuggestions(rule: any, violation: any): string[] {
  const suggestions = [];
  
  switch (rule.rule_type) {
    case 'height_limit':
      suggestions.push('Reduce building height to comply with zoning requirements');
      suggestions.push('Consider applying for height variance if permitted');
      break;
    case 'area_limit':
      suggestions.push('Reduce floor area or add fire separation');
      suggestions.push('Consider sprinkler system for area increase allowance');
      break;
    case 'egress':
      suggestions.push('Increase corridor/door width to meet minimum requirements');
      suggestions.push('Verify accessibility compliance for wider passages');
      break;
  }
  
  return suggestions;
}
