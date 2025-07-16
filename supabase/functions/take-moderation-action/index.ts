// supabase/functions/take-moderation-action/index.ts
// This secure Edge Function handles all moderation actions, including auth-level bans using the new calendar system.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportId, targetUserId, actionType, notes, moderatorId, bannedUntilTimestamp } = await req.json()
    if (!reportId || !targetUserId || !actionType || !moderatorId) {
      throw new Error("Missing required fields.")
    }

    let violationLevel = 0;
    let banUntilForAuth: string | null = null; // For auth.users (can be 'infinity')
    let banUntilForProfile: string | null = null; // For profiles (must be a valid timestamp or null)

    // Determine the violation level and ban timestamp based on the action
    switch (actionType) {
      case 'warning':
        violationLevel = 1;
        break;
      
      case 'temp_ban_24h':
        violationLevel = 2;
        const tempBanDate24h = new Date();
        tempBanDate24h.setDate(tempBanDate24h.getDate() + 1);
        banUntilForAuth = tempBanDate24h.toISOString();
        banUntilForProfile = tempBanDate24h.toISOString();
        break;

      case 'temp_ban_custom':
        violationLevel = 2;
        if (!bannedUntilTimestamp) throw new Error("A date is required for a custom ban.");
        const customBanDate = new Date(bannedUntilTimestamp);
        banUntilForAuth = customBanDate.toISOString();
        banUntilForProfile = customBanDate.toISOString();
        break;

      case 'permanent_ban':
        violationLevel = 3;
        // Use the special 'infinity' string for auth.users to enforce a non-expiring ban
        banUntilForAuth = 'infinity'; 
        // For the public profile, we can set a far-future date or null
        const permaBanDate = new Date('9999-12-31T23:59:59Z');
        banUntilForProfile = permaBanDate.toISOString();
        break;
    }

    // --- Step 1: Update Auth User (If a ban is required) ---
    if (banUntilForAuth) {
      const { error: authBanError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        { banned_until: banUntilForAuth }
      );
      if (authBanError) throw new Error(`Failed to ban user in auth: ${authBanError.message}`);
    }

    // --- Step 2: Update Public Profile ---
    if (actionType === 'warning') {
      // For warnings, just increment the count and set violation level
      const { error: rpcError } = await supabaseAdmin.rpc('increment_warnings', { 
        user_id: targetUserId 
      });
      if (rpcError) throw rpcError;
    } else if (violationLevel > 0) {
      // For bans, update the level and the new banned_until timestamp
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          violation_level: violationLevel, 
          banned_until: banUntilForProfile
        })
        .eq('id', targetUserId);
      if (profileUpdateError) throw profileUpdateError;
    }
    
    // --- Step 3: Update Report Status & Log Action ---
    await supabaseAdmin.from('reports').update({ status: 'ACTION_TAKEN' }).eq('id', reportId);
    await supabaseAdmin.from('moderation_actions').insert({
        report_id: reportId,
        moderator_id: moderatorId,
        target_user_id: targetUserId,
        action_type: actionType,
        notes: notes,
      });

    return new Response(JSON.stringify({ success: true, message: `Action '${actionType}' taken successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error("Error in take-moderation-action function:", e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
