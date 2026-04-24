import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  throw new Error("Invalid Supabase URL. Set VITE_SUPABASE_URL in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);