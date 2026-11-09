import { createClient } from "@supabase/supabase-js";

// ponytail: anon browser singleton with null fallback when .env is absent; upgrade to @supabase/ssr when auth cookies are needed.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseBrowser = url && key ? createClient(url, key) : null;
