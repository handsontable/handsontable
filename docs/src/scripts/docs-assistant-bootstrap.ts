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

let root: Root | null = null;
let mountInFlight: Promise<void> | null = null;

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
      root = null;
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
  })()
    .catch((err) => {
      root = null;
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
