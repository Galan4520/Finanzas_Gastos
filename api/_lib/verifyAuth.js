import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Verify JWT token from Authorization header and check subscription.
 * Returns { user, error } — if error is set, respond with appropriate status.
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return { user: null, error: 'No authorization token', status: 401 };
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase env vars not configured, skipping auth check');
    return { user: { id: 'unverified' }, error: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the JWT
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { user: null, error: 'Invalid or expired token', status: 401 };
  }

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!sub) {
    // Also check by email (user paid before registering)
    const { data: subByEmail } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('email', user.email)
      .eq('status', 'active')
      .maybeSingle();

    if (!subByEmail) {
      return { user, error: 'Active subscription required', status: 403 };
    }

    // Check expiration
    if (subByEmail.expires_at && new Date(subByEmail.expires_at) < new Date()) {
      return { user, error: 'Subscription expired', status: 403 };
    }
  } else if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
    return { user, error: 'Subscription expired', status: 403 };
  }

  return { user, error: null };
}
