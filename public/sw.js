/**
 * Service Worker for La Tournée de Christèle
 *
 * Strategy:
 *   - On install: cache the app shell (index.html, manifest, icons)
 *   - On fetch: cache-first for app shell, network-first for everything else
 *   - This lets the game work offline once loaded
 */

const CACHE_NAME = 'christele-v2'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/audio/music/venus.mp3',
]  

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch: cache-first for app shell, network-first for the rest
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip cross-origin
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
        })
    })
  )
})
