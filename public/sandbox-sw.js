// Sandbox Service Worker - Intercepts module requests
let fileCache = new Map();
let importMap = {
  imports: {
    'vue': 'https://esm.sh/vue@3.4.21/dist/vue.esm-browser.js',
    'react': 'https://esm.sh/react@18.2.0',
    'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
    'react/': 'https://esm.sh/react@18.2.0/',
    'react-dom/': 'https://esm.sh/react-dom@18.2.0/',
    'solid-js': 'https://esm.sh/solid-js@1.8.22',
    'solid-js/web': 'https://esm.sh/solid-js@1.8.22/web',
    'solid-element': 'https://esm.sh/solid-element@1.8.1'
  }
};

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_FILES') {
    fileCache = new Map(Object.entries(event.data.files));
    console.log('[SW] Updated file cache:', Array.from(fileCache.keys()));
  } else if (event.data.type === 'UPDATE_IMPORT_MAP') {
    importMap = event.data.importMap;
    console.log('[SW] Updated import map');
  } else if (event.data.type === 'CLEAR_CACHE') {
    fileCache.clear();
    console.log('[SW] Cleared file cache');
  }
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle requests for our virtual file system
  if (url.pathname.startsWith('/__sandbox_module__/')) {
    event.respondWith(handleModuleRequest(url));
    return;
  }

  // Handle bare imports (like 'vue', 'react', etc.)
  if (event.request.destination === 'script' || event.request.destination === '') {
    const moduleName = url.pathname.replace(/^\//, '');
    if (importMap.imports[moduleName]) {
      console.log('[SW] Redirecting bare import:', moduleName, '->', importMap.imports[moduleName]);
      event.respondWith(fetch(importMap.imports[moduleName]));
      return;
    }
  }

  // Pass through all other requests
  event.respondWith(fetch(event.request));
});

async function handleModuleRequest(url) {
  const modulePath = decodeURIComponent(url.pathname.replace('/__sandbox_module__/', ''));

  console.log('[SW] Module requested:', modulePath);

  // Check if it's a bare import that should be redirected
  if (importMap.imports[modulePath]) {
    console.log('[SW] Redirecting to CDN:', modulePath, '->', importMap.imports[modulePath]);
    return fetch(importMap.imports[modulePath]);
  }

  // Try different path variations
  const possiblePaths = [
    modulePath,
    modulePath.replace(/^\.\//, ''),
    `src/${modulePath}`,
    `src/${modulePath.replace(/^\.\//, '')}`,
    modulePath.replace(/\.(jsx|tsx|js|ts|vue)$/, ''),
    modulePath.replace(/^\.\//, '').replace(/\.(jsx|tsx|js|ts|vue)$/, '')
  ];

  for (const path of possiblePaths) {
    if (fileCache.has(path)) {
      let code = fileCache.get(path);
      console.log('[SW] Serving module:', path);

      // Rewrite bare imports in the code to use CDN URLs
      code = rewriteImports(code);

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

function rewriteImports(code) {
  // Rewrite bare imports to use CDN URLs from import map
  let rewritten = code;

  for (const [specifier, url] of Object.entries(importMap.imports)) {
    // Match: import ... from 'specifier'
    const importRegex = new RegExp(`from\\s+['"]${escapeRegex(specifier)}['"]`, 'g');
    rewritten = rewritten.replace(importRegex, `from '${url}'`);

    // Match: import('specifier')
    const dynamicImportRegex = new RegExp(`import\\s*\\(\\s*['"]${escapeRegex(specifier)}['"]\\s*\\)`, 'g');
    rewritten = rewritten.replace(dynamicImportRegex, `import('${url}')`);
  }

  return rewritten;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('[SW] Sandbox Service Worker loaded');
