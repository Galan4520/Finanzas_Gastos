import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY_SUPABASE_SERVICE_ROLE_KEY || '';
const webhookSecret = process.env.WP_WEBHOOK_SECRET || '';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-WC-Webhook-Signature, X-WC-Webhook-Topic');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Verify WooCommerce webhook signature (HMAC-SHA256)
    if (webhookSecret) {
      const signature = req.headers['x-wc-webhook-signature'];
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body, 'utf8')
        .digest('base64');

      if (signature !== expectedSignature) {
        console.error('❌ [Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const { billing, status, id: orderId, line_items } = req.body;

    if (!billing?.email) {
      return res.status(400).json({ error: 'No email in webhook payload' });
    }

    const email = billing.email.toLowerCase();
    const plan = line_items?.[0]?.name || 'yunai';

    // Determine subscription status from WooCommerce order status
    let subStatus = 'inactive';
    if (['completed', 'processing'].includes(status)) {
      subStatus = 'active';
    } else if (['cancelled', 'refunded', 'failed'].includes(status)) {
      subStatus = 'cancelled';
    }

    // Calculate expiration (1 year from now for active subscriptions)
    const expiresAt = subStatus === 'active'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [Webhook] Supabase env vars not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists in auth.users by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email?.toLowerCase() === email);

    // Upsert subscription
    const subscriptionData = {
      email,
      status: subStatus,
      plan,
      wp_order_id: String(orderId),
      expires_at: expiresAt,
      ...(existingUser ? { user_id: existingUser.id } : {})
    };

    // Check if subscription exists for this email
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingSub) {
      // Update existing
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);
    } else {
      // Insert new
      await supabase
        .from('subscriptions')
        .insert(subscriptionData);
    }

    console.log(`✅ [Webhook] Subscription ${subStatus} for ${email} (order ${orderId})`);
    return res.status(200).json({ success: true, email, status: subStatus });

  } catch (error) {
    console.error('❌ [Webhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
