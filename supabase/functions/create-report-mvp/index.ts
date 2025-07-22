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

  // Log the ID you're receiving to make sure it's correct
  console.log(`Fetching profile for reportedUserId: ${reportedUserId}`);

  const { data: profileData, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('user_ip') // Select the id too, for confirmation
  .eq('id', reportedUserId)
  .single();

if (profileError) {
  throw new Error(`Failed to fetch profile. Reason: ${profileError.message}`);
}

// 💡 ADD THIS LOG
// This will print the object fetched from the database to your function's logs.
console.log('Successfully fetched profile data:', profileData);

const reportedUserIp = profileData?.user_ip;
    
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
