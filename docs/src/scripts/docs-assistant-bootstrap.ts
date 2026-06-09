/**
 * Docs assistant bootstrap: mounts the React chat widget into a single
 * container appended to document.body. Lives on every docs page via the
 * Head.astro override.
 *
 * Re-mounts after Astro client navigations (astro:page-load) when the
 * container is missing from the swapped document.
 */

import type { Root } from 'react-dom/client';

const CONTAINER_ID = 'docs-assistant-root';
const CHUNK_RELOAD_FLAG = 'docs-assistant-chunk-reload';

let root: Root | null = null;
let mountInFlight: Promise<void> | null = null;

/**
 * Returns true when the error is a failed dynamic-import caused by a stale
 * deployment: the browser has a cached HTML page that references old
 * content-hashed chunk filenames that no longer exist on the CDN.
 * Different browsers surface this as different TypeError messages.
 */
function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message;

  return (
    msg.includes('Failed to fetch dynamically imported module') || // Chrome
    msg.includes('error loading dynamically imported module') || // Firefox
    msg.includes('Importing a module script failed') // Safari
  );
}

async function ensureMounted(): Promise<void> {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById(CONTAINER_ID);
  if (root && existing && document.body.contains(existing)) {
    return;
  }

  if (mountInFlight) {
    return mountInFlight;
  }

  mountInFlight = (async () => {
    let container = document.getElementById(CONTAINER_ID);
    if (!container || !document.body.contains(container)) {
      if (root) {
        root.unmount();
        root = null;
      }
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      document.body.appendChild(container);
    }

    const [{ createRoot }, { createElement }, { DocsAssistantWidget }] = await Promise.all([
      import('react-dom/client'),
      import('react'),
      import('../components/DocsAssistant/DocsAssistantWidget'),
    ]);

    if (!root) {
      root = createRoot(container);
      root.render(createElement(DocsAssistantWidget));
    }

    // Successful mount — clear the stale-chunk reload guard so a future
    // deployment can trigger a reload again if needed.
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
    } catch {
      // ignore – private browsing may block sessionStorage
    }
  })()
    .catch((err) => {
      if (root) {
        root.unmount();
        root = null;
      }

      // Stale deployment: reload once to fetch fresh HTML with updated chunk
      // hashes. The session flag prevents an infinite reload loop when the
      // server itself is broken.
      if (isChunkLoadError(err)) {
        try {
          if (!sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
            sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
            window.location.reload();
            return;
          }
        } catch {
          // ignore – private browsing may block sessionStorage
        }
      }

      console.error('docs-assistant: failed to mount', err);
    })
    .finally(() => {
      mountInFlight = null;
    });

  return mountInFlight;
}

declare global {
  interface Window {
    docsAssistantEnsureMounted?: () => Promise<void>;
  }
}

window.docsAssistantEnsureMounted = ensureMounted;

function onPageLoad() {
  void ensureMounted();
}

document.addEventListener('astro:page-load', onPageLoad);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onPageLoad, { once: true });
} else {
  onPageLoad();
}
