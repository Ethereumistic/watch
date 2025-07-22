import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "update-country" up and running!`);

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim();

    console.log(`Received request for userId: ${userId}`);
    console.log(`Determined userIp: ${userIp}`);

    if (!userId) {
      throw new Error("User ID is required.");
    }

    if (!userIp) {
      throw new Error("Could not determine user IP.");
    }

    // Fetch country from IP API
    const geoResponse = await fetch(`http://ip-api.com/json/${userIp}?fields=country`);
    if (!geoResponse.ok) {
        const errorBody = await geoResponse.text();
        throw new Error(`Failed to fetch geolocation data: ${geoResponse.status} ${errorBody}`);
    }
    const { country } = await geoResponse.json();

    console.log(`Determined country: ${country}`);

    if (!country) {
      throw new Error("Could not determine country from IP.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ country: country, user_ip: userIp, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    return new Response(JSON.stringify({ country }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Function execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});