/* Trading Decision Lab - minimaler Service Worker
 * App-Shell-Caching, damit die App als PWA installierbar ist
 * und die Oberfläche auch offline lädt. Kursdaten brauchen Netz.
 */
const CACHE_NAME = 'tdl-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest', '/icon.svg']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API-Aufrufe (Binance, Alpha Vantage) nie cachen - immer echte Daten
  if (url.origin !== self.location.origin) return

  // Navigation: Netz zuerst, Cache als Offline-Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    )
    return
  }

  // Statische Assets: Cache zuerst, dann Netz (und nachcachen)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg'))) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
