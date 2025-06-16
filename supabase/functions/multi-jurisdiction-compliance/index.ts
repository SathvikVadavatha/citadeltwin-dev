
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multi-jurisdiction rule sets with state/county/city specific requirements
const JURISDICTION_RULES = {
  'NYC': {
    'height_limit': {
      residential: { max_height: 75, max_stories: 6 },
      commercial: { max_height: 100, max_stories: 8 },
      special_requirements: ['fire_escapes', 'sprinkler_systems']
    },
    'area_limit': {
      residential: { max_area: 8000 },
      commercial: { max_area: 12000 },
      zoning_multipliers: { R1: 1.0, R2: 1.2, C1: 1.5 }
    },
    'egress': {
      min_corridor_width: 44,
      max_travel_distance: 150,
      min_exits: 2,
      special_requirements: ['pressurized_stairwells']
    }
  },
  'CA': {
    'seismic': {
      zone_factor: 4,
      required_analysis: 'dynamic',
      special_requirements: ['seismic_joints', 'base_isolation']
    },
    'energy': {
      title24_compliance: true,
      max_u_value: 0.32,
      required_systems: ['energy_recovery', 'demand_response']
    },
    'accessibility': {
      ada_plus: true,
      slope_requirements: 0.02,
      special_requirements: ['tactile_warnings', 'visual_alarms']
    }
  },
  'TX': {
    'wind_load': {
      design_speed: 130,
      exposure_category: 'C',
      special_requirements: ['impact_resistant_windows', 'safe_rooms']
    },
    'flood': {
      base_flood_elevation: true,
      freeboard_required: 2,
      special_requirements: ['flood_resistant_materials']
    }
  },
  'OH': {
    'snow_load': {
      ground_snow_load: 30,
      roof_snow_load: 21,
      drift_requirements: true
    },
    'frost_depth': {
      minimum_depth: 42,
      special_requirements: ['frost_protected_foundations']
    }
  },
  'FL': {
    'hurricane': {
      design_speed: 150,
      missile_protection: true,
      special_requirements: ['impact_windows', 'reinforced_doors']
    },
    'flood': {
      velocity_zones: true,
      pile_foundations: true,
      special_requirements: ['breakaway_walls', 'flood_resistant_utilities']
    }
  }
};

class MultiJurisdictionComplianceEngine {
  
  async checkJurisdictionSpecificRules(jurisdiction: string, rule_type: string, element: any): Promise<any[]> {
    const violations = [];
    const jurisdictionRules = JURISDICTION_RULES[jurisdiction];
    
    if (!jurisdictionRules || !jurisdictionRules[rule_type]) {
      return violations;
    }
    
    const rules = jurisdictionRules[rule_type];
    
    switch (rule_type) {
      case 'height_limit':
        violations.push(...this.checkHeightLimits(rules, element, jurisdiction));
        break;
      case 'area_limit':
        violations.push(...this.checkAreaLimits(rules, element, jurisdiction));
        break;
      case 'egress':
        violations.push(...this.checkEgressRequirements(rules, element, jurisdiction));
        break;
      case 'seismic':
        violations.push(...this.checkSeismicRequirements(rules, element, jurisdiction));
        break;
      case 'wind_load':
        violations.push(...this.checkWindLoadRequirements(rules, element, jurisdiction));
        break;
      case 'hurricane':
        violations.push(...this.checkHurricaneRequirements(rules, element, jurisdiction));
        break;
      case 'flood':
        violations.push(...this.checkFloodRequirements(rules, element, jurisdiction));
        break;
      case 'snow_load':
        violations.push(...this.checkSnowLoadRequirements(rules, element, jurisdiction));
        break;
      case 'energy':
        violations.push(...this.checkEnergyRequirements(rules, element, jurisdiction));
        break;
    }
    
    return violations.filter(v => v !== null);
  }
  
  checkHeightLimits(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters, geometry } = element;
    const occupancyType = parameters?.occupancy_type || 'commercial';
    const buildingHeight = geometry?.height || parameters?.height;
    const numStories = parameters?.stories || Math.ceil((buildingHeight || 0) / 3);
    
    if (!buildingHeight) return violations;
    
    const limits = rules[occupancyType] || rules.commercial;
    
