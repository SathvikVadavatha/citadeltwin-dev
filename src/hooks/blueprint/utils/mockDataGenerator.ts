
interface DetectedObject {
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const generateMockDetectionResults = (): DetectedObject[] => {
  return [
    {
      label: 'wall',
      confidence: 0.85,
      bbox: { x: 10, y: 20, width: 100, height: 5 }
    },
    {
      label: 'door',
      confidence: 0.92,
      bbox: { x: 50, y: 20, width: 8, height: 20 }
    },
    {
      label: 'window',
      confidence: 0.78,
      bbox: { x: 80, y: 22, width: 12, height: 8 }
    }
  ];
};
