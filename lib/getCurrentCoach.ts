import { createClient } from "./supabase/server";

export async function getCurrentCoach() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return null;
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("*")
    .eq("email", user.email)
    .single();

  if (coachError || !coach) {
    return null;
  }

  return coach;
}