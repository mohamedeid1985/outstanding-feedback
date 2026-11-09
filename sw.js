// Makes the page installable as an app. It always asks the network first, so an update is picked up as soon as the device is
// online; the saved copy is only used when the device is offline (then the page opens and says it is offline).
// Requests to the database (supabase.co) are never touched or saved.
const CACHE = 'outstanding-v1';
const OWN = self.location.origin;
const CDN = ['https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'icons/icon-192.png'])).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== OWN && !CDN.includes(u.origin)) return;
  const key = u.origin + u.pathname;                       // the query string is ignored, so the saved copy does not pile up
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(key).then(m => m || (r.mode === 'navigate' ? caches.match(OWN + u.pathname.replace(/[^/]*$/, '')) : undefined)))
  );
});
