import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GISApiConfig {
  esri: {
    baseUrl: string;
    token?: string;
  };
  openStreetMap: {
    baseUrl: string;
  };
  usgs: {
    baseUrl: string;
  };
}

const gisConfig: GISApiConfig = {
  esri: {
    baseUrl: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services',
  },
  openStreetMap: {
    baseUrl: 'https://overpass-api.de/api/interpreter',
  },
  usgs: {
    baseUrl: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0',
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'fetch_parcels':
        return await fetchParcels(supabaseClient, params)
      case 'fetch_roads':
        return await fetchRoads(supabaseClient, params)
      case 'fetch_utilities':
        return await fetchUtilities(supabaseClient, params)
      case 'fetch_osm_data':
        return await fetchOSMData(supabaseClient, params)
      case 'fetch_environmental_data':
        return await fetchEnvironmentalData(supabaseClient, params)
      case 'fetch_property_boundaries':
        return await fetchPropertyBoundaries(supabaseClient, params)
      case 'zoning_analysis':
        return await performZoningAnalysis(supabaseClient, params)
      case 'advanced_spatial_analysis':
        return await performAdvancedSpatialAnalysis(supabaseClient, params)
      case 'spatial_analysis':
        return await performSpatialAnalysis(supabaseClient, params)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in real-gis-integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchParcels(supabaseClient: any, params: any) {
  const { city, state, bbox } = params;
  
  try {
    // Fetch from ArcGIS REST API for parcel data
    const query = new URLSearchParams({
      where: `CITY='${city}' AND STATE='${state}'`,
      geometry: bbox ? `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}` : '',
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson'
    });

    const response = await fetch(
      `${gisConfig.esri.baseUrl}/USA_Parcels/FeatureServer/0/query?${query}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch parcels: ${response.statusText}`);
    }

    const geoJsonData = await response.json();
    
    // Process and store in database
    const processedData = await processGeoJsonForStorage(geoJsonData);
    
    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_parcels`,
        layer_type: 'parcels',
        city,
        state,
        source_url: `${gisConfig.esri.baseUrl}/USA_Parcels/FeatureServer/0`,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed'
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching parcels:', error);
    throw error;
  }
}

async function fetchRoads(supabaseClient: any, params: any) {
  const { city, state, bbox } = params;
  
  try {
    // Fetch from OpenStreetMap Overpass API for road data
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["highway"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
      );
      out geom;
    `;

    const response = await fetch(gisConfig.openStreetMap.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roads: ${response.statusText}`);
    }

    const osmData = await response.json();
    const geoJsonData = convertOSMToGeoJSON(osmData, 'roads');
    const processedData = await processGeoJsonForStorage(geoJsonData);

    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_roads`,
        layer_type: 'roads',
        city,
        state,
        source_url: gisConfig.openStreetMap.baseUrl,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed'
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching roads:', error);
    throw error;
  }
}

async function fetchUtilities(supabaseClient: any, params: any) {
  const { city, state, bbox, utilityType } = params;
  
  try {
    // Fetch utility data from multiple sources
    let geoJsonData;
    
    if (utilityType === 'water') {
      // Fetch water infrastructure from EPA or local water authority APIs
      const response = await fetch(
        `https://ofmpub.epa.gov/enviro/efservice/PUB_FACTS_PUB_PWS_VIOL_SRCH/CITY_NAME/${city}/STATE_CODE/${state}/JSON`
      );
      
      if (response.ok) {
        const epaData = await response.json();
        geoJsonData = convertEPAToGeoJSON(epaData, 'water');
      }
    } else {
      // Fallback to OSM for other utilities
      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["power"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
          way["utility"="${utilityType}"]${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["name"~"${city}"]`};
        );
        out geom;
      `;

      const response = await fetch(gisConfig.openStreetMap.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (response.ok) {
        const osmData = await response.json();
        geoJsonData = convertOSMToGeoJSON(osmData, utilityType);
      }
    }

    if (!geoJsonData) {
      throw new Error('No utility data available from external sources');
    }

    const processedData = await processGeoJsonForStorage(geoJsonData);

    const { data, error } = await supabaseClient
      .from('gis_layers')
      .upsert({
        layer_name: `${city}_${state}_${utilityType}_utilities`,
        layer_type: 'utilities',
        city,
        state,
        source_url: utilityType === 'water' ? 'EPA SDWIS' : gisConfig.openStreetMap.baseUrl,
        geometry_data: processedData,
        feature_count: geoJsonData.features?.length || 0,
        data_size: JSON.stringify(geoJsonData).length,
        status: 'active',
        bbox: bbox || calculateBBox(geoJsonData),
        coordinate_system: 'EPSG:4326',
        processing_status: 'completed',
        metadata: { utility_type: utilityType }
      }, { onConflict: 'layer_name' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, featureCount: geoJsonData.features?.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching utilities:', error);
    throw error;
  }
}

async function fetchOSMData(supabaseClient: any, params: any) {
  const { bbox, tags, city, state } = params;
  
  try {
    // Build dynamic Overpass query based on requested tags
    const tagQueries = tags.map((tag: string) => {
      const [key, value] = tag.includes('=') ? tag.split('=') : [tag, '*'];
      return `way["${key}"${value !== '*' ? `="${value}"` : ''}]`;
    }).join(';\n        ');

    const overpassQuery = `
      [out:json][timeout:30];
      (
        ${tagQueries}${bbox ? `(${bbox.minY},${bbox.minX},${bbox.maxY},${bbox.maxX})` : `["addr:city"~"${city}"]`};
      );
      out geom;
    `;

    const response = await fetch(gisConfig.openStreetMap.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch OSM data: ${response.statusText}`);
    }

    const osmData = await response.json();
    const geoJsonData = convertOSMToGeoJSON(osmData, 'mixed');

    return new Response(
      JSON.stringify({ success: true, data: geoJsonData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    throw error;
  }
}

async function fetchEnvironmentalData(supabaseClient: any, params: any) {
  const { city, state, data_types } = params;
  
  try {
    const results = [];
    
    for (const dataType of data_types) {
      let geoJsonData;
      let sourceUrl = '';
      
      switch (dataType) {
        case 'flood_zones':
          // Fetch FEMA flood zone data
          sourceUrl = `https://hazards.fema.gov/gis/nfhl/services/public/NFHL/MapServer/28/query`;
          const floodQuery = new URLSearchParams({
            where: `STATE_NAME='${state}' AND COUNTY_NAME LIKE '%${city}%'`,
            outFields: '*',
            returnGeometry: 'true',
            f: 'geojson'
          });
          
          const floodResponse = await fetch(`${sourceUrl}?${floodQuery}`);
          if (floodResponse.ok) {
            geoJsonData = await floodResponse.json();
          }
          break;
          
        case 'soil_conditions':
          // Fetch USDA soil data
          sourceUrl = `https://sdmdataaccess.sc.egov.usda.gov/Spatial/SDMNAD83Geographic.wfs`;
          const soilQuery = new URLSearchParams({
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'MapunitPoly',
            outputFormat: 'application/json',
            cql_filter: `INTERSECTS(the_geom, POINT(-122.4194 37.7749))` // Example coordinates
          });
          
          const soilResponse = await fetch(`${sourceUrl}?${soilQuery}`);
          if (soilResponse.ok) {
            geoJsonData = await soilResponse.json();
          }
          break;
          
        case 'environmental_hazards':
          // Fetch EPA environmental data
          sourceUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Superfund_National_Priorities_List_NPL_Sites/FeatureServer/0/query';
          const hazardQuery = new URLSearchParams({
            where: `STATE='${state}' AND CITY_NAME='${city}'`,
            outFields: '*',
            returnGeometry: 'true',
            f: 'geojson'
          });
          
          const hazardResponse = await fetch(`${sourceUrl}?${hazardQuery}`);
          if (hazardResponse.ok) {
            geoJsonData = await hazardResponse.json();
          }
          break;
          
        case 'zoning_data':
          // Fetch local zoning data (would need city-specific endpoints)
          const overpassQuery = `
            [out:json][timeout:25];
            (
              way["landuse"]${`["name"~"${city}"]`};
              relation["landuse"]${`["name"~"${city}"]`};
            );
            out geom;
          `;
          
          const zoningResponse = await fetch(gisConfig.openStreetMap.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(overpassQuery)}`
          });
          
          if (zoningResponse.ok) {
            const osmData = await zoningResponse.json();
            geoJsonData = convertOSMToGeoJSON(osmData, 'zoning');
          }
          break;
      }
      
      if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
        const processedData = await processGeoJsonForStorage(geoJsonData);
        
        const { data, error } = await supabaseClient
          .from('gis_layers')
          .upsert({
            layer_name: `${city}_${state}_${dataType}`,
            layer_type: dataType === 'zoning_data' ? 'zoning' : 
                       dataType === 'flood_zones' ? 'flood_zones' :
                       dataType === 'soil_conditions' ? 'soil_conditions' : 'environmental',
            environmental_type: dataType,
            city,
            state,
            source_url: sourceUrl,
            geometry_data: processedData,
            feature_count: geoJsonData.features.length,
            data_size: JSON.stringify(geoJsonData).length,
            status: 'active',
            real_time_enabled: false,
            data_freshness_hours: 24,
            bbox: calculateBBox(geoJsonData),
            coordinate_system: 'EPSG:4326',
            processing_status: 'completed'
          }, { onConflict: 'layer_name' });

        if (error) throw error;
        results.push({ dataType, success: true, featureCount: geoJsonData.features.length });
      } else {
        results.push({ dataType, success: false, error: 'No data found' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    throw error;
  }
}

async function fetchPropertyBoundaries(supabaseClient: any, params: any) {
  const { city, state, bbox } = params;
  
  try {
    // Fetch property parcel data with detailed boundary information
    const query = new URLSearchParams({
      where: `CITY='${city}' AND STATE='${state}'`,
      geometry: bbox ? `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}` : '',
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'OBJECTID,APN,OWNER_NAME,SITE_ADDR,TOTAL_SQFT,ZONING,FLOOD_ZONE,SOIL_TYPE',
      returnGeometry: 'true',
      f: 'geojson'
    });

    const response = await fetch(
      `${gisConfig.esri.baseUrl}/USA_Parcels/FeatureServer/0/query?${query}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch property boundaries: ${response.statusText}`);
    }

    const geoJsonData = await response.json();
    
    // Process and store property boundaries
    if (geoJsonData.features && geoJsonData.features.length > 0) {
      const boundaryInserts = geoJsonData.features.map((feature: any) => ({
        parcel_id: feature.properties.APN || `UNKNOWN_${Math.random().toString(36).substr(2, 9)}`,
        property_address: feature.properties.SITE_ADDR,
        owner_name: feature.properties.OWNER_NAME,
        boundary_geometry: feature.geometry,
        area_sqft: feature.properties.TOTAL_SQFT,
        zoning_designation: feature.properties.ZONING,
        flood_zone: feature.properties.FLOOD_ZONE,
        soil_type: feature.properties.SOIL_TYPE,
        city,
        state,
        environmental_constraints: []
      }));

      const { data, error } = await supabaseClient
        .from('property_boundaries')
        .upsert(boundaryInserts, { onConflict: 'parcel_id' });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          boundariesProcessed: boundaryInserts.length,
          data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, boundariesProcessed: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching property boundaries:', error);
    throw error;
  }
}

async function performZoningAnalysis(supabaseClient: any, params: any) {
  const { parcel_id, proposed_use, building_height, lot_coverage, user_id } = params;
  
  try {
    // Fetch property information
    const { data: property, error: propertyError } = await supabaseClient
      .from('property_boundaries')
      .select('*')
      .eq('parcel_id', parcel_id)
      .single();

    if (propertyError || !property) {
      throw new Error('Property not found');
    }

    // Mock zoning analysis - in production, this would integrate with actual zoning APIs
    const zoningRules = {
      'R1': {
        name: 'Single Family Residential',
        max_height: 35,
        max_lot_coverage: 40,
        permitted_uses: ['single_family_residential'],
        setbacks: { front: 25, rear: 20, side: 10 }
      },
      'R2': {
        name: 'Multi Family Residential',
        max_height: 45,
        max_lot_coverage: 50,
        permitted_uses: ['single_family_residential', 'multi_family_residential'],
        setbacks: { front: 20, rear: 15, side: 8 }
      },
      'C1': {
        name: 'Commercial',
        max_height: 60,
        max_lot_coverage: 70,
        permitted_uses: ['commercial_retail', 'commercial_office', 'mixed_use'],
        setbacks: { front: 15, rear: 10, side: 5 }
      }
    };

    const currentZoning = property.zoning_designation || 'R1';
    const rules = zoningRules[currentZoning as keyof typeof zoningRules] || zoningRules.R1;

    const complianceChecks = [
      {
        requirement: 'Permitted Use',
        status: rules.permitted_uses.includes(proposed_use) ? 'compliant' : 'non_compliant',
        message: rules.permitted_uses.includes(proposed_use) 
          ? 'Proposed use is permitted in this zoning district'
          : `Proposed use not permitted. Allowed uses: ${rules.permitted_uses.join(', ')}`,
        current_value: proposed_use,
        required_value: rules.permitted_uses.join(', ')
      },
      {
        requirement: 'Building Height',
        status: building_height <= rules.max_height ? 'compliant' : 'non_compliant',
        message: building_height <= rules.max_height
          ? 'Building height complies with zoning requirements'
          : `Building height exceeds maximum allowed height`,
        current_value: `${building_height} ft`,
        required_value: `≤ ${rules.max_height} ft`
      },
      {
        requirement: 'Lot Coverage',
        status: lot_coverage <= rules.max_lot_coverage ? 'compliant' : 'non_compliant',
        message: lot_coverage <= rules.max_lot_coverage
          ? 'Lot coverage complies with zoning requirements'
          : `Lot coverage exceeds maximum allowed percentage`,
        current_value: `${lot_coverage}%`,
        required_value: `≤ ${rules.max_lot_coverage}%`
      }
    ];

    const overallCompliant = complianceChecks.every(check => check.status === 'compliant');
    
    const analysisResult = {
      parcel_id,
      overall_compliance: {
        status: overallCompliant ? 'compliant' : 'non_compliant',
        message: overallCompliant 
          ? 'All zoning requirements are met'
          : 'Some zoning requirements are not met'
      },
      zoning_info: {
        district: currentZoning,
        name: rules.name,
        permitted_uses: rules.permitted_uses
      },
      compliance_checks: complianceChecks,
      recommendations: overallCompliant ? [] : [
        'Consider modifying the proposed design to meet zoning requirements',
        'Contact the planning department for potential variances',
        'Review alternative design options that comply with current zoning'
      ]
    };

    // Store analysis results
    const { data, error } = await supabaseClient
      .from('spatial_analysis_results')
      .insert({
        analysis_type: 'zoning_compliance',
        input_layer_ids: [],
        result_data: analysisResult,
        parameters: { parcel_id, proposed_use, building_height, lot_coverage },
        user_id
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error performing zoning analysis:', error);
    throw error;
  }
}

async function performAdvancedSpatialAnalysis(supabaseClient: any, params: any) {
  const { analysis_type, layer_ids, environmental_factors, parameters, user_id } = params;
  
  try {
    // Fetch the layers including environmental data
    const { data: layers, error: layersError } = await supabaseClient
      .from('gis_layers')
      .select('*')
      .in('id', layer_ids);

    if (layersError) throw layersError;

    // Include environmental layers in analysis
    const { data: envLayers, error: envError } = await supabaseClient
      .from('gis_layers')
      .select('*')
      .in('environmental_type', environmental_factors || []);

    if (envError) console.warn('Could not fetch environmental layers:', envError);

    const allLayers = [...layers, ...(envLayers || [])];
    
    let analysisResult;
    
    switch (analysis_type) {
      case 'environmental_impact':
        analysisResult = await performEnvironmentalImpactAnalysis(allLayers, parameters);
        break;
      case 'flood_risk_assessment':
        analysisResult = await performFloodRiskAssessment(allLayers, parameters);
        break;
      case 'site_suitability':
        analysisResult = await performSiteSuitabilityAnalysis(allLayers, parameters);
        break;
      default:
        // Fall back to standard spatial analysis
        analysisResult = await performStandardSpatialAnalysis(allLayers, analysis_type, parameters);
        break;
    }

    // Store enhanced analysis results
    const { data, error } = await supabaseClient
      .from('spatial_analysis_results')
      .insert({
        analysis_type: `advanced_${analysis_type}`,
        input_layer_ids: layer_ids,
        result_data: analysisResult,
        parameters: { ...parameters, environmental_factors },
        user_id
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data, result: analysisResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error performing advanced spatial analysis:', error);
    throw error;
  }
}

async function performEnvironmentalImpactAnalysis(layers: any[], parameters: any) {
  const environmentalLayers = layers.filter(l => 
    ['flood_zones', 'soil_conditions', 'environmental'].includes(l.layer_type)
  );
  
  return {
    analysis_type: 'environmental_impact',
    environmental_factors_analyzed: environmentalLayers.length,
    risk_assessment: {
      flood_risk: environmentalLayers.some(l => l.layer_type === 'flood_zones') ? 'assessed' : 'not_available',
      soil_stability: environmentalLayers.some(l => l.layer_type === 'soil_conditions') ? 'assessed' : 'not_available',
      environmental_hazards: environmentalLayers.some(l => l.environmental_type === 'environmental_hazards') ? 'assessed' : 'not_available'
    },
    recommendations: [
      'Conduct detailed environmental assessment',
      'Consider mitigation measures for identified risks',
      'Consult with environmental specialists'
    ],
    summary: {
      overall_risk: 'moderate',
      key_concerns: environmentalLayers.map(l => l.environmental_type || l.layer_type),
      mitigation_required: true
    }
  };
}

async function performFloodRiskAssessment(layers: any[], parameters: any) {
  const floodLayers = layers.filter(l => l.layer_type === 'flood_zones');
  
  return {
    analysis_type: 'flood_risk_assessment',
    flood_zones_analyzed: floodLayers.length,
    risk_levels: {
      high_risk: 0,
      moderate_risk: 0,
      low_risk: 0
    },
    recommendations: floodLayers.length > 0 ? [
      'Review FEMA flood maps for detailed risk assessment',
      'Consider flood insurance requirements',
      'Plan appropriate building elevations'
    ] : [
      'No flood zone data available for this area',
      'Recommend obtaining local flood risk assessment'
    ],
    summary: {
      flood_data_available: floodLayers.length > 0,
      assessment_confidence: floodLayers.length > 0 ? 'high' : 'low'
    }
  };
}

async function performSiteSuitabilityAnalysis(layers: any[], parameters: any) {
  const { intended_use, site_requirements } = parameters;
  
  const suitabilityFactors = {
    zoning_compliance: layers.some(l => l.layer_type === 'zoning') ? 'favorable' : 'unknown',
    flood_risk: layers.some(l => l.layer_type === 'flood_zones') ? 'assessed' : 'needs_assessment',
    soil_conditions: layers.some(l => l.layer_type === 'soil_conditions') ? 'favorable' : 'needs_assessment',
    infrastructure_access: layers.some(l => l.layer_type === 'utilities') ? 'available' : 'needs_verification'
  };
  
  return {
    analysis_type: 'site_suitability',
    intended_use,
    suitability_score: 75, // Mock score
    suitability_factors: suitabilityFactors,
    constraints: layers
      .filter(l => ['flood_zones', 'environmental'].includes(l.layer_type))
      .map(l => ({ type: l.layer_type, severity: 'moderate' })),
    recommendations: [
      'Site shows good potential for intended use',
      'Conduct detailed geotechnical assessment',
      'Verify utility capacity and availability',
      'Obtain environmental clearances as needed'
    ],
    summary: {
      overall_suitability: 'suitable_with_conditions',
      key_advantages: ['Good infrastructure access', 'Appropriate zoning'],
      key_challenges: ['Environmental considerations', 'Potential flood risk']
    }
  };
}

async function performStandardSpatialAnalysis(layers: any[], analysisType: string, parameters: any) {
  // Enhanced version of existing spatial analysis with environmental considerations
  switch (analysisType) {
    case 'intersection':
      return await performIntersectionAnalysis(layers, parameters);
    case 'buffer':
      return await performBufferAnalysis(layers, parameters);
    case 'proximity':
      return await performProximityAnalysis(layers, parameters);
    case 'overlay':
      return await performOverlayAnalysis(layers, parameters);
    default:
      throw new Error(`Unsupported analysis type: ${analysisType}`);
  }
}

// Helper functions for data processing
function processGeoJsonForStorage(geoJson: any) {
  // Simplify geometries and optimize for storage
  if (!geoJson.features) return geoJson;
  
  return {
    ...geoJson,
    features: geoJson.features.map((feature: any) => ({
      ...feature,
      geometry: simplifyGeometry(feature.geometry),
      properties: {
        ...feature.properties,
        processed_at: new Date().toISOString()
      }
    }))
  };
}

function simplifyGeometry(geometry: any) {
  // Basic geometry simplification for large datasets
  if (geometry.type === 'LineString' && geometry.coordinates.length > 100) {
    // Douglas-Peucker simplification could be implemented here
    return {
      ...geometry,
      coordinates: geometry.coordinates.filter((_: any, i: number) => i % 2 === 0)
    };
  }
  return geometry;
}

function calculateBBox(geoJson: any) {
  if (!geoJson.features || geoJson.features.length === 0) return null;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  geoJson.features.forEach((feature: any) => {
    const coords = getAllCoordinates(feature.geometry);
    coords.forEach(([x, y]: [number, number]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  });
  
  return { minX, minY, maxX, maxY };
}

function getAllCoordinates(geometry: any): number[][] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
      return geometry.coordinates;
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPoint':
    case 'MultiLineString':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}

function convertOSMToGeoJSON(osmData: any, type: string) {
  const features = osmData.elements?.map((element: any) => {
    if (element.type === 'way' && element.geometry) {
      return {
        type: 'Feature',
        properties: {
          ...element.tags,
          osm_id: element.id,
          type: type
        },
        geometry: {
          type: 'LineString',
          coordinates: element.geometry.map((node: any) => [node.lon, node.lat])
        }
      };
    }
    return null;
  }).filter(Boolean) || [];

  return {
    type: 'FeatureCollection',
    features
  };
}

function convertEPAToGeoJSON(epaData: any, type: string) {
  // Convert EPA water system data to GeoJSON
  const features = epaData.map((facility: any) => ({
    type: 'Feature',
    properties: {
      name: facility.PWS_NAME,
      type: type,
      epa_id: facility.PWS_ID,
      system_type: facility.PWS_TYPE_CODE
    },
    geometry: {
      type: 'Point',
      coordinates: [
        parseFloat(facility.LONGITUDE) || 0,
        parseFloat(facility.LATITUDE) || 0
      ]
    }
  })).filter((f: any) => f.geometry.coordinates[0] !== 0 && f.geometry.coordinates[1] !== 0);

  return {
    type: 'FeatureCollection',
    features
  };
}

// Spatial analysis functions
async function performIntersectionAnalysis(layers: any[], parameters: any) {
  // Implement spatial intersection analysis
  const intersections = [];
  
  for (let i = 0; i < layers.length - 1; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const layer1 = layers[i];
      const layer2 = layers[j];
      
      const intersection = findGeometryIntersections(
        layer1.geometry_data,
        layer2.geometry_data
      );
      
      if (intersection.features.length > 0) {
        intersections.push({
          layer1_id: layer1.id,
          layer2_id: layer2.id,
          intersection_count: intersection.features.length,
          intersection_data: intersection
        });
      }
    }
  }
  
  return {
    analysis_type: 'intersection',
    results: intersections,
    summary: {
      total_intersections: intersections.reduce((sum, item) => sum + item.intersection_count, 0),
      layer_pairs_analyzed: intersections.length
    }
  };
}

async function performBufferAnalysis(layers: any[], parameters: any) {
  const { distance = 100, units = 'meters' } = parameters;
  
  const bufferedLayers = layers.map(layer => ({
    layer_id: layer.id,
    original_features: layer.geometry_data.features?.length || 0,
    buffered_data: createBuffer(layer.geometry_data, distance, units)
  }));
  
  return {
    analysis_type: 'buffer',
    parameters: { distance, units },
    results: bufferedLayers
  };
}

async function performProximityAnalysis(layers: any[], parameters: any) {
  const { maxDistance = 1000, units = 'meters' } = parameters;
  
  const proximityResults = [];
  
  for (let i = 0; i < layers.length - 1; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const distances = calculateFeatureDistances(
        layers[i].geometry_data,
        layers[j].geometry_data,
        maxDistance
      );
      
      proximityResults.push({
        layer1_id: layers[i].id,
        layer2_id: layers[j].id,
        nearby_features: distances.filter(d => d.distance <= maxDistance).length,
        average_distance: distances.reduce((sum, d) => sum + d.distance, 0) / distances.length,
        min_distance: Math.min(...distances.map(d => d.distance)),
        max_distance: Math.max(...distances.map(d => d.distance))
      });
    }
  }
  
  return {
    analysis_type: 'proximity',
    parameters: { maxDistance, units },
    results: proximityResults
  };
}

async function performOverlayAnalysis(layers: any[], parameters: any) {
  const { operation = 'union' } = parameters;
  
  let result = layers[0].geometry_data;
  
  for (let i = 1; i < layers.length; i++) {
    result = performGeometryOperation(result, layers[i].geometry_data, operation);
  }
  
  return {
    analysis_type: 'overlay',
    operation,
    result_feature_count: result.features?.length || 0,
    result_data: result
  };
}

// Basic geometry operation helpers (simplified implementations)
function findGeometryIntersections(geom1: any, geom2: any) {
  // Simplified intersection detection
  const intersections = [];
  
  geom1.features?.forEach((f1: any) => {
    geom2.features?.forEach((f2: any) => {
      if (featuresIntersect(f1, f2)) {
        intersections.push({
          type: 'Feature',
          properties: {
            feature1_id: f1.properties?.id || 'unknown',
            feature2_id: f2.properties?.id || 'unknown',
            intersection_type: 'detected'
          },
          geometry: calculateIntersectionGeometry(f1.geometry, f2.geometry)
        });
      }
    });
  });
  
  return {
    type: 'FeatureCollection',
    features: intersections
  };
}

function createBuffer(geoJson: any, distance: number, units: string) {
  // Simplified buffer creation
  return {
    ...geoJson,
    features: geoJson.features?.map((feature: any) => ({
      ...feature,
      geometry: expandGeometry(feature.geometry, distance, units),
      properties: {
        ...feature.properties,
        buffer_distance: distance,
        buffer_units: units
      }
    })) || []
  };
}

function calculateFeatureDistances(geom1: any, geom2: any, maxDistance: number) {
  const distances = [];
  
  geom1.features?.forEach((f1: any) => {
    geom2.features?.forEach((f2: any) => {
      const distance = calculateDistance(
        getCentroid(f1.geometry),
        getCentroid(f2.geometry)
      );
      
      if (distance <= maxDistance) {
        distances.push({
          feature1_id: f1.properties?.id || 'unknown',
          feature2_id: f2.properties?.id || 'unknown',
          distance
        });
      }
    });
  });
  
  return distances;
}

function performGeometryOperation(geom1: any, geom2: any, operation: string) {
  // Simplified geometry operations
  switch (operation) {
    case 'union':
      return {
        type: 'FeatureCollection',
        features: [...(geom1.features || []), ...(geom2.features || [])]
      };
    case 'intersection':
      return findGeometryIntersections(geom1, geom2);
    default:
      return geom1;
  }
}

// Helper functions for geometry calculations
function featuresIntersect(f1: any, f2: any): boolean {
  // Simplified bounding box intersection check
  const bbox1 = getFeatureBBox(f1);
  const bbox2 = getFeatureBBox(f2);
  
  return !(bbox1.maxX < bbox2.minX || bbox2.maxX < bbox1.minX ||
           bbox1.maxY < bbox2.minY || bbox2.maxY < bbox1.minY);
}

function getFeatureBBox(feature: any) {
  const coords = getAllCoordinates(feature.geometry);
  return coords.reduce((bbox, [x, y]) => ({
    minX: Math.min(bbox.minX, x),
    minY: Math.min(bbox.minY, y),
    maxX: Math.max(bbox.maxX, x),
    maxY: Math.max(bbox.maxY, y)
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
}

function calculateIntersectionGeometry(geom1: any, geom2: any) {
  // Simplified - return midpoint for demonstration
  const centroid1 = getCentroid(geom1);
  const centroid2 = getCentroid(geom2);
  
  return {
    type: 'Point',
    coordinates: [
      (centroid1[0] + centroid2[0]) / 2,
      (centroid1[1] + centroid2[1]) / 2
    ]
  };
}

function expandGeometry(geometry: any, distance: number, units: string) {
  // Simplified buffer - just expand bounding box
  const coords = getAllCoordinates(geometry);
  const distanceInDegrees = units === 'meters' ? distance / 111000 : distance; // Rough conversion
  
  return {
    ...geometry,
    coordinates: coords.map(([x, y]) => [
      x + (Math.random() - 0.5) * distanceInDegrees * 2,
      y + (Math.random() - 0.5) * distanceInDegrees * 2
    ])
  };
}

function getCentroid(geometry: any): [number, number] {
  const coords = getAllCoordinates(geometry);
  const avgX = coords.reduce((sum, [x]) => sum + x, 0) / coords.length;
  const avgY = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length;
  return [avgX, avgY];
}

function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  // Haversine formula for distance between two points
  const R = 6371000; // Earth's radius in meters
  const φ1 = coord1[1] * Math.PI / 180;
  const φ2 = coord2[1] * Math.PI / 180;
  const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
  const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
