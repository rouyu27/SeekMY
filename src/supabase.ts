import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase Storage is not configured. Add its URL and publishable key to .env.local.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  accessToken: async () => auth.currentUser?.getIdToken(false) ?? null,
});
