// supabase/functions/create-report-mvp/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportingUserId, reportedUserId, screenshotBase64, chatLog } = await req.json();

    if (!reportingUserId || !reportedUserId || !screenshotBase64) {
      throw new Error("Missing required fields.");
    }

    // FIX: Fetch the reported user's profile to get their IP address
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_ip') // Select only the IP address
      .eq('id', reportedUserId)
      .single();

    if (profileError) {
      console.error(`Could not fetch profile for user ${reportedUserId}:`, profileError);
      // Proceed without IP if profile not found, but log the error
    }
    
    const reportedUserIp = profileData?.user_ip || null;
    
    const caseId = crypto.randomUUID();
    const filePath = `${reportedUserId}/${caseId}.jpeg`; 

    const imageBody = decode(screenshotBase64);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reported-images')
      .upload(filePath, imageBody, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage.from('reported-images').getPublicUrl(filePath);
    // This is incorrect for private buckets. We will store the path.
    const evidencePath = filePath;

    const { error: reportError } = await supabaseAdmin.from('reports').insert({
      id: caseId,
      reporting_user_id: reportingUserId,
      reported_user_id: reportedUserId,
      chat_log: chatLog,
      evidence_url: evidencePath,
      reported_ip: reportedUserIp // Save the fetched IP address
    });

    if (reportError) throw reportError;

    const { error: rpcError } = await supabaseAdmin.rpc('increment_times_reported', { 
      user_id: reportedUserId 
    });

    if (rpcError) throw rpcError;

    return new Response(JSON.stringify({ success: true, caseId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
