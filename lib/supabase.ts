import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseBrowserClient = () =>
  createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export const supabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !supabaseServiceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean);
    throw new Error(
      `Supabase server environment variables are missing: ${missing.join(", ")}. ` +
        `Either set them in .env.local or enable MOCK_LEADS to run without Supabase.`,
    );
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
