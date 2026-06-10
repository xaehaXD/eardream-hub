import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key.
// This bypasses RLS and must NEVER be imported into client components.
// The "server-only" import above causes a build error if this file is ever
// pulled into a client bundle.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  // This will only ever run on the server.
  console.warn(
    "[v0] SUPABASE_SERVICE_ROLE_KEY is not set. Secure post updates will fail."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
