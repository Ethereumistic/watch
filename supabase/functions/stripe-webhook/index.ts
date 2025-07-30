
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
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Use service role key for admin access
)

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get("stripe-signature")!

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const { userId, priceId } = session.metadata!

        // Logic to handle the purchase
        if (priceId === "price_1RoOBZPTrUwH1MjBA9nR7P62") {
          // Handle Boost purchase
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("boosts")
            .eq("id", userId)
            .single()

          if (error) throw error

          await supabase
            .from("profiles")
            .update({ boosts: (profile.boosts || 0) + 1 })
            .eq("id", userId)
        } else if (
          priceId === "price_1RoOEVPTrUwH1MjB8Ue5ZX5u" ||
          priceId === "price_1RoOGkPTrUwH1MjBtOhyshjt"
        ) {
          // Handle VIP subscription
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await supabase
            .from("profiles")
            .update({
              role: "vip",
              vip_until: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("id", userId)
        }
        break
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              vip_until: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("id", profile.id)
        }
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({ role: "free", vip_until: null })
            .eq("id", profile.id)
        }
        break
      }
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
