// lib/supabaseAdmin.js
// Server-side Supabase client using the service_role key.
// NEVER import this in frontend/browser code — it bypasses RLS.
// Only use inside pages/api/* routes.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseServiceKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

// Admin client – bypasses RLS (only safe on the server)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─────────────────────────────────────────────────────────────
// Helper: verify a user JWT and return the user object.
// Pass the "Authorization: Bearer <token>" header value.
// ─────────────────────────────────────────────────────────────
export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return { user: null, error: 'No token provided' };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }
  return { user: data.user, error: null };
}

// ─────────────────────────────────────────────────────────────
// Helper: check if a user is a service team member
// ─────────────────────────────────────────────────────────────
export function isServiceTeam(user) {
  return user?.email?.endsWith('@itrgenie.com') ?? false;
}
