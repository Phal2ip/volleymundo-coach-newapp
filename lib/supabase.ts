import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://zsihfkntafohgwowinba.supabase.co"
const supabaseAnonKey = "sb_publishable_7IT0mT62Ev8buHI2REauMg_VfnOM_Pq"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);