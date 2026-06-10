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
const READY_EVENT = 'docs-assistant:ready';

// Safety cap so a failed mount never leaves the trigger button permanently
// unresponsive while waiting for the ready signal.
const READY_TIMEOUT = 3000;

let root: Root | null = null;
let mountInFlight: Promise<void> | null = null;

/**
 * Resolves once the freshly mounted widget has attached its
 * `docs-assistant:toggle` listener (it dispatches `docs-assistant:ready`
 * from the same effect). Registering the listener before `root.render()`
 * guarantees the signal cannot be missed. A timeout keeps the trigger
 * button responsive even if the widget never reaches that effect.
 */
function waitForWidgetReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    let timer = 0;
    const done = () => {
      window.clearTimeout(timer);
      window.removeEventListener(READY_EVENT, done);
      resolve();
    };

    window.addEventListener(READY_EVENT, done, { once: true });
    timer = window.setTimeout(done, READY_TIMEOUT);
  });
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
      // Start listening for the ready signal *before* render so the widget's
      // mount effect cannot fire it before we subscribe. Without this, the
      // first `docs-assistant:toggle` dispatched by Header.astro right after
      // this promise resolves would arrive before the widget's toggle
      // listener exists, and the first click would be silently dropped.
      const ready = waitForWidgetReady();

      root = createRoot(container);
      root.render(createElement(DocsAssistantWidget));

      await ready;
    }
  })()
    .catch((err) => {
      if (root) {
        root.unmount();
        root = null;
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
