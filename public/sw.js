const CACHE = 'dana-quest-shell-v1'
const SHELL = ['./', './manifest.webmanifest', './brand/icon-192.png', './brand/dana-quest-logo.png']
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && !event.request.url.includes('/api/')) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()))
    return response
  }).catch(() => caches.match(event.request).then(match => match || (event.request.mode === 'navigate' ? caches.match('./') : Response.error()))))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const path = event.notification.data?.url || '#/su-kien'
  const url = new URL(path, self.registration.scope).href
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => list[0] ? list[0].focus().then(client => client.navigate(url)) : clients.openWindow(url)))
})
