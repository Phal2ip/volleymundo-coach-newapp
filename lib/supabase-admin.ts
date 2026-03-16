import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante.");
}

return createClient(
"https://zsihfkntafohgwowinba.supabase.co",
serviceRoleKey
);
}