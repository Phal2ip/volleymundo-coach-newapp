"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    "https://zsihfkntafohgwowinba.supabase.co",
    "sb_publishable_7IT0mT62Ev8buHI2REauMg_VfnOM_Pq",
  );
}