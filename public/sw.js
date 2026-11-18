/* Service worker for SLP Cement Works Billing PWA */
const CACHE = 'slp-billing-v45';

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
        // keep the CURRENT cache AND the one before it. A phone that booted
        // the old shell still needs the old chunks (they are hashed per
        // build); deleting the previous cache mid-flight is exactly how a
        // slow connection ends up with a new shell and no JS.
        const num = (k) => parseInt((k.match(/-v(\d+)$/) || [])[1] || '0', 10);
        const keep = Math.max(...keys.map(num));
        return Promise.all(
          keys.filter((k) => num(k) > 0 && num(k) < keep - 1).map((k) => caches.delete(k))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* v45: the app updates ONLY when the user agrees. The shell is served
 * cache-first — it never changes on its own. The UpdateManager compares
 * release.json with the running version and ASKS: "Update now" sends
 * APPLY_UPDATE (download new shell + chunks with a progress bar, swap the
 * cache, reload); "Continue with old version" changes nothing. */
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'APPLY_UPDATE') return;
  event.waitUntil(
    (async () => {
      const reply = (msg) =>
        self.clients.matchAll({ includeUncontrolled: true }).then((cs) => cs.forEach((c) => c.postMessage(msg)));
      try {
        const res = await fetch('/', { cache: 'reload' });
        if (!res.ok) {
          await reply({ type: 'UPDATE_FAILED' });
          return;
        }
        const html = await res.text();
        // collect the build assets the new shell needs
        const urls = new Set();
        for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
          const u = m[1];
          if (/^\/_next\//.test(u) || /^\/fonts\//.test(u) || u.endsWith('.js') || u.endsWith('.css')) {
            urls.add(u);
          }
        }
        const list = [...urls];
        const cache = await caches.open(CACHE);
        let done = 0;
        const results = await Promise.all(
          list.map(async (u) => {
            try {
              const r = await fetch(u, { cache: 'reload' });
              if (r.ok) {
                await cache.put(u, r.clone());
                done += 1;
                await reply({ type: 'UPDATE_PROGRESS', done, total: list.length });
                return true;
              }
              return false;
            } catch {
              return false;
            }
          })
        );
        // swap the shell ONLY when every asset made it — a half-downloaded
        // update must never leave the phone with a new shell and no chunks
        if (results.every(Boolean)) {
          await cache.put('/', new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
          await reply({ type: 'UPDATE_READY', done: list.length, total: list.length });
          await self.skipWaiting();
        } else {
          await reply({ type: 'UPDATE_FAILED', done, total: list.length });
        }
      } catch {
        await reply({ type: 'UPDATE_FAILED' });
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API calls ALWAYS hit the network — never cached, never stalled by the SW
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: CACHE-FIRST. The cached shell answers instantly (even on a
  // dying network) and stays a self-consistent pair with its own chunks.
  // It changes only via APPLY_UPDATE — a user who declined keeps the old
  // version for as long as they want ("continue old version only").
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => undefined);
            return res;
          })
      )
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
