
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
  Deno.env.get("SUPABASE_ANON_KEY")!
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { userId } = await req.json()

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      throw new Error("Stripe customer not found.")
    }

    const { stripe_customer_id } = profile

    const baseUrl = Deno.env.get("NEXT_PUBLIC_BASE_URL");
    if (!baseUrl || !baseUrl.startsWith('http')) {
      throw new Error("Invalid NEXT_PUBLIC_BASE_URL. It must be a full URL with a scheme (e.g., 'https://' or 'http://').");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${baseUrl}/account`,
    })

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
