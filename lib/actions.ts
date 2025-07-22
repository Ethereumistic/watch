import { createClient } from "@/lib/supabase/client";

export async function updateProfileSettings(userId: string, payload: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      settings: payload.settings,
      interests: payload.interests,
      preferred_gender: payload.preferred_gender,
      preferred_countries: payload.preferred_countries,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile settings:", error);
    return { error, data: null };
  }

  return { data, error: null };
}
