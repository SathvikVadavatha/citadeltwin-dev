import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  frequency: string;
  delivery_format: string;
  recipients: string[];
  filters: Record<string, any>;
  schedule_config: {
    hour: number;
    minute: number;
    day_of_week?: number;
    day_of_month?: number;
    timezone: string;
  };
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Report scheduler started at:', new Date().toISOString());

    // Get all scheduled reports that are due to run
    const now = new Date();
    const { data: dueReports, error: fetchError } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now.toISOString());

    if (fetchError) {
      console.error('Error fetching due reports:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueReports?.length || 0} reports due for execution`);

    const results = [];

    for (const report of dueReports || []) {
      try {
        console.log(`Processing report: ${report.name} (${report.id})`);

        // Create a delivery record
        const { data: delivery, error: deliveryError } = await supabase
          .from('scheduled_report_deliveries')
          .insert([{
            scheduled_report_id: report.id,
            status: 'pending'
          }])
          .select()
          .single();

        if (deliveryError) {
          console.error('Error creating delivery record:', deliveryError);
          continue;
        }

        // Update delivery status to generating
        await supabase
          .from('scheduled_report_deliveries')
          .update({ status: 'generating' })
          .eq('id', delivery.id);

        // Call the report generation function
        const { data: generationResult, error: generationError } = await supabase.functions.invoke(
          'send-scheduled-report',
          {
            body: {
              reportId: report.id,
              deliveryId: delivery.id
            }
          }
        );

        if (generationError) {
          console.error('Error generating report:', generationError);
          
          // Update delivery status to failed
          await supabase
            .from('scheduled_report_deliveries')
            .update({ 
              status: 'failed',
              error_message: generationError.message || 'Unknown error occurred'
            })
            .eq('id', delivery.id);
        } else {
          console.log('Report generation initiated successfully:', generationResult);
        }

        results.push({
          reportId: report.id,
          reportName: report.name,
          deliveryId: delivery.id,
          status: generationError ? 'failed' : 'initiated'
        });

      } catch (error) {
        console.error(`Error processing report ${report.id}:`, error);
        results.push({
          reportId: report.id,
          reportName: report.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('Report scheduler completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processedReports: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in report-scheduler function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});