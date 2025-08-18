import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { RoomWithDimensions } from '@/utils/enhancedRoomDetection';

export const useDetectionRooms = (uploadId?: string) => {
  return useOptimizedQuery({
    queryKey: `detection-rooms-${uploadId}`,
    queryFn: async () => {
      if (!uploadId) return [];
      
      const { data, error } = await supabase
        .from('detection_results')
        .select('detected_objects')
        .eq('upload_id', uploadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('No detection results found for upload:', uploadId);
        return [];
      }

      const detectedObjects = data.detected_objects;
      if (!detectedObjects || !Array.isArray(detectedObjects)) {
        return [];
      }

      // Convert detected objects to RoomWithDimensions format
      const rooms: RoomWithDimensions[] = detectedObjects
        .filter((obj: any) => obj.type === 'room' && obj.points && obj.points.length >= 3)
        .map((obj: any, index: number) => {
          const bounds = calculateBounds(obj.points);
          const area = obj.area || calculatePolygonArea(obj.points);
          const perimeter = calculatePolygonPerimeter(obj.points);
          
          return {
            id: index,
            name: obj.label || obj.type || `Room ${index + 1}`,
            type: (obj.label || obj.type || 'room') as RoomWithDimensions['type'],
            points: obj.points,
            confidence: obj.confidence || 0.8,
            bounds,
            dimensions: {
              width: bounds.width,
              length: bounds.height,
              area,
              perimeter,
              units: 'pixels' as const
            },
            realWorldDimensions: {
              width: bounds.width / 10, // Rough conversion
              length: bounds.height / 10,
              area: area / 100,
              units: 'meters' as const
            }
          };
        });

      console.log(`Found ${rooms.length} rooms from detection results`);
      return rooms;
    },
    cacheTime: 300000, // 5 minutes cache
    enabled: !!uploadId
  });
};

function calculatePolygonArea(points: Array<{ x: number; y: number }>): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function calculatePolygonCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

function calculatePolygonPerimeter(points: Array<{ x: number; y: number }>): number {
  if (points.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

function calculateBounds(points: Array<{ x: number; y: number }>): { x: number; y: number; width: number; height: number } {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}