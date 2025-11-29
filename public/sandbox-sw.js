// Sandbox Service Worker - Intercepts module requests
let fileCache = new Map();

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_FILES') {
    fileCache = new Map(Object.entries(event.data.files));
    console.log('[SW] Updated file cache:', Array.from(fileCache.keys()));
  } else if (event.data.type === 'CLEAR_CACHE') {
    fileCache.clear();
    console.log('[SW] Cleared file cache');
  }
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle requests for our virtual file system
  if (url.searchParams.has('sandbox-module')) {
    event.respondWith(handleModuleRequest(url));
    return;
  }

  // Pass through all other requests
  event.respondWith(fetch(event.request));
});

async function handleModuleRequest(url) {
  const modulePath = url.searchParams.get('sandbox-module');

  console.log('[SW] Module requested:', modulePath);

  // Try different path variations
  const possiblePaths = [
    modulePath,
    modulePath.replace(/^\.\//, ''),
    `src/${modulePath}`,
    `src/${modulePath.replace(/^\.\//, '')}`,
    modulePath.replace(/\.(jsx|tsx|ts|vue)$/, ''),
    modulePath.replace(/^\.\//, '').replace(/\.(jsx|tsx|ts|vue)$/, '')
  ];

  for (const path of possiblePaths) {
    if (fileCache.has(path)) {
      const code = fileCache.get(path);
      console.log('[SW] Serving module:', path);

      return new Response(code, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  console.error('[SW] Module not found:', modulePath, 'Tried:', possiblePaths);
  return new Response(`console.error('Module not found: ${modulePath}');`, {
    status: 404,
    headers: { 'Content-Type': 'application/javascript' }
  });
}

console.log('[SW] Sandbox Service Worker loaded');
