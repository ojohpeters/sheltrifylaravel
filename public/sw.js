/**
 * ShelTrify service worker.
 *
 * Deliberately conservative: this app is session-authenticated and almost
 * entirely dynamic, so the ONLY thing cached aggressively is the hashed Vite
 * build output. HTML and /api/* always hit the network — caching either would
 * serve one user's authenticated shell or data to another.
 */
const VERSION     = 'v1';
const ASSET_CACHE = `sheltrify-assets-${VERSION}`;
const SHELL_CACHE = `sheltrify-shell-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== ASSET_CACHE && k !== SHELL_CACHE)
          .map((k) => caches.delete(k)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never touch non-GET, cross-origin, or API traffic.
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Hashed build assets are immutable — cache-first is safe and fast.
  if (url.pathname.startsWith('/build/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })),
    );
    return;
  }

  // Page navigations: always network-first (the Inertia shell is per-user),
  // falling back to the offline page only when the network is unreachable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Static icons and the manifest: cache-first, refreshed in the background.
  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request)),
    );
  }
});
