// IFC Element Classification Service
// Classifies IFC elements into BIM categories and extracts metadata

export interface IFCElementClassification {
  category: 'structural' | 'architectural' | 'mep' | 'site' | 'other';
  subcategory: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
  };
  materials?: string[];
  spatialLocation?: {
    building?: string;
    storey?: string;
    space?: string;
  };
}

export interface IFCElementMetadata {
  expressID: number;
  globalId?: string;
  name?: string;
  type: string;
  classification: IFCElementClassification;
  properties: Record<string, any>;
  relationships: {
    containedIn?: string[];
    contains?: string[];
    connectedTo?: string[];
  };
}

export class IFCClassifier {
  private static STRUCTURAL_TYPES = [
    'IFCBEAM', 'IFCCOLUMN', 'IFCSLAB', 'IFCWALL', 'IFCROOF',
    'IFCFOUNDATION', 'IFCFOOTING', 'IFCPILE', 'IFCSTAIR',
    'IFCRAILING', 'IFCREINFORCINGBAR', 'IFCREINFORCINGMESH'
  ];

  private static ARCHITECTURAL_TYPES = [
    'IFCDOOR', 'IFCWINDOW', 'IFCCURTAINWALL', 'IFCCOVERING',
    'IFCFURNISHINGELEMENT', 'IFCSPACE', 'IFCOPENINGELEMENT'
  ];

  private static MEP_TYPES = [
    'IFCPIPE', 'IFCDUCT', 'IFCCABLESEGMENT', 'IFCFLOWTERMINAL',
    'IFCFLOWFITTING', 'IFCFLOWSEGMENT', 'IFCDISTRIBUTIONELEMENT',
    'IFCENERGYCONVERSIONDEVICE', 'IFCFLOWCONTROLLER',
    'IFCFLOWMOVINGDEVICE', 'IFCFLOWSTORAGEDEVICE',
    'IFCFLOWTREATINGDEVICE'
  ];

  private static SITE_TYPES = [
    'IFCSITE', 'IFCBUILDING', 'IFCBUILDINGSTOREY',
    'IFCBUILDINGHELEMENT', 'IFCGEOGRAPHICELEMENT'
  ];

  static classifyElement(ifcType: string, properties: any): IFCElementClassification {
    const normalizedType = ifcType.toUpperCase();
    
    let category: IFCElementClassification['category'] = 'other';
    let subcategory = ifcType;

    if (this.STRUCTURAL_TYPES.includes(normalizedType)) {
      category = 'structural';
    } else if (this.ARCHITECTURAL_TYPES.includes(normalizedType)) {
      category = 'architectural';
    } else if (this.MEP_TYPES.includes(normalizedType)) {
      category = 'mep';
    } else if (this.SITE_TYPES.includes(normalizedType)) {
      category = 'site';
    }

    return {
      category,
      subcategory: normalizedType,
      dimensions: this.extractDimensions(properties),
      materials: this.extractMaterials(properties),
      spatialLocation: this.extractSpatialLocation(properties)
    };
  }

  static extractMetadata(
    expressID: number,
    properties: any,
    viewer: any,
    modelID: number
  ): Promise<IFCElementMetadata> {
    return new Promise(async (resolve) => {
      try {
        const ifcType = properties.type || 'UNKNOWN';
        const classification = this.classifyElement(ifcType, properties);
        
        // Extract relationships
        const relationships = await this.extractRelationships(viewer, modelID, expressID);

        const metadata: IFCElementMetadata = {
          expressID,
          globalId: properties.GlobalId?.value,
          name: properties.Name?.value || `${ifcType} ${expressID}`,
          type: ifcType,
          classification,
          properties: this.flattenProperties(properties),
          relationships
        };

        resolve(metadata);
      } catch (error) {
        console.error('Error extracting IFC metadata:', error);
        resolve({
          expressID,
          type: 'UNKNOWN',
          classification: { category: 'other', subcategory: 'UNKNOWN' },
          properties: {},
          relationships: {}
        });
      }
    });
  }

  private static extractDimensions(properties: any): IFCElementClassification['dimensions'] {
    const dimensions: any = {};
    
    // Try to extract from various property sources
    if (properties.Dimensions) {
      dimensions.length = properties.Dimensions.Length?.value;
      dimensions.width = properties.Dimensions.Width?.value;
      dimensions.height = properties.Dimensions.Height?.value;
    }

    // Try quantity takeoff properties
    if (properties.QuantityTakeOff) {
      const qto = properties.QuantityTakeOff;
      dimensions.length = qto.Length?.value || qto.NominalLength?.value;
      dimensions.width = qto.Width?.value || qto.NominalWidth?.value;
      dimensions.height = qto.Height?.value || qto.NominalHeight?.value;
    }

    return Object.keys(dimensions).length > 0 ? dimensions : undefined;
  }

  private static extractMaterials(properties: any): string[] {
    const materials: string[] = [];
    
    if (properties.Material?.value) {
      materials.push(properties.Material.value);
    }
    
    if (properties.Materials) {
      const matList = Array.isArray(properties.Materials) ? properties.Materials : [properties.Materials];
      matList.forEach(mat => {
        if (mat?.Name?.value) {
          materials.push(mat.Name.value);
        }
      });
    }

    return materials.length > 0 ? materials : undefined;
  }

  private static extractSpatialLocation(properties: any): IFCElementClassification['spatialLocation'] {
    return {
      building: properties.Building?.Name?.value,
      storey: properties.Storey?.Name?.value || properties.BuildingStorey?.Name?.value,
      space: properties.Space?.Name?.value
    };
  }

  private static async extractRelationships(viewer: any, modelID: number, expressID: number) {
    const relationships = {
      containedIn: [],
      contains: [],
      connectedTo: []
    };

    try {
      // This would need to be implemented based on IFC.js relationship parsing capabilities
      // For now, return empty relationships
      return relationships;
    } catch (error) {
      console.warn('Could not extract relationships:', error);
      return relationships;
    }
  }

  private static flattenProperties(properties: any): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    const flatten = (obj: any, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && value.value !== undefined) {
            flattened[newKey] = value.value;
          } else if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, newKey);
          } else {
            flattened[newKey] = value;
          }
        }
      }
    };

    flatten(properties);
    return flattened;
  }

  // Convert IFC element type to BIM element type
  static ifcTypeToBIMType(ifcType: string): string {
    const typeMap: Record<string, string> = {
      'IFCWALL': 'wall',
      'IFCBEAM': 'beam',
      'IFCCOLUMN': 'column',
      'IFCSLAB': 'slab',
      'IFCDOOR': 'door',
      'IFCWINDOW': 'window',
      'IFCROOF': 'roof',
      'IFCFOUNDATION': 'foundation',
      'IFCSTAIR': 'stair',
      'IFCRAILING': 'railing',
      'IFCPIPE': 'plumbing',
      'IFCDUCT': 'mechanical',
      'IFCCABLESEGMENT': 'electrical'
    };

    const normalized = ifcType.toUpperCase();
    return typeMap[normalized] || 'structural';
  }
}