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
    console.log('Fetching Google Maps API key from secrets...');
    
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to Supabase secrets.' 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Successfully retrieved Google Maps API key');
    
    return new Response(
      JSON.stringify({ apiKey: googleMapsApiKey }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-google-maps-key function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve Google Maps API key' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});