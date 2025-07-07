// BIM-IFC Synchronization Service
// Handles bidirectional sync between IFC elements and BIM database

import { supabase } from '@/integrations/supabase/client';
import { IFCElementMetadata, IFCClassifier } from './ifcClassifier';
import { CreateBIMElementData } from '@/hooks/useBIMElements';

export interface IFCSyncOptions {
  projectId?: string;
  ifcModelId?: string;
  autoCreateElements?: boolean;
  updateExisting?: boolean;
}

export class BIMIFCSync {
  
  static async syncElementFromIFC(
    elementMetadata: IFCElementMetadata,
    options: IFCSyncOptions
  ): Promise<string | null> {
    try {
      const { projectId, ifcModelId } = options;
      
      // Check if element already exists
      const existingElement = await this.findExistingElement(
        elementMetadata.globalId || elementMetadata.expressID.toString(),
        ifcModelId
      );

      if (existingElement && !options.updateExisting) {
        console.log('Element already exists, skipping sync');
        return existingElement.id;
      }

      // Convert IFC metadata to BIM element data
      const bimElementData = this.convertIFCToBIMElement(elementMetadata, {
        projectId,
        ifcModelId
      });

      if (existingElement && options.updateExisting) {
        // Update existing element
        const { data, error } = await supabase
          .from('bim_elements')
          .update(bimElementData)
          .eq('id', existingElement.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating BIM element:', error);
          return null;
        }

        return data.id;
      } else {
        // Create new element
        const { data, error } = await supabase
          .from('bim_elements')
          .insert(bimElementData)
          .select()
          .single();

        if (error) {
          console.error('Error creating BIM element:', error);
          return null;
        }

        return data.id;
      }
    } catch (error) {
      console.error('Error syncing IFC element to BIM:', error);
      return null;
    }
  }

  static async syncMultipleElements(
    elements: IFCElementMetadata[],
    options: IFCSyncOptions
  ): Promise<{ success: string[], failed: string[] }> {
    const results = { success: [], failed: [] };
    
    for (const element of elements) {
      const elementId = await this.syncElementFromIFC(element, options);
      if (elementId) {
        results.success.push(elementId);
      } else {
        results.failed.push(element.globalId || element.expressID.toString());
      }
    }

    return results;
  }

  static async findExistingElement(
    identifier: string,
    ifcModelId?: string
  ): Promise<any | null> {
    try {
      let query = supabase
        .from('bim_elements')
        .select('*');

      if (ifcModelId) {
        query = query.eq('ifc_model_id', ifcModelId);
      }

      // Try to find by IFC GUID first
      let { data } = await query.eq('ifc_element_guid', identifier);
      
      if (!data || data.length === 0) {
        // Try to find by Express ID in IFC properties
        const { data: dataById } = await query.like('ifc_properties', `%"expressID":${identifier}%`);
        data = dataById;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error finding existing element:', error);
      return null;
    }
  }

  private static convertIFCToBIMElement(
    metadata: IFCElementMetadata,
    context: { projectId?: string; ifcModelId?: string }
  ): CreateBIMElementData {
    const { classification, properties } = metadata;
    
    // Generate geometry data from IFC properties
    const geometry = this.extractGeometryFromIFC(metadata);
    
    // Extract parameters
    const parameters = {
      ifcType: metadata.type,
      classification: classification.category,
      subcategory: classification.subcategory,
      materials: classification.materials,
      spatialLocation: classification.spatialLocation,
      ...properties
    };

    return {
      project_id: context.projectId,
      element_type: IFCClassifier.ifcTypeToBIMType(metadata.type) as any,
      name: metadata.name || `${metadata.type} ${metadata.expressID}`,
      description: `Auto-generated from IFC element (Express ID: ${metadata.expressID})`,
      geometry,
      parameters,
      // Store IFC-specific data
      ifc_model_id: context.ifcModelId,
      ifc_element_guid: metadata.globalId,
      ifc_properties: {
        expressID: metadata.expressID,
        type: metadata.type,
        relationships: metadata.relationships,
        originalProperties: metadata.properties
      }
    } as CreateBIMElementData;
  }

  private static extractGeometryFromIFC(metadata: IFCElementMetadata): any {
    const { classification } = metadata;
    const dimensions = classification.dimensions;

    // Default geometry
    let geometry = {
      type: 'box',
      dimensions: { 
        length: dimensions?.length || 1, 
        width: dimensions?.width || 1, 
        height: dimensions?.height || 1 
      },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    };

    // Adjust geometry based on element type
    switch (metadata.type.toUpperCase()) {
      case 'IFCCOLUMN':
        geometry.type = 'cylinder';
        break;
      case 'IFCBEAM':
        geometry.dimensions.height = Math.min(geometry.dimensions.height, 0.5);
        break;
      case 'IFCSLAB':
        geometry.dimensions.height = Math.min(geometry.dimensions.height, 0.3);
        break;
      case 'IFCWALL':
        geometry.dimensions.width = Math.min(geometry.dimensions.width, 0.2);
        break;
    }

    return geometry;
  }

  // Get IFC element from BIM element
  static async getBIMElementIFCData(bimElementId: string): Promise<{
    ifcModelId?: string;
    ifcElementGuid?: string;
    ifcProperties?: any;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('bim_elements')
        .select('ifc_model_id, ifc_element_guid, ifc_properties')
        .eq('id', bimElementId)
        .single();

      if (error) {
        console.error('Error getting BIM element IFC data:', error);
        return null;
      }

      return {
        ifcModelId: data.ifc_model_id,
        ifcElementGuid: data.ifc_element_guid,
        ifcProperties: data.ifc_properties
      };
    } catch (error) {
      console.error('Error getting BIM element IFC data:', error);
      return null;
    }
  }

  // Update BIM element from IFC changes
  static async updateBIMElementFromIFC(
    bimElementId: string,
    updatedMetadata: Partial<IFCElementMetadata>
  ): Promise<boolean> {
    try {
      const updates: any = {};

      if (updatedMetadata.name) {
        updates.name = updatedMetadata.name;
      }

      if (updatedMetadata.properties) {
        updates.ifc_properties = {
          ...updatedMetadata.properties,
          lastUpdated: new Date().toISOString()
        };
      }

      if (updatedMetadata.classification) {
        updates.parameters = {
          ...updatedMetadata.classification,
          lastUpdated: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('bim_elements')
        .update(updates)
        .eq('id', bimElementId);

      if (error) {
        console.error('Error updating BIM element from IFC:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating BIM element from IFC:', error);
      return false;
    }
  }
}