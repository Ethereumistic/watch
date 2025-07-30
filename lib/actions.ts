"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileSettings(userId: string, payload: any) {
  const supabase = createClient();

  // The payload sent from the client will determine what gets updated.
  // For initial setup, it will include username, dob, and gender.
  // For regular settings updates, it will only contain the other fields.
  // We can use the same function for both.
  const updateData: any = {
    settings: payload.settings,
    interests: payload.interests,
    preferred_gender: payload.preferred_gender,
    preferred_countries: payload.preferred_countries,
    updated_at: new Date().toISOString(),
  };

  // Conditionally add profile fields if they exist in the payload
  if (payload.username) updateData.username = payload.username;
  if (payload.dob) updateData.dob = payload.dob;
  if (payload.gender) updateData.gender = payload.gender;


  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile settings:", error);
    return { error, data: null };
  }

  // Revalidate the path to ensure the client gets the fresh profile data
  revalidatePath('/watch', 'page');

  return { data, error: null };
}
