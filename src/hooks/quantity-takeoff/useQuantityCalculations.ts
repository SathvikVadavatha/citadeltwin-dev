
import type { QuantityTakeoff } from '@/types/cost-estimation';

export const calculateQuantityFromElement = (element: any, material?: any): number => {
  const geometry = element.geometry || {};
  const elementType = element.element_type;

  switch (elementType) {
    case 'wall':
      const length = geometry.length || 0;
      const height = geometry.height || 0;
      const thickness = geometry.thickness || 0;
      return length * height * thickness; // Volume for concrete walls

    case 'slab':
      const width = geometry.width || 0;
      const slabLength = geometry.length || 0;
      const slabThickness = geometry.thickness || 0;
      return width * slabLength * slabThickness; // Volume

    case 'beam':
      const beamLength = geometry.length || 0;
      const crossSectionArea = geometry.cross_section_area || 0;
      return beamLength * crossSectionArea; // Volume

    case 'column':
      const columnHeight = geometry.height || 0;
      const columnArea = geometry.cross_section_area || 0;
      return columnHeight * columnArea; // Volume

    default:
      return 1; // Default quantity
  }
};

export const getUnitOfMeasureForElement = (elementType: string): string => {
  switch (elementType) {
    case 'wall':
    case 'slab':
    case 'beam':
    case 'column':
      return 'cy'; // Cubic yards for concrete elements
    case 'door':
    case 'window':
      return 'ea'; // Each for individual items
    case 'roof':
      return 'sf'; // Square feet for area
    default:
      return 'ea';
  }
};
