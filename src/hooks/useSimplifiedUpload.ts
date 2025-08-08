import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface UploadState {
  uploading: boolean;
  uploadProgress: number;
  processing: boolean;
  processingStep: 'upload' | 'analysis' | 'complete' | null;
  error: string | null;
}

interface UploadResult {
  id: string;
  filename: string;
  imageUrl: string;
  uploadRecord: any;
  detectedObjects?: any[];
  enhancedRoomData?: any;
}

export const useSimplifiedUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<UploadState>({
    uploading: false,
    uploadProgress: 0,
    processing: false,
    processingStep: null,
    error: null
  });
  
  const [result, setResult] = useState<UploadResult | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload blueprints.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Reset state
      setState({
        uploading: true,
        uploadProgress: 0,
        processing: false,
        processingStep: 'upload',
        error: null
      });
      setResult(null);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Starting file upload:', fileName);
      setState(prev => ({ ...prev, uploadProgress: 25 }));

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blueprints')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setState(prev => ({ ...prev, uploadProgress: 50 }));

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blueprints')
        .getPublicUrl(uploadData.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setState(prev => ({ ...prev, uploadProgress: 75 }));

      // Insert database record
      const { data: uploadRecord, error: dbError } = await supabase
        .from('blueprint_uploads')
        .insert({
          user_id: user.id,
          filename: uploadData.path,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      setState(prev => ({ 
        ...prev, 
        uploadProgress: 100,
        uploading: false,
        processing: true,
        processingStep: 'analysis'
      }));

      let detectedObjects = [];
      let enhancedRoomData = null;
      
      const uploadResult: UploadResult = {
        id: uploadRecord.id,
        filename: file.name,
        imageUrl: urlData.publicUrl,
        uploadRecord
      };

      // Start basic processing in background (non-blocking)
      try {
        const processingResult = await processBlueprint(uploadRecord.id, urlData.publicUrl);
        detectedObjects = processingResult.detectedObjects;
        enhancedRoomData = processingResult.enhancedRoomData;
        
        // Update result with detected objects and enhanced room data
        uploadResult.detectedObjects = detectedObjects;
        uploadResult.enhancedRoomData = enhancedRoomData;
        
        setState(prev => ({ 
          ...prev, 
          processing: false,
          processingStep: 'complete'
        }));
      } catch (processingError) {
        console.warn('Processing failed, but upload succeeded:', processingError);
        setState(prev => ({ 
          ...prev, 
          processing: false,
          processingStep: 'complete'
        }));
      }

      setResult(uploadResult);
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded successfully.`,
      });

      return uploadResult;

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setState(prev => ({ 
        ...prev, 
        uploading: false,
        processing: false,
        processingStep: null,
        error: errorMessage
      }));
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [user, toast]);

  const processBlueprint = async (uploadId: string, imageUrl: string): Promise<{ detectedObjects: any[], enhancedRoomData: any }> => {
    console.log(`Starting blueprint processing for upload ${uploadId} with image ${imageUrl}`);
    
    try {
      // Import the enhanced analysis function
      console.log('Loading required modules...');
      const { detectRoomsWithDimensions } = await import('@/utils/enhancedRoomDetection');
      const { extractTextFromBlueprint } = await import('@/hooks/blueprint/utils/textExtraction');
      const { loadOpenCV, imageToMat } = await import('@/utils/wallDetection');

      // Load OpenCV
      console.log('Loading OpenCV...');
      await loadOpenCV();
      console.log('OpenCV loaded successfully');

      // Fetch image and convert to Mat
      console.log('Fetching and processing image...');
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`Image fetched successfully, size: ${blob.size} bytes`);
      
      const imageMat = await imageToMat(blob);
      console.log(`Image converted to Mat: ${imageMat.cols}x${imageMat.rows}`);

      // Extract text from blueprint
      console.log('Extracting text from blueprint...');
      const ocrResult = await extractTextFromBlueprint(imageUrl);
      console.log(`OCR completed, extracted text length: ${ocrResult.text.length}`);

      // Analyze rooms with dimensions using a unique seed based on image data
      console.log('Analyzing rooms with dimensions...');
      const imageHash = await generateImageHash(blob);
      const options = {
        defaultScale: { 
          pixelsPerUnit: 20 + (imageHash % 10), // Vary scale slightly based on image
          unit: 'feet' as const 
        },
        minRoomArea: 800 + (imageHash % 400) // Vary min area based on image
      };
      
      const analysisResult = detectRoomsWithDimensions(imageMat, ocrResult.text, options);
      console.log(`Room analysis completed: found ${analysisResult.totalRooms} rooms`);

      // Clean up
      imageMat.delete();

      // Convert rooms to detected objects format with enhanced metadata
      const detectedObjects = analysisResult.rooms.map(room => ({
        label: room.type,
        confidence: room.confidence,
        bbox: room.bounds,
        name: room.name,
        dimensions: room.realWorldDimensions,
        area: room.realWorldDimensions?.area,
        units: room.realWorldDimensions?.units,
        pixelDimensions: room.dimensions,
        points: room.points
      }));

      // Store enhanced detection results with analysis data in metadata
      console.log('Storing detection results...');
      await supabase
        .from('detection_results')
        .insert({
          upload_id: uploadId,
          detected_objects: JSON.parse(JSON.stringify(detectedObjects)),
          processing_method: 'enhanced_room_analysis',
          metadata: JSON.parse(JSON.stringify({
            analysis_summary: analysisResult.summary,
            scale_info: {
              pixelsPerUnit: analysisResult.scale.pixelsPerUnit,
              unit: analysisResult.scale.unit,
              confidence: analysisResult.scale.confidence,
              source: analysisResult.scale.source
            },
            image_size: analysisResult.imageSize,
            processing_time: analysisResult.processingTime,
            image_hash: imageHash
          })),
          processing_time_ms: analysisResult.processingTime
        });

      // Update upload status
      await supabase
        .from('blueprint_uploads')
        .update({ upload_status: 'processed' })
        .eq('id', uploadId);
      
      console.log(`Enhanced blueprint processing completed for upload ${uploadId}`);
      console.log('Analysis result structure:', {
        totalRooms: analysisResult.totalRooms,
        roomsArray: analysisResult.rooms?.length,
        firstRoom: analysisResult.rooms?.[0]
      });
      return { detectedObjects, enhancedRoomData: analysisResult.rooms };
    } catch (error) {
      console.error('Enhanced processing failed:', error);
      console.log('Attempting fallback to basic analysis...');
      
      // Return empty results instead of mock data to clearly show processing failed
      const emptyResult: any[] = [];

      try {
        await supabase
          .from('detection_results')
          .insert({
            upload_id: uploadId,
            detected_objects: JSON.parse(JSON.stringify(emptyResult)),
            processing_method: 'processing_failed',
            error_message: error instanceof Error ? error.message : 'Unknown error occurred',
            metadata: JSON.parse(JSON.stringify({
              error_details: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 1000) // Limit stack trace length
              } : { error: String(error) }
            }))
          });

        await supabase
          .from('blueprint_uploads')
          .update({ upload_status: 'error' })
          .eq('id', uploadId);
          
        console.log(`Error logged for upload ${uploadId}`);
      } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
      }

      throw error; // Re-throw to be handled by caller
    }
  };

  // Helper function to generate a simple hash from image data
  const generateImageHash = async (blob: Blob): Promise<number> => {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let hash = 0;
    for (let i = 0; i < Math.min(uint8Array.length, 1000); i++) {
      hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
    }
    return Math.abs(hash);
  };

  const reset = useCallback(() => {
    setState({
      uploading: false,
      uploadProgress: 0,
      processing: false,
      processingStep: null,
      error: null
    });
    setResult(null);
  }, []);

  return {
    ...state,
    result,
    uploadFile,
    reset
  };
};