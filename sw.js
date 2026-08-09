const CACHE_NAME = 'painel-ad-v1';

const PRECACHE_URLS = [
  './index.html',
  './crm.html',
  './financeiro.html',
  './leads.html',
  './manifest.json',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/images/icon-192-maskable.png',
  './assets/images/icon-512-maskable.png',
  './assets/images/apple-touch-icon.png',
  './assets/images/favicon-32.png',
  './assets/images/favicon-64.png'
];

// Só o painel administrativo faz parte deste PWA — as páginas públicas
// (avaliar.html, portais dos restaurantes) ficam de fora do cache para
// nunca servir uma versão desatualizada para clientes/convidados.
const ADMIN_PATHS = ['/', '/index.html', '/crm.html', '/financeiro.html', '/leads.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isAdminPage = ADMIN_PATHS.includes(url.pathname);
  const isAsset = url.pathname.startsWith('/assets/images/');
  if (!isAdminPage && !isAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
