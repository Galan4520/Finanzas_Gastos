import { supabase } from './supabaseClient';

// Check if user has an active subscription
export async function checkSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  if (!data) return false;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return true;
}

// Check subscription by email (for users who paid before registering)
export async function checkSubscriptionByEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('email', email)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return false;

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  return true;
}

// Link pending subscription (by email) to user_id after registration
export async function linkPendingSubscription(userId: string, email: string): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({ user_id: userId })
    .eq('email', email)
    .is('user_id', null);
}

// Get user's script_url from Supabase
export async function getUserConfig(userId: string): Promise<{ scriptUrl: string } | null> {
  const { data, error } = await supabase
    .from('user_config')
    .select('script_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return { scriptUrl: data.script_url };
}

// Save user's script_url to Supabase
export async function saveUserConfig(userId: string, scriptUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_config')
    .upsert({ user_id: userId, script_url: scriptUrl }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error saving user config:', error);
    return false;
  }
  return true;
}
