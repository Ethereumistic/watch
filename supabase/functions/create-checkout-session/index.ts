
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@16.2.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient()
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, userId } = await req.json()

    if (!priceId || !userId) {
      throw new Error("Missing required parameters: priceId and userId.");
    }

    // Get user's stripe_customer_id.
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error('Supabase profile query error:', profileError);
      throw profileError;
    }

    // If profile doesn't exist, create it.
    if (!profile) {
      const { data: newUserProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: userId })
        .select('stripe_customer_id')
        .single();
      
      if (createError) {
        console.error('Supabase profile creation error:', createError);
        throw new Error(`Failed to create profile for user ID: ${userId}`);
      }
      profile = newUserProfile;
    }

    let customerId = profile.stripe_customer_id;

    // Create a new Stripe customer if one doesn't exist for the profile.
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
      })
      customerId = customer.id

      // Update the user's profile with the new customer ID
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)
      
      if (updateError) {
        console.error('Supabase profile update error:', updateError);
        throw updateError;
      }
    }

    const vipPriceIds = ["price_1RoOEVPTrUwH1MjB8Ue5ZX5u", "price_1RoOGkPTrUwH1MjBtOhyshjt"];
    const mode = vipPriceIds.includes(priceId) ? "subscription" : "payment";

    const baseUrl = Deno.env.get("NEXT_PUBLIC_BASE_URL");
    if (!baseUrl || !baseUrl.startsWith('http')) {
      throw new Error("Invalid NEXT_PUBLIC_BASE_URL. It must be a full URL with a scheme (e.g., 'https://' or 'http://').");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode, 
      success_url: `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
      metadata: {
        userId,
        priceId
      },
    })

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error('Function Error:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
