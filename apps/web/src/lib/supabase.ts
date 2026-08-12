import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL and Supabase public API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
}

export const supabase = createClient<Database>(url, key, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
