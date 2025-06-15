
import { useState, useEffect } from 'react';
import { ComprehensiveMaterial } from '@/types/materials';
import { ALL_STANDARD_MATERIALS } from '@/data/standardMaterials';
import { useMaterials } from './useMaterials';
import { toast } from 'sonner';

export const useStandardMaterials = () => {
  const [standardMaterials, setStandardMaterials] = useState<ComprehensiveMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const { createMaterial, materials } = useMaterials();

  useEffect(() => {
    // Convert standard materials to full format with IDs and timestamps
    const fullMaterials: ComprehensiveMaterial[] = ALL_STANDARD_MATERIALS.map((material, index) => ({
      ...material,
      id: `standard-${material.category}-${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    setStandardMaterials(fullMaterials);
  }, []);

  const importStandardMaterial = async (standardMaterial: ComprehensiveMaterial) => {
    try {
      setLoading(true);
      
      // Check if material already exists
      const existingMaterial = materials.find(m => 
        m.name === standardMaterial.name && 
        m.material_type === standardMaterial.category
      );
      
      if (existingMaterial) {
        toast.error('Material already exists in your library');
        return false;
      }

      // Convert comprehensive material to database format
      const materialData = {
        name: standardMaterial.name,
        material_type: standardMaterial.category as any,
        properties: {
          category: standardMaterial.category,
          subCategory: standardMaterial.subCategory,
          description: standardMaterial.description,
          structuralProperties: standardMaterial.structuralProperties,
          designValues: standardMaterial.designValues,
          standards: standardMaterial.standards,
          commonUses: standardMaterial.commonUses,
          limitations: standardMaterial.limitations,
          sustainability: standardMaterial.sustainability,
        },
        cost_per_unit: standardMaterial.costPerUnit,
        unit: getDefaultUnit(standardMaterial.category),
        supplier: `Standard (${standardMaterial.standards[0]?.organization || 'Generic'})`
      };

      const result = await createMaterial(materialData);
      if (result) {
        toast.success('Standard material imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing standard material:', error);
      toast.error('Failed to import material');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importAllStandardMaterials = async () => {
    try {
      setLoading(true);
      let imported = 0;
      let skipped = 0;

      for (const material of standardMaterials) {
        const success = await importStandardMaterial(material);
        if (success) {
          imported++;
        } else {
          skipped++;
        }
      }

      toast.success(`Imported ${imported} materials, skipped ${skipped} existing materials`);
    } catch (error) {
      console.error('Error importing all materials:', error);
      toast.error('Failed to import all materials');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultUnit = (category: string): string => {
    switch (category) {
      case 'steel':
      case 'aluminum':
        return 'kg';
      case 'concrete':
        return 'm³';
      case 'wood':
        return 'm³';
      case 'composite':
        return 'kg';
      case 'masonry':
        return 'm²';
      default:
        return 'm³';
    }
  };

  const filterMaterialsByCategory = (category: string) => {
    return standardMaterials.filter(material => material.category === category);
  };

  const searchMaterials = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return standardMaterials.filter(material =>
      material.name.toLowerCase().includes(lowerQuery) ||
      material.description?.toLowerCase().includes(lowerQuery) ||
      material.commonUses.some(use => use.toLowerCase().includes(lowerQuery))
    );
  };

  return {
    standardMaterials,
    loading,
    importStandardMaterial,
    importAllStandardMaterials,
    filterMaterialsByCategory,
    searchMaterials,
  };
};
