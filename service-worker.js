// service-worker.js

const CACHE_NAME = 'medtools-nanda-v1.4'; // Cambia la versión si actualizas la app
const urlsToCache = [
  '/', // Cachea la raíz
  '/index.html', // Cachea el archivo HTML principal
  // --- CSS y JS están INLINE en index.html, así que no necesitas cachearlos por separado ---
  // '/style.css', // No necesario si está inline
  // '/script.js', // No necesario si está inline
  // --- Añade aquí las rutas EXACTAS a tus iconos ---
  '/icons/icon-128x128.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png'
  // Añade cualquier otra imagen o recurso estático que uses y quieras offline
];

// Instalación del Service Worker: Abrir caché y añadir los archivos del App Shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete, activating...');
        return self.skipWaiting(); // Fuerza la activación inmediata
      })
      .catch(error => {
         console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activación del Service Worker: Limpiar cachés antiguos
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
        return self.clients.claim(); // Toma control de las páginas abiertas
    })
  );
});

// Intercepción de Peticiones (Fetch): Estrategia "Cache First"
self.addEventListener('fetch', event => {
  // No interceptar peticiones que no sean GET (como POST)
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a extensiones de Chrome (si estás desarrollando localmente)
  if (event.request.url.startsWith('chrome-extension://')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si la respuesta está en caché, devuélvela
        if (cachedResponse) {
          // console.log('[Service Worker] Returning from cache:', event.request.url);
          return cachedResponse;
        }

        // Si no está en caché, ve a la red
        // console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
             // Opcional: Podrías cachear dinámicamente nuevas peticiones aquí,
             // pero para esta app (todo en index.html) no es tan crucial.
             // Por ejemplo:
             // if (networkResponse.ok) {
             //   const responseToCache = networkResponse.clone();
             //   caches.open(CACHE_NAME).then(cache => {
             //     cache.put(event.request, responseToCache);
             //   });
             // }
             return networkResponse;
          }
        ).catch(error => {
            // Si la red falla (offline) y no estaba en caché
            console.log('[Service Worker] Network fetch failed, returning offline fallback (cached index.html likely)');
            // Intenta devolver el index.html cacheado como fallback general
            // ya que contiene toda la app.
            return caches.match('/index.html');
            // O podrías tener un archivo offline.html específico:
            // return caches.match('/offline.html');
         });
      })
  );
});
