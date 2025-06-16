
export const getJurisdictionSpecialRequirements = (stateCode: string, jurisdictionType: string) => {
  const requirements = [];
  
  switch (stateCode) {
    case 'OH':
      requirements.push('Snow Load', 'Frost Depth', 'Energy Efficiency');
      break;
    case 'FL':
      requirements.push('Hurricane Resistance', 'Flood Resistance', 'Termite Protection');
      break;
    case 'TX':
      requirements.push('Wind Load', 'Flood Resistance');
      break;
    case 'CA':
      requirements.push('Seismic', 'Energy (Title 24)');
      break;
    case 'NY':
      if (jurisdictionType === 'city') {
        requirements.push('Fire Escapes', 'Enhanced Egress');
      }
      break;
  }
  
  return requirements;
};

export const formatJurisdictionName = (jurisdiction: any) => {
  if (jurisdiction.jurisdiction_type === 'city') {
    return `${jurisdiction.city_name}, ${jurisdiction.county_name}, ${jurisdiction.state_code}`;
  } else if (jurisdiction.jurisdiction_type === 'county') {
    return `${jurisdiction.county_name} County, ${jurisdiction.state_code}`;
  } else {
    return jurisdiction.name;
  }
};
