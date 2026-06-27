// POST /api/push-send
// Body: { title, body, url }
// Reads the stored push subscription from Supabase and sends a Web Push notification.
// Requires Vercel env vars:
//   SUPABASE_URL, SUPABASE_ANON_KEY
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@example.com)
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject    = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (!publicKey || !privateKey) return res.status(500).json({ error: 'VAPID keys not configured' });

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await supa.from('app_state').select('data').eq('key', 'push_subscription').maybeSingle();
  if (error || !data?.data) return res.status(404).json({ error: 'No subscription saved yet' });

  const { title = 'Dashboard', body = 'Herinnering', url = '/' } = req.body || {};
  const payload = JSON.stringify({ title, body, url });

  try {
    await webpush.sendNotification(data.data, payload);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
