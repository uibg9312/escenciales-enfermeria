// service-worker.js (corregido)
const CACHE_NAME = 'medtools-nanda-v1.6'; // Incrementa versión por cambio de rutas
const urlsToCache = [
  './', // O '/esenciales-enfermeria/' - Representa la raíz del proyecto
  './index.html', // Corregido
  './script.js', // Corregido
  // --- Rutas a iconos corregidas (sin / inicial) ---
  './icons/icon_128x128.png',
  './icons/icon_192x192.png',
  './icons/icon_256x256.png',
  './icons/icon_512x512.png'
  // Si añades style.css o datos JSON, usa rutas relativas: './style.css', './data/nanda_data.json'
];

// ... resto del código del service worker ...

// En la parte de fetch, el fallback también debe usar la ruta relativa
self.addEventListener('fetch', event => {
    // ... (código existente) ...
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
                // Asegúrate que './index.html' está realmente en el caché
                return caches.match('./index.html'); // Usar ruta relativa para el fallback
            });
        })
    );
});
