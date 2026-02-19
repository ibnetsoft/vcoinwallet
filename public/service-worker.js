// Service Worker for PWA and Push Notifications

const CACHE_NAME = 'vcoin-v2'
// HTML은 fetch에서 네트워크 우선이므로 설치 시 캐시하지 않음 (F5 시 항상 최신 버전)
const urlsToCache = [
  '/vcoin_logo.png',
  '/manifest.json'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - document(HTML)는 항상 네트워크 우선, 나머지는 캐시 우선
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return
  }

  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document'

  if (isDocument) {
    // HTML 페이지: 네트워크 우선 (캐시 시 F5 시 예전 버전 노출 방지)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || new Response('', { status: 408, statusText: 'Request Timeout' })))
    )
    return
  }

  // 정적 리소스: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
        return response
      }).catch(() => new Response('', { status: 408, statusText: 'Request Timeout' }))
    })
  )
})

// Push notification handler
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/vcoin_logo.png',
      badge: data.badge || '/vcoin_logo.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: '확인하기'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/wallet')
    )
  }
})
