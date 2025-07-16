// supabase/functions/get-report-details/index.ts
// This secure Edge Function fetches all data for a single report.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service_role key to bypass RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId } = await req.json()
    if (!reportId) {
      throw new Error("A 'reportId' is required.")
    }

    // Step 1: Fetch the report and join with the public profiles table.
    // FIX: Select 'banned_until' instead of 'banned_for'.
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        created_at,
        status,
        chat_log,
        evidence_url,
        reported_ip,
        reporting_user:profiles!reports_reporting_user_id_fkey(id, username),
        reported_user:profiles!reports_reported_user_id_fkey(id, username, times_reported, violation_level, banned_until)
      `)
      .eq('id', reportId)
      .single();

    if (reportError) {
      throw reportError
    }

    // Step 2: Use the admin auth client to securely fetch user emails from auth.users
    const { data: reportingAuthUser, error: reportingAuthError } = await supabaseAdmin.auth.admin.getUserById(reportData.reporting_user.id);
    if (reportingAuthError) throw new Error(`Could not fetch reporting user's auth data: ${reportingAuthError.message}`);
    
    const { data: reportedAuthUser, error: reportedAuthError } = await supabaseAdmin.auth.admin.getUserById(reportData.reported_user.id);
    if (reportedAuthError) throw new Error(`Could not fetch reported user's auth data: ${reportedAuthError.message}`);

    // Step 3: Combine the data from both queries into a single object
    const finalReport = {
      ...reportData,
      reporting_user: {
        ...reportData.reporting_user,
        email: reportingAuthUser.user.email
      },
      reported_user: {
        ...reportData.reported_user,
        email: reportedAuthUser.user.email
      }
    };

    // Return the complete report object
    return new Response(JSON.stringify(finalReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error("Error in get-report-details function:", e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
