// juntos · service worker. Red primero (nunca sirve una versión vieja si hay conexión); caché como respaldo sin red.
const VERSION = '__VERSION__';
const CACHE = 'juntos-' + VERSION;
const CORE = ['/', '/index.html', '/app.css', '/content.js', '/app.js', '/sheets.js', '/prod.js', '/vendor/supabase-2.116.0.js', '/manifest.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/index.html') : undefined))));
});

// Avisos push
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title:'juntos', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'juntos', { body: d.body || '', icon:'/icons/icon-192.png', badge:'/icons/icon-192.png', tag: d.tag || undefined, data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/', location.origin).href;
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => { const c = cs.find(x => x.url.startsWith(location.origin)); if (c) { c.navigate(url); return c.focus(); } return self.clients.openWindow(url); }));
});
