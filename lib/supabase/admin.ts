import { createClient } from '@supabase/supabase-js'

// Note: this is a server-side only client. Do not expose this to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
