// supabase/functions/get-signed-evidence-url/index.ts
// This is a new, secure Edge Function for generating temporary links to private evidence files.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Standard CORS headers to allow your web app to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service_role key to bypass any RLS policies
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
    const { filePath } = await req.json()
    if (!filePath) {
      throw new Error("A 'filePath' is required to generate a signed URL.")
    }

    // Use the admin client to create a signed URL. This has the necessary permissions.
    // The URL will be valid for 5 minutes (300 seconds).
    const { data, error } = await supabaseAdmin.storage
      .from('reported-images')
      .createSignedUrl(filePath, 300) 

    if (error) {
      // If the object is not found even with admin rights, this will throw the specific error.
      throw error
    }

    // Return the secure, temporary URL to the client
    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error("Error in get-signed-evidence-url function:", e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
