// Service Worker Manager for Sandbox
let swReady = false;
let swReadyPromise: Promise<void> | null = null;

export async function ensureServiceWorkerReady(): Promise<void> {
  if (swReady) return;

  if (swReadyPromise) return swReadyPromise;

  swReadyPromise = (async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Worker not supported');
      swReady = true;
      return;
    }

    try {
      // Check if already registered
      const existing = await navigator.serviceWorker.getRegistration('/');

      if (existing && existing.active) {
        console.log('[SW] Service Worker already active');
        swReady = true;
        return;
      }

      // Register new Service Worker
      await navigator.serviceWorker.register('/sandbox-sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered');

      // Wait for it to be ready
      await navigator.serviceWorker.ready;

      swReady = true;
      console.log('[SW] Service Worker ready');
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      swReady = true; // Continue anyway
    }
  })();

  return swReadyPromise;
}

export function updateServiceWorkerFiles(files: Record<string, string>): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_FILES',
      files
    });
  }
}

export function getServiceWorkerInitScript(): string {
  return `
// Service Worker initialization for module loading
(async function() {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for existing SW or register new one
      let registration = await navigator.serviceWorker.getRegistration('/');

      if (!registration) {
        registration = await navigator.serviceWorker.register('/sandbox-sw.js', {
          scope: '/'
        });
        console.log('[Sandbox] Service Worker registered');
      }

      // Wait for SW to be ready
      await navigator.serviceWorker.ready;
      console.log('[Sandbox] Service Worker ready');
    } catch (error) {
      console.error('[Sandbox] Service Worker error:', error);
    }
  }
})();
`;
}
