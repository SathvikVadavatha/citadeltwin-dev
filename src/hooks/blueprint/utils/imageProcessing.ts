
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return base64String;
};

export const createAnalysisPrompt = () => {
  return 'Analyze this architectural blueprint and identify structural elements like walls, doors, windows, beams, and columns. Return the results as a structured JSON with element types, positions, and confidence scores.';
};
