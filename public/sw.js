/**
 * PrepperZero Service Worker
 * MEDIUM PRIORITY FIX: Enable true offline-first capability
 * 
 * Caching Strategy:
 * - Cache-first: Static assets (CSS, JS, fonts, images)
 * - Network-first: HTML pages (always check network first, fallback to cache)
 * - Network-only: API endpoints (never cache dynamic data)
 * 
 * This enables:
 * - Offline page viewing (all cached pages accessible without internet)
 * - Instant page loads (from cache)
 * - Graceful fallback when service unavailable
 */

const CACHE_PREFIX = 'prepperzero';
const CACHE_VERSION = 'v1';
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Assets that should be cached aggressively (cache-first)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/maps.html',
  '/library.html',
  '/tools.html',
  '/settings.html',
  '/ap_settings.html',
  '/audit.html',
  '/apaudit.html',
  '/full_audit.html',
  '/css/design-system.css',
  '/js/sidebar-toggle.js',
  '/js/status-poller.js',
  '/js/maps.js',
  '/js/config.js',
  '/js/pdf-loader.js'
];

/**
 * Install event: Cache essential static assets
 * This runs once when service worker is registered
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Caching ${STATIC_ASSETS.length} essential assets`);
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          // Log but don't fail if some assets unavailable (network might be down)
          console.warn('[SW] Some assets could not be cached during install:', err.message);
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

/**
 * Activate event: Clean up old cache versions
 * Runs when service worker becomes active
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions
            if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Claim all clients immediately
  );
});

/**
 * Fetch event: Implement caching strategy based on request type
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API endpoints: Never cache (network-only)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Network failed: Return offline response
          return new Response(
            JSON.stringify({ error: 'Offline - API unavailable' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // HTML pages: Network-first (always check network, fallback to cache)
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed: Try cache
          return caches.match(request)
            .then((cached) => cached || createOfflineFallback());
        })
    );
    return;
  }
  
  // Static assets: Cache-first (use cache, fallback to network)
  if (
    request.method === 'GET' &&
    (url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.woff') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.ttf') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.gif') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.webp'))
  ) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // Return from cache and update in background
            fetch(request)
              .then((response) => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, response);
                  });
                }
              })
              .catch(() => {}); // Silently fail if network unavailable
            
            return cached;
          }
          
          // Not in cache: fetch from network
          return fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            });
        })
        .catch(() => {
          // Network failed and not in cache: Return placeholder
          if (url.pathname.endsWith('.css')) {
            return new Response('/* Asset unavailable offline */', {
              headers: { 'Content-Type': 'text/css' }
            });
          }
          return new Response('/* Asset unavailable offline */', {
            headers: { 'Content-Type': 'text/javascript' }
          });
        })
    );
    return;
  }
  
  // Default: network-first for everything else
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

/**
 * Create offline fallback page
 */
function createOfflineFallback() {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PrepperZero - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          background: #0F1113;
          color: #E8E8E8;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .offline-message {
          text-align: center;
          max-width: 500px;
        }
        h1 { font-size: 2em; margin-bottom: 10px; }
        p { font-size: 1.1em; color: #9A9A9A; margin-bottom: 20px; }
        .cached-pages {
          background: #2A2D31;
          border: 1px solid #3C3F44;
          border-radius: 6px;
          padding: 20px;
          text-align: left;
          margin-top: 30px;
        }
        .cached-pages h2 { margin-top: 0; }
        .cached-pages a {
          display: block;
          color: #FF8A00;
          text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid #1A1C1F;
        }
        .cached-pages a:last-child { border-bottom: none; }
        .cached-pages a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <h1>⚠️ Offline</h1>
        <p>You're currently offline. Cached pages are available below.</p>
        
        <div class="cached-pages">
          <h2>Cached Pages</h2>
          <a href="/">Dashboard</a>
          <a href="/maps.html">Maps</a>
          <a href="/library.html">Library</a>
          <a href="/tools.html">Tools</a>
          <a href="/settings.html">Settings</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 0.9em; color: #5A5A5A;">
          API endpoints are unavailable. Reconnect to your network to access live data.
        </p>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
