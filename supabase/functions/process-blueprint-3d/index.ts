import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Blueprint 3D processing started');

    // Get the form data with the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // TODO: Replace this URL with your deployed Python backend endpoint
    // For now, this is a placeholder that should be replaced with the actual Python service URL
    const PYTHON_BACKEND_URL = Deno.env.get('PYTHON_BACKEND_URL') || 'https://your-python-backend.com/api/process';

    // Create a new FormData to forward to the Python backend
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    // Call the Python backend
    console.log('Calling Python backend...');
    const response = await fetch(PYTHON_BACKEND_URL, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python backend error:', errorText);
      throw new Error(`Python backend failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Python backend response received');

    // Return the result
    return new Response(
      JSON.stringify({
        status: 'success',
        ...result,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error processing blueprint:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
