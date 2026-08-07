export interface BuildingSubTypeOption {
  value: string;
  label: string;
}

export interface BuildingTypeOption {
  value: string;
  label: string;
  subTypes: BuildingSubTypeOption[];
}

/** Simple, extendable building type/sub-type list. Add new entries here as needed. */
export const BUILDING_TYPES: BuildingTypeOption[] = [
  {
    value: 'residential',
    label: 'Residential',
    subTypes: [
      { value: 'single_family', label: 'Single-family' },
      { value: 'multi_family', label: 'Multi-family' },
      { value: 'adu', label: 'ADU' },
    ],
  },
  {
    value: 'commercial',
    label: 'Commercial',
    subTypes: [
      { value: 'office', label: 'Office' },
      { value: 'retail', label: 'Retail' },
    ],
  },
  {
    value: 'industrial',
    label: 'Industrial',
    subTypes: [
      { value: 'warehouse', label: 'Warehouse' },
    ],
  },
];
