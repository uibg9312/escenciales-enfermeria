// service-worker.js

const CACHE_NAME = 'medtools-nanda-v1.5'; // Incrementa versión por los cambios
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js', // Añadido: Ruta al script principal
  // --- Rutas a iconos corregidas (guion bajo) ---
  '/icons/icon_128x128.png',
  '/icons/icon_192x192.png', // Añadido y corregido
  '/icons/icon_256x256.png',
  '/icons/icon_512x512.png'
  // Añade cualquier otro recurso estático aquí
];

// Instalación del Service Worker... (resto del código igual)
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        // Importante: Si alguna URL falla, addAll falla completamente.
        // Asegúrate que TODAS las rutas en urlsToCache son correctas y accesibles.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete, activating...');
        return self.skipWaiting();
      })
      .catch(error => {
         console.error('[Service Worker] Installation failed:', error);
         console.error('Failed to cache:', error.message); // Más detalle
      })
  );
});

// Activación del Service Worker... (código igual)
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Activation complete, claiming clients...');
        return self.clients.claim();
    })
  );
});


// Intercepción de Peticiones (Fetch)... (código igual)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  if (event.request.url.startsWith('chrome-extension://')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(
          networkResponse => {
             // No cacheamos dinámicamente por defecto aquí para mantener simple
             return networkResponse;
          }
        ).catch(error => {
            console.log('[Service Worker] Network fetch failed, returning offline fallback');
            // Asegúrate que '/index.html' está realmente en el caché
            return caches.match('/index.html');
         });
      })
  );
});
