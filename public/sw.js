/* Service worker for SLP Cement Works Billing PWA */
const CACHE = 'slp-billing-v44';

const PRECACHE = [
  '/',
  '/narasimha-logo.jpg',
  '/fonts/NotoSansTelugu-Regular.ttf',
  '/fonts/NotoSansTelugu-Bold.ttf',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/products/well-rings.jpg',
  '/products/well-lids.jpg',
  '/products/poles.jpg',
  '/products/poles-2.jpg',
  '/products/rings-2.jpg',
  '/products/window-frames.jpg',
  '/products/window-frames-2.jpg',
  '/products/slabs.jpg',
  '/products/slabs-2.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        // v43: keep the CURRENT cache AND the one before it. A phone that
        // booted the old shell still needs the old chunks (they are hashed
        // per build); deleting the previous cache mid-flight is exactly how
        // a slow connection ends up with a new shell and no JS — the white
        // "Application error" screen after every deploy.
        const num = (k) => parseInt((k.match(/-v(\d+)$/) || [])[1] || '0', 10);
        const keep = Math.max(...keys.map(num));
        return Promise.all(
          keys.filter((k) => num(k) > 0 && num(k) < keep - 1).map((k) => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API calls ALWAYS hit the network — never cached, never stalled by the SW
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: stale-while-revalidate. The cached shell answers INSTANTLY
  // (even on a dying network), and the fresh copy updates the cache in the
  // background for the next boot. The old HTML + old chunks in the same
  // cache stay a self-consistent pair, so the app always boots — then the
  // chunk-error guard reloads once when the new build is fully fetched.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cached) => {
        const refresh = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => undefined);
            return res;
          })
          .catch(() => cached || Response.error());
        return cached || refresh;
      })
    );
    return;
  }

  // Static assets (icons, images, next chunks): cache first
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2');

  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
            return res;
          })
      )
    );
  }
});
