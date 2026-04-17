/**
 * Docs assistant bootstrap: mounts the React chat widget into a single
 * container appended to document.body. Lives on every docs page via the
 * Head.astro override.
 */

const CONTAINER_ID = 'docs-assistant-root';

async function mount() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(CONTAINER_ID)) return;

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);

  const [{ createRoot }, { createElement }, { DocsAssistantWidget }] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('../components/DocsAssistant/DocsAssistantWidget'),
  ]);

  createRoot(container).render(createElement(DocsAssistantWidget));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
