const CACHE_NAME = 'CALENDARIO TOTAL K-POP-v2.4';
const urlsToCache = [
  '/',
  '/manifest.json',
  'logo.png',
  '/index.html' // Ajusta esto si tu HTML tiene otro nombre
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, fallback a cache
self.addEventListener('fetch', event => {
  // Ignorar peticiones a albums (para no cachear las fotos y que siempre se actualicen)
  if (event.request.url.includes('/album/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para el resto de recursos: cache first, luego red
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Devuelve desde cache
        }
        
        // Si no está en cache, busca en la red
        return fetch(event.request)
          .then(response => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para guardarla en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // No cachear peticiones a albums
                if (!event.request.url.includes('/album/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            console.log('❌ Falló la petición:', error);
            // Aquí podrías devolver una página offline personalizada
          });
      })
  );
});

// Manejo de notificaciones push (si las implementas después)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'logo.png',
    badge: 'logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: 'logo.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: 'logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Mariangel Calendar', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});