// POST /api/push-subscribe
// Body: { subscription: PushSubscriptionJSON }
// Saves the push subscription to Supabase so /api/push-send can reach this device.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { subscription } = req.body || {};
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'missing subscription' });

  const supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { error } = await supa.from('app_state').upsert(
    { key: 'push_subscription', data: subscription, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
}
