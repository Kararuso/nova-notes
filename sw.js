// Офлайн-кэш: отдаём из кэша сразу и тихо обновляем в фоне.
// При крупных изменениях увеличьте номер версии кэша.
const CACHE = 'nova-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/base.css', './css/components.css', './css/sheet.css',
  './js/main.js', './js/config.js', './js/utils.js', './js/icons.js',
  './js/store.js', './js/pwa.js', './js/views.js', './js/sheets.js',
  './icons/icon.svg', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
