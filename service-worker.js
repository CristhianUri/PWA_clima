const CACHE_NAME = 'weather-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/service-worker.js',  // Asegúrate de que el service worker esté en la caché
  // Agrega otros archivos necesarios
];

self.addEventListener('install', (event) => {
  // Realiza el caching de los archivos durante la instalación del service worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos cacheados durante la instalación');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Activar el service worker y limpiar la caché antigua
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Intercepta las solicitudes y responde con los archivos de la caché si no hay conexión
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos el archivo en caché, lo devolvemos
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cacheamos las nuevas respuestas de la API para futuras solicitudes
            if (event.request.url.includes('api.openweathermap.org')) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone());
              });
            }
            return fetchResponse;
          });
      })
  );
});