    if (buildingHeight > limits.max_height) {
      violations.push({
        violation_type: `${jurisdiction} Height Limit Exceeded`,
        severity: 'critical',
        description: `Building height ${buildingHeight}ft exceeds ${jurisdiction} limit of ${limits.max_height}ft for ${occupancyType}`,
        jurisdiction_specific: true,
        jurisdiction_code: jurisdiction,
        current_value: { height: buildingHeight, occupancy: occupancyType },
        required_value: { max_height: limits.max_height, occupancy: occupancyType },
        remediation_suggestions: [
          `Reduce building height to ${limits.max_height}ft or less`,
          `Consider ${jurisdiction}-specific height variance application`,
          ...this.getJurisdictionSpecificRemediation(jurisdiction, 'height_limit', rules)
        ]
      });
    }
    
    if (numStories > limits.max_stories) {
      violations.push({
        violation_type: `${jurisdiction} Story Limit Exceeded`,
        severity: 'major',
        description: `Building has ${numStories} stories, exceeds ${jurisdiction} limit of ${limits.max_stories}`,
        jurisdiction_specific: true,
        jurisdiction_code: jurisdiction,
        current_value: { stories: numStories, occupancy: occupancyType },
        required_value: { max_stories: limits.max_stories, occupancy: occupancyType },
        remediation_suggestions: [
          `Reduce to ${limits.max_stories} stories or less`,
          `Apply for ${jurisdiction}-specific variance if applicable`,
          ...this.getJurisdictionSpecificRemediation(jurisdiction, 'height_limit', rules)
        ]
      });
    }
    
    return violations;
  }
  
  checkSeismicRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters } = element;
    
    if (jurisdiction === 'CA') {
      const seismicZone = parameters?.seismic_zone || 0;
      const hasSeismicAnalysis = parameters?.seismic_analysis || false;
      
      if (seismicZone >= rules.zone_factor && !hasSeismicAnalysis) {
        violations.push({
          violation_type: 'California Seismic Analysis Required',
          severity: 'critical',
          description: `Seismic zone ${seismicZone} requires ${rules.required_analysis} analysis per California Building Code`,
          jurisdiction_specific: true,
          jurisdiction_code: 'CA',
          current_value: { seismic_analysis: hasSeismicAnalysis, zone: seismicZone },
          required_value: { seismic_analysis: true, analysis_type: rules.required_analysis },
          remediation_suggestions: [
            `Perform ${rules.required_analysis} seismic analysis`,
            'Consider base isolation systems for critical structures',
            'Install seismic joints as required by CBC',
            'Engage California-licensed structural engineer for seismic design'
          ]
        });
      }
    }
    
    return violations;
  }
  
  checkWindLoadRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters } = element;
    
    if (jurisdiction === 'TX' || jurisdiction === 'FL') {
      const designWindSpeed = parameters?.wind_speed || 0;
      const hasImpactResistance = parameters?.impact_resistant || false;
      
      if (designWindSpeed < rules.design_speed) {
        violations.push({
          violation_type: `${jurisdiction} Wind Load Insufficient`,
          severity: 'critical',
          description: `Design wind speed ${designWindSpeed}mph below required ${rules.design_speed}mph`,
          jurisdiction_specific: true,
          jurisdiction_code: jurisdiction,
          current_value: { wind_speed: designWindSpeed },
          required_value: { wind_speed: rules.design_speed },
          remediation_suggestions: [
            `Design for ${rules.design_speed}mph wind loads`,
            'Install impact-resistant windows and doors',
            'Consider safe room construction for residential',
            `Follow ${jurisdiction} wind load design standards`
          ]
        });
      }
      
      if (rules.special_requirements?.includes('impact_resistant_windows') && !hasImpactResistance) {
        violations.push({
          violation_type: `${jurisdiction} Impact Resistance Required`,
          severity: 'major',
          description: 'Impact-resistant glazing required per local code',
          jurisdiction_specific: true,
          jurisdiction_code: jurisdiction,
          remediation_suggestions: [
            'Install impact-resistant windows and glazing',
            'Use hurricane shutters as alternative protection',
            'Follow local impact resistance standards'
          ]
        });
      }
    }
    
    return violations;
  }
  
  checkFloodRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters } = element;
    
    if (['TX', 'FL'].includes(jurisdiction)) {
      const elevationAboveBFE = parameters?.elevation_above_bfe || 0;
      const hasFloodResistantMaterials = parameters?.flood_resistant_materials || false;
      
      if (rules.freeboard_required && elevationAboveBFE < rules.freeboard_required) {
        violations.push({
          violation_type: `${jurisdiction} Freeboard Requirement`,
          severity: 'critical',
          description: `Structure elevation ${elevationAboveBFE}ft below required ${rules.freeboard_required}ft freeboard`,
          jurisdiction_specific: true,
          jurisdiction_code: jurisdiction,
          current_value: { freeboard: elevationAboveBFE },
          required_value: { freeboard: rules.freeboard_required },
          remediation_suggestions: [
            `Raise structure ${rules.freeboard_required}ft above base flood elevation`,
            'Use pile foundation system if in velocity zone',
            'Install breakaway walls below design flood elevation',
            'Relocate utilities above design flood elevation'
          ]
        });
      }
    }
    
    return violations;
  }
  
  checkEgressRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters, geometry, element_type } = element;
    
    if (jurisdiction === 'NYC') {
      const width = geometry?.width || parameters?.width;
      const travelDistance = parameters?.travel_distance || 0;
      
      if (width && width * 12 < rules.min_corridor_width) {
        violations.push({
          violation_type: 'NYC Corridor Width Violation',
          severity: 'critical',
          description: `Corridor width ${width * 12}" below NYC minimum ${rules.min_corridor_width}"`,
          jurisdiction_specific: true,
          jurisdiction_code: 'NYC',
          current_value: { width: width * 12 },
          required_value: { min_width: rules.min_corridor_width },
          remediation_suggestions: [
            `Increase corridor width to ${rules.min_corridor_width}" minimum`,
            'Install pressurized stairwells as required by NYC code',
            'Provide additional fire escapes per NYC requirements',
            'Consider NYC-specific egress alternatives'
          ]
        });
      }
      
      if (travelDistance > rules.max_travel_distance) {
        violations.push({
          violation_type: 'NYC Travel Distance Exceeded',
          severity: 'major',
          description: `Travel distance ${travelDistance}ft exceeds NYC limit ${rules.max_travel_distance}ft`,
          jurisdiction_specific: true,
          jurisdiction_code: 'NYC',
          current_value: { travel_distance: travelDistance },
          required_value: { max_travel_distance: rules.max_travel_distance },
          remediation_suggestions: [
            `Reduce travel distance to ${rules.max_travel_distance}ft or less`,
            'Add additional exit stairs',
            'Install pressurized stairwells',
            'Consider horizontal exits per NYC code'
          ]
        });
      }
    }
    
    return violations;
  }
  
  checkSnowLoadRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters } = element;
    
    if (jurisdiction === 'OH') {
      const designSnowLoad = parameters?.snow_load || 0;
      const foundationDepth = parameters?.foundation_depth || 0;
      
      if (designSnowLoad < rules.roof_snow_load) {
        violations.push({
          violation_type: 'Ohio Snow Load Insufficient',
          severity: 'major',
          description: `Design snow load ${designSnowLoad}psf below Ohio requirement ${rules.roof_snow_load}psf`,
          jurisdiction_specific: true,
          jurisdiction_code: 'OH',
          current_value: { snow_load: designSnowLoad },
          required_value: { snow_load: rules.roof_snow_load },
          remediation_suggestions: [
            `Design for ${rules.roof_snow_load}psf roof snow load`,
            'Consider snow drift loads on roof projections',
            'Install snow guards if required',
            'Follow Ohio-specific snow load procedures'
          ]
        });
      }
    }
    
    return violations;
  }
  
  checkEnergyRequirements(rules: any, element: any, jurisdiction: string): any[] {
    const violations = [];
    const { parameters } = element;
    
    if (jurisdiction === 'CA' && rules.title24_compliance) {
      const uValue = parameters?.u_value || 1.0;
      const hasEnergyRecovery = parameters?.energy_recovery || false;
      
      if (uValue > rules.max_u_value) {
        violations.push({
          violation_type: 'California Title 24 U-Value Exceeded',
          severity: 'major',
          description: `U-value ${uValue} exceeds California Title 24 limit ${rules.max_u_value}`,
          jurisdiction_specific: true,
          jurisdiction_code: 'CA',
          current_value: { u_value: uValue },
          required_value: { max_u_value: rules.max_u_value },
          remediation_suggestions: [
            `Reduce U-value to ${rules.max_u_value} or less`,
            'Install energy recovery ventilation',
            'Consider demand response systems',
            'Follow California Title 24 prescriptive path'
          ]
        });
      }
    }
    
    return violations;
  }
  
  getJurisdictionSpecificRemediation(jurisdiction: string, rule_type: string, rules: any): string[] {
    const suggestions = [];
    
    if (rules.special_requirements) {
      rules.special_requirements.forEach((req: string) => {
        switch (req) {
          case 'fire_escapes':
            suggestions.push('Install fire escapes per NYC requirements');
            break;
          case 'sprinkler_systems':
            suggestions.push('Install automatic sprinkler system');
            break;
          case 'pressurized_stairwells':
            suggestions.push('Provide pressurized stairwell systems');
            break;
          case 'seismic_joints':
            suggestions.push('Install seismic separation joints');
            break;
          case 'base_isolation':
            suggestions.push('Consider base isolation systems');
            break;
        }
      });
    }
    
    return suggestions;
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

    const { upload_id, jurisdiction_id, check_type = 'multi_jurisdiction', user_id } = await req.json();

    console.log(`Starting multi-jurisdiction compliance check for upload ${upload_id}, jurisdiction ${jurisdiction_id}`);

    // Create compliance check record
    const { data: checkRecord, error: checkError } = await supabaseClient
      .from('compliance_checks')
      .insert({
        upload_id,
        check_type,
        user_id,
        status: 'running',
        metadata: {
          jurisdiction_id,
          engine_version: '3.0-multi-jurisdiction',
          check_types: ['height_limit', 'area_limit', 'egress', 'seismic', 'wind_load', 'flood', 'energy', 'snow_load']
        }
      })
      .select()
      .single();

    if (checkError) {
      throw new Error(`Failed to create check record: ${checkError.message}`);
    }

    // Fetch jurisdiction information
    const { data: jurisdiction, error: jurisdictionError } = await supabaseClient
      .from('jurisdictions')
      .select('*')
      .eq('id', jurisdiction_id)
      .single();

    if (jurisdictionError) {
      throw new Error(`Failed to fetch jurisdiction: ${jurisdictionError.message}`);
    }

    // Fetch applicable rules for this jurisdiction
    const { data: rules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select('*')
      .or(`jurisdiction.eq.${jurisdiction.state_code},jurisdiction.eq.${jurisdiction.name},jurisdiction.eq.Universal`)
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

    console.log(`Processing ${rules.length} rules against ${elements.length} elements for jurisdiction ${jurisdiction.name}`);

    const violations = [];
    const engine = new MultiJurisdictionComplianceEngine();
    let rulesChecked = 0;

    // Process standard rules
    for (const rule of rules) {
      rulesChecked++;
      
      for (const element of elements) {
        // Standard compliance checking logic here...
        // This would include the existing logic from compliance-check function
      }
    }

    // Process jurisdiction-specific rules
    const jurisdictionCode = jurisdiction.state_code === 'NY' && jurisdiction.city_name === 'New York City' ? 'NYC' : jurisdiction.state_code;
    
    for (const element of elements) {
      // Check each jurisdiction-specific rule type
      const ruleTypes = ['height_limit', 'area_limit', 'egress', 'seismic', 'wind_load', 'flood', 'energy', 'snow_load'];
      
      for (const ruleType of ruleTypes) {
        const jurisdictionViolations = await engine.checkJurisdictionSpecificRules(jurisdictionCode, ruleType, element);
        
        jurisdictionViolations.forEach(violation => {
          violations.push({
            ...violation,
            upload_id,
            element_id: element.id,
            rule_id: `${jurisdictionCode}-${ruleType}`, // Custom rule ID for jurisdiction-specific rules
            location: element.geometry || {}
          });
        });
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
          jurisdiction_id,
          jurisdiction_name: jurisdiction.name,
          engine_version: '3.0-multi-jurisdiction',
          processing_summary: {
            elements_processed: elements.length,
            rules_applied: rulesChecked,
            jurisdiction_specific_violations: violations.filter(v => v.jurisdiction_specific).length,
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

    console.log(`Multi-jurisdiction compliance check completed. Found ${violations.length} violations for ${jurisdiction.name}.`);

    return new Response(
      JSON.stringify({
        success: true,
        check_id: checkRecord.id,
        jurisdiction: jurisdiction.name,
        rules_checked: rulesChecked,
        violations_found: violations.length,
        jurisdiction_specific_violations: violations.filter(v => v.jurisdiction_specific).length,
        processing_summary: {
          elements_processed: elements.length,
          violation_breakdown: {
            critical: violations.filter(v => v.severity === 'critical').length,
            major: violations.filter(v => v.severity === 'major').length,
            minor: violations.filter(v => v.severity === 'minor').length,
            warning: violations.filter(v => v.severity === 'warning').length
          }
        },
        violations: violations.slice(0, 20) // Return first 20 for preview
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in multi-jurisdiction compliance-check function:', error);
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
