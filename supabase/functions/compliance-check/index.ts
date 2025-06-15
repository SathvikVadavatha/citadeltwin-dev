
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRule {
  id: string;
  jurisdiction: string;
  code_section: string;
  rule_type: string;
  title: string;
  description: string;
  rule_logic: any;
}

interface BIMElement {
  id: string;
  name: string;
  element_type: string;
  geometry: any;
  parameters: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { upload_id, check_type = 'manual', user_id } = await req.json();

    console.log(`Starting compliance check for upload ${upload_id}`);

    // Create compliance check record
    const { data: checkRecord, error: checkError } = await supabaseClient
      .from('compliance_checks')
      .insert({
        upload_id,
        check_type,
        user_id,
        status: 'running'
      })
      .select()
      .single();

    if (checkError) {
      throw new Error(`Failed to create check record: ${checkError.message}`);
    }

    // Fetch active compliance rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    // Fetch BIM elements for the upload
    const { data: elements, error: elementsError } = await supabaseClient
      .from('bim_elements')
      .select('*')
      .eq('upload_id', upload_id);

    if (elementsError) {
      throw new Error(`Failed to fetch elements: ${elementsError.message}`);
    }

    console.log(`Found ${rules.length} rules and ${elements.length} elements`);

    const violations = [];
    let rulesChecked = 0;

    // Process each rule against each element
    for (const rule of rules) {
      rulesChecked++;
      
      for (const element of elements) {
        const violation = await checkRuleAgainstElement(rule, element, supabaseClient);
        if (violation) {
          violations.push({
            ...violation,
            upload_id,
            element_id: element.id,
            rule_id: rule.id
          });
        }
      }
    }

    // Insert violations into database
    if (violations.length > 0) {
      const { error: violationsError } = await supabaseClient
        .from('compliance_violations')
        .insert(violations);

      if (violationsError) {
        console.error('Failed to insert violations:', violationsError);
      }
    }

    // Update compliance check record
    await supabaseClient
      .from('compliance_checks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        rules_checked: rulesChecked,
        violations_found: violations.length
      })
      .eq('id', checkRecord.id);

    console.log(`Compliance check completed. Found ${violations.length} violations.`);

    return new Response(
      JSON.stringify({
        success: true,
        check_id: checkRecord.id,
        rules_checked: rulesChecked,
        violations_found: violations.length,
        violations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in compliance-check function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkRuleAgainstElement(rule: ComplianceRule, element: BIMElement, supabaseClient: any) {
  try {
    console.log(`Checking rule ${rule.code_section} against element ${element.name}`);

    switch (rule.rule_type) {
      case 'height_limit':
        return checkHeightLimit(rule, element);
      case 'area_limit':
        return checkAreaLimit(rule, element);
      case 'egress':
        return checkEgressRequirements(rule, element);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error checking rule ${rule.id} against element ${element.id}:`, error);
    return null;
  }
}

function checkHeightLimit(rule: ComplianceRule, element: BIMElement) {
  const { rule_logic } = rule;
  const { parameters, geometry } = element;

  // Extract occupancy type from element parameters (defaulting to 'B' for business)
  const occupancyType = parameters?.occupancy_type || 'B';
  const buildingHeight = geometry?.height || parameters?.height;

  if (!buildingHeight) return null;

  const maxHeightFeet = rule_logic.max_height_feet[occupancyType];
  const maxStories = rule_logic.max_stories[occupancyType];

  if (maxHeightFeet && buildingHeight > maxHeightFeet) {
    return {
      violation_type: 'Height Limit Exceeded',
      severity: 'major',
      description: `Building height of ${buildingHeight} feet exceeds the maximum allowed height of ${maxHeightFeet} feet for occupancy type ${occupancyType}`,
      location: { x: geometry?.x || 0, y: geometry?.y || 0, z: geometry?.z || 0 },
      current_value: { height: buildingHeight, unit: 'feet', occupancy: occupancyType },
      required_value: { max_height: maxHeightFeet, unit: 'feet', occupancy: occupancyType },
      remediation_suggestions: [
        `Reduce building height to ${maxHeightFeet} feet or less`,
        `Consider changing occupancy classification if appropriate`,
        `Implement fire-resistive construction to allow height increases`,
        `Add automatic sprinkler system for height allowances`
      ]
    };
  }

  return null;
}

function checkAreaLimit(rule: ComplianceRule, element: BIMElement) {
  const { rule_logic } = rule;
  const { parameters, geometry } = element;

  const occupancyType = parameters?.occupancy_type || 'B';
  const floorArea = geometry?.area || parameters?.area;

  if (!floorArea) return null;

  const maxAreaPerStory = rule_logic.max_area_per_story[occupancyType];

  if (maxAreaPerStory && floorArea > maxAreaPerStory) {
    return {
      violation_type: 'Floor Area Limit Exceeded',
      severity: 'major',
      description: `Floor area of ${floorArea} sq ft exceeds the maximum allowed area of ${maxAreaPerStory} sq ft for occupancy type ${occupancyType}`,
      location: { x: geometry?.x || 0, y: geometry?.y || 0 },
      current_value: { area: floorArea, unit: 'square_feet', occupancy: occupancyType },
      required_value: { max_area: maxAreaPerStory, unit: 'square_feet', occupancy: occupancyType },
      remediation_suggestions: [
        `Reduce floor area to ${maxAreaPerStory} sq ft or less`,
        `Add fire walls to create separate buildings`,
        `Install automatic sprinkler system for area increases`,
        `Increase street frontage for allowable area increases`
      ]
    };
  }

  return null;
}

function checkEgressRequirements(rule: ComplianceRule, element: BIMElement) {
  const { rule_logic } = rule;
  const { parameters, geometry, element_type } = element;

  // Only check egress-related elements
  if (!['door', 'corridor', 'exit'].includes(element_type)) return null;

  const width = geometry?.width || parameters?.width;
  if (!width) return null;

  const minWidthInches = rule_logic.min_width_inches;
  const widthInches = width * 12; // Convert feet to inches

  if (widthInches < minWidthInches) {
    return {
      violation_type: 'Egress Width Insufficient',
      severity: 'critical',
      description: `Egress width of ${widthInches}" is less than the minimum required width of ${minWidthInches}"`,
      location: { x: geometry?.x || 0, y: geometry?.y || 0 },
      current_value: { width: widthInches, unit: 'inches' },
      required_value: { min_width: minWidthInches, unit: 'inches' },
      remediation_suggestions: [
        `Increase egress width to at least ${minWidthInches} inches`,
        `Remove obstructions from egress path`,
        `Reconfigure egress route if possible`,
        `Consult with AHJ for alternative solutions`
      ]
    };
  }

  return null;
}
