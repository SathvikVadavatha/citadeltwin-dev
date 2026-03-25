
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user's JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the token by getting the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { operation, table, data: opData, filters, select, order, limit: opLimit } = await req.json();

    // Allowlist of tables that can be accessed via this function
    const ALLOWED_TABLES = ['cost_estimations', 'cost_line_items', 'cost_databases', 'quantity_takeoffs', 'takeoff_items'];
    if (!operation || !table || !ALLOWED_TABLES.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Invalid operation or table. Allowed tables: ${ALLOWED_TABLES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (operation) {
      case 'select': {
        let query = supabaseClient.from(table).select(select || '*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        if (order) {
          query = query.order(order.column, { ascending: order.ascending ?? true });
        }
        if (opLimit) {
          query = query.limit(opLimit);
        }
        result = await query;
        break;
      }
      case 'insert': {
        result = await supabaseClient.from(table).insert(opData).select();
        break;
      }
      case 'update': {
        let query = supabaseClient.from(table).update(opData);
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        result = await query.select();
        break;
      }
      case 'delete': {
        let query = supabaseClient.from(table).delete();
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        result = await query;
        break;
      }
      case 'aggregate': {
        // Safe aggregate for summing totals
        let query = supabaseClient.from(table).select(select || '*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        result = await query;
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation. Allowed: select, insert, update, delete, aggregate' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (result.error) {
      throw new Error(`Operation failed: ${result.error.message}`);
    }

    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in exec-sql function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An internal error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
