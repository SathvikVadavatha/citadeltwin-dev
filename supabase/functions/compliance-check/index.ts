
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

// Enhanced compliance checking engine
class ComplianceEngine {
  
  // Enhanced height limit checking with occupancy-specific rules
  checkHeightLimit(rule: ComplianceRule, element: BIMElement): any {
    const { rule_logic } = rule;
    const { parameters, geometry } = element;

    const occupancyType = parameters?.occupancy_type || 'B';
    const buildingHeight = geometry?.height || parameters?.height;
    const numStories = parameters?.stories || Math.ceil((buildingHeight || 0) / 3); // Assume 3m per story

    if (!buildingHeight) return null;

    const limits = rule_logic.limits || rule_logic;
    const maxHeightFeet = limits.max_height_feet?.[occupancyType] || limits.max_height_feet?.default;
    const maxStories = limits.max_stories?.[occupancyType] || limits.max_stories?.default;

    let violations = [];

    // Check height violation
    if (maxHeightFeet && buildingHeight > maxHeightFeet) {
      violations.push({
        violation_type: 'Height Limit Exceeded',
        severity: 'major',
        description: `Building height of ${buildingHeight} ft exceeds maximum ${maxHeightFeet} ft for occupancy ${occupancyType}`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0, z: geometry?.z || 0 },
        current_value: { height: buildingHeight, unit: 'feet', occupancy: occupancyType },
        required_value: { max_height: maxHeightFeet, unit: 'feet', occupancy: occupancyType },
        remediation_suggestions: [
          `Reduce building height to ${maxHeightFeet} ft or less`,
          `Consider Type I or Type II construction for increased height allowances`,
          `Install automatic sprinkler system for height increases (IBC Table 504.3)`,
          `Provide fire-resistive construction as per IBC Table 601`
        ]
      });
    }

    // Check story violation
    if (maxStories && numStories > maxStories) {
      violations.push({
        violation_type: 'Story Limit Exceeded',
        severity: 'major',
        description: `Building has ${numStories} stories, exceeds maximum ${maxStories} for occupancy ${occupancyType}`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { stories: numStories, occupancy: occupancyType },
        required_value: { max_stories: maxStories, occupancy: occupancyType },
        remediation_suggestions: [
          `Reduce to ${maxStories} stories or less`,
          `Upgrade construction type for additional story allowances`,
          `Install sprinkler system for story increases`
        ]
      });
    }

    return violations.length > 0 ? violations[0] : null; // Return first violation
  }

  // Enhanced area limit checking
  checkAreaLimit(rule: ComplianceRule, element: BIMElement): any {
    const { rule_logic } = rule;
    const { parameters, geometry } = element;

    const occupancyType = parameters?.occupancy_type || 'B';
    const floorArea = geometry?.area || parameters?.area;
    const hasStairwell = parameters?.stairs || false;
    const hasSprinklers = parameters?.sprinkler_system || false;
    const streetFrontage = parameters?.street_frontage || 0;

    if (!floorArea) return null;

    const limits = rule_logic.limits || rule_logic;
    let maxAreaPerStory = limits.max_area_per_story?.[occupancyType] || limits.max_area_per_story?.default;

    // Apply area increases per IBC 506.3
    if (hasSprinklers) {
      maxAreaPerStory *= (limits.sprinkler_multiplier || 2); // Typically 200% increase
    }
    if (streetFrontage > 0) {
      const frontageIncrease = Math.min(streetFrontage / 30, limits.max_frontage_multiplier || 1.25);
      maxAreaPerStory *= frontageIncrease;
    }

    if (floorArea > maxAreaPerStory) {
      return {
        violation_type: 'Floor Area Limit Exceeded',
        severity: 'major',
        description: `Floor area ${floorArea} sq ft exceeds maximum ${maxAreaPerStory.toFixed(0)} sq ft for occupancy ${occupancyType}`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { 
          area: floorArea, 
          unit: 'square_feet', 
          occupancy: occupancyType,
          sprinklers: hasSprinklers,
          frontage: streetFrontage
        },
        required_value: { 
          max_area: maxAreaPerStory, 
          unit: 'square_feet', 
          occupancy: occupancyType 
        },
        remediation_suggestions: [
          `Reduce floor area to ${maxAreaPerStory.toFixed(0)} sq ft or less`,
          hasSprinklers ? null : `Install automatic sprinkler system for area increase`,
          `Add fire walls to create separate buildings`,
          `Increase street frontage if possible`,
          `Consider mixed occupancy classification`
        ].filter(Boolean)
      };
    }

    return null;
  }

  // Enhanced egress checking
  checkEgressRequirements(rule: ComplianceRule, element: BIMElement): any {
    const { rule_logic } = rule;
    const { parameters, geometry, element_type } = element;

    if (!['door', 'corridor', 'exit', 'stair'].includes(element_type)) return null;

    const width = geometry?.width || parameters?.width;
    const height = geometry?.height || parameters?.height;
    const occupantLoad = parameters?.occupant_load || 50; // Default assumption

    if (!width) return null;

    const widthInches = width * 12; // Convert feet to inches
    const minWidthInches = rule_logic.min_width_inches || 32;
    const requiredWidthForLoad = Math.max(
      minWidthInches,
      (occupantLoad * (rule_logic.width_per_occupant || 0.2)) // 0.2 inches per occupant
    );

    let violations = [];

    // Check minimum width
    if (widthInches < minWidthInches) {
      violations.push({
        violation_type: 'Egress Width Insufficient',
        severity: 'critical',
        description: `${element_type} width ${widthInches}" below minimum ${minWidthInches}"`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { width: widthInches, unit: 'inches' },
        required_value: { min_width: minWidthInches, unit: 'inches' },
        remediation_suggestions: [
          `Increase ${element_type} width to at least ${minWidthInches}"`,
          `Remove obstructions from egress path`,
          `Reconfigure egress layout if possible`
        ]
      });
    }

    // Check occupant load capacity
    if (widthInches < requiredWidthForLoad) {
      violations.push({
        violation_type: 'Egress Capacity Insufficient',
        severity: 'major',
        description: `${element_type} width ${widthInches}" insufficient for occupant load of ${occupantLoad}`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { 
          width: widthInches, 
          occupant_load: occupantLoad,
          unit: 'inches' 
        },
        required_value: { 
          required_width: requiredWidthForLoad, 
          unit: 'inches' 
        },
        remediation_suggestions: [
          `Increase ${element_type} width to ${requiredWidthForLoad}"`,
          `Reduce occupant load through design changes`,
          `Provide additional egress paths`
        ]
      });
    }

    // Check height clearance for doors/corridors
    if (height && height < rule_logic.min_height_feet) {
      violations.push({
        violation_type: 'Egress Height Insufficient',
        severity: 'major',
        description: `${element_type} height ${height}' below minimum ${rule_logic.min_height_feet}'`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { height: height, unit: 'feet' },
        required_value: { min_height: rule_logic.min_height_feet, unit: 'feet' },
        remediation_suggestions: [
          `Increase ${element_type} height to ${rule_logic.min_height_feet}' minimum`,
          `Remove ceiling obstructions`,
          `Reconfigure structural elements`
        ]
      });
    }

    return violations.length > 0 ? violations[0] : null;
  }

  // Fire rating compliance check
  checkFireRating(rule: ComplianceRule, element: BIMElement): any {
    const { rule_logic } = rule;
    const { parameters, element_type } = element;

    const constructionType = parameters?.construction_type || 'V-B';
    const currentRating = parameters?.fire_rating || 0;
    const requiredRating = rule_logic.required_ratings?.[constructionType]?.[element_type] || 0;

    if (currentRating < requiredRating) {
      return {
        violation_type: 'Fire Rating Insufficient',
        severity: 'critical',
        description: `${element_type} fire rating ${currentRating}hr below required ${requiredRating}hr for Type ${constructionType}`,
        location: { element_type, construction_type: constructionType },
        current_value: { fire_rating: currentRating, unit: 'hours' },
        required_value: { fire_rating: requiredRating, unit: 'hours' },
        remediation_suggestions: [
          `Upgrade ${element_type} to ${requiredRating}-hour fire rating`,
          `Use appropriate fire-rated assemblies per IBC Table 601`,
          `Consider construction type change if economical`,
          `Install fire-resistant materials and proper details`
        ]
      };
    }

    return null;
  }

  // Structural compliance check
  checkStructural(rule: ComplianceRule, element: BIMElement): any {
    const { rule_logic } = rule;
    const { parameters, geometry } = element;

    const liveLoad = parameters?.live_load || 0;
    const deadLoad = parameters?.dead_load || 0;
    const allowableStress = parameters?.allowable_stress || Infinity;
    const requiredLiveLoad = rule_logic.min_live_loads?.[parameters?.occupancy_type] || 
                           rule_logic.min_live_loads?.default || 40;

    let violations = [];

    // Check live load requirements
    if (liveLoad < requiredLiveLoad) {
      violations.push({
        violation_type: 'Live Load Insufficient',
        severity: 'critical',
        description: `Live load ${liveLoad} psf below required ${requiredLiveLoad} psf`,
        location: { x: geometry?.x || 0, y: geometry?.y || 0 },
        current_value: { live_load: liveLoad, unit: 'psf' },
        required_value: { min_live_load: requiredLiveLoad, unit: 'psf' },
        remediation_suggestions: [
          `Design for minimum live load of ${requiredLiveLoad} psf`,
          `Review occupancy classification and load requirements`,
          `Strengthen structural elements as needed`
        ]
      });
    }

    return violations.length > 0 ? violations[0] : null;
  }

  // Main compliance checking method
  async checkCompliance(rule: ComplianceRule, element: BIMElement): Promise<any> {
    try {
      console.log(`Checking rule ${rule.code_section} (${rule.rule_type}) against element ${element.name}`);

      switch (rule.rule_type) {
        case 'height_limit':
          return this.checkHeightLimit(rule, element);
        case 'area_limit':
          return this.checkAreaLimit(rule, element);
        case 'egress':
          return this.checkEgressRequirements(rule, element);
        case 'fire_rating':
          return this.checkFireRating(rule, element);
        case 'structural':
          return this.checkStructural(rule, element);
        case 'occupancy':
          // Enhanced occupancy checking could be added here
          return null;
        default:
          console.warn(`Unknown rule type: ${rule.rule_type}`);
          return null;
      }
    } catch (error) {
      console.error(`Error checking rule ${rule.id} against element ${element.id}:`, error);
      return null;
    }
  }
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

    console.log(`Starting enhanced compliance check for upload ${upload_id}`);

    // Create compliance check record
    const { data: checkRecord, error: checkError } = await supabaseClient
      .from('compliance_checks')
      .insert({
        upload_id,
        check_type,
        user_id,
        status: 'running',
        metadata: {
          engine_version: '2.0',
          check_types: ['height_limit', 'area_limit', 'egress', 'fire_rating', 'structural']
        }
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
      .eq('is_active', true)
      .order('rule_type');

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

    console.log(`Processing ${rules.length} rules against ${elements.length} elements`);

    const violations = [];
    const engine = new ComplianceEngine();
    let rulesChecked = 0;

    // Process each rule against applicable elements
    for (const rule of rules) {
      rulesChecked++;
      
      for (const element of elements) {
        const violation = await engine.checkCompliance(rule, element);
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

    // Insert violations into database in batches
    if (violations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < violations.length; i += batchSize) {
        const batch = violations.slice(i, i + batchSize);
        const { error: violationsError } = await supabaseClient
          .from('compliance_violations')
          .insert(batch);

        if (violationsError) {
          console.error('Failed to insert violation batch:', violationsError);
        }
      }
    }

    // Update compliance check record with results
    await supabaseClient
      .from('compliance_checks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        rules_checked: rulesChecked,
        violations_found: violations.length,
        metadata: {
          engine_version: '2.0',
          processing_summary: {
            elements_processed: elements.length,
            rules_applied: rulesChecked,
            violations_by_severity: {
              critical: violations.filter(v => v.severity === 'critical').length,
              major: violations.filter(v => v.severity === 'major').length,
              minor: violations.filter(v => v.severity === 'minor').length,
              warning: violations.filter(v => v.severity === 'warning').length
            }
          }
        }
      })
      .eq('id', checkRecord.id);

    console.log(`Enhanced compliance check completed. Found ${violations.length} violations.`);

    return new Response(
      JSON.stringify({
        success: true,
        check_id: checkRecord.id,
        rules_checked: rulesChecked,
        violations_found: violations.length,
        processing_summary: {
          elements_processed: elements.length,
          violation_breakdown: {
            critical: violations.filter(v => v.severity === 'critical').length,
            major: violations.filter(v => v.severity === 'major').length,
            minor: violations.filter(v => v.severity === 'minor').length,
            warning: violations.filter(v => v.severity === 'warning').length
          }
        },
        violations: violations.slice(0, 10) // Return first 10 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced compliance-check function:', error);
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
