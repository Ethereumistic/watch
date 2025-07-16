// supabase/functions/dismiss-report/index.ts
// This new, secure Edge Function handles the deletion of a report and its evidence.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Standard CORS headers
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId, evidencePath } = await req.json()
    if (!reportId || !evidencePath) {
      throw new Error("Both 'reportId' and 'evidencePath' are required.")
    }

    // Step 1: Delete the evidence image from storage.
    // We wrap this in a try/catch in case the file was already deleted.
    try {
      const { error: storageError } = await supabaseAdmin.storage
        .from('reported-images')
        .remove([evidencePath])
      
      if (storageError) {
        // Log the error but don't stop the process, as the report itself is more important to delete.
        console.warn(`Could not delete storage object '${evidencePath}':`, storageError.message)
      }
    } catch (e) {
      console.warn(`An error occurred during storage deletion:`, e.message)
    }


    // Step 2: Delete the report record from the database.
    const { error: dbError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (dbError) {
      // If this fails, it's a more serious issue.
      throw dbError
    }

    // Return a success message
    return new Response(JSON.stringify({ success: true, message: `Report ${reportId} dismissed.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error("Error in dismiss-report function:", e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
