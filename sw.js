const CACHE = 'dash-v1';
const ASSETS = [
  '/', '/index.html', '/main.html', '/health.html', '/po-water.html',
  '/gym.html', '/finance.html', '/caffeine.html',
  '/glass.css', '/topbar.js', '/sync.js', '/icon.svg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('push', e => {
  let data = { title: 'Dashboard', body: 'Je hebt een herinnering.', url: '/' };
  try { if (e.data) data = JSON.parse(e.data.text()); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Don't intercept Supabase or external requests
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
