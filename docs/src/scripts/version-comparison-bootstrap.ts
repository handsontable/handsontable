const ROOT_ID = 'version-comparison-root';

async function mount() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById(ROOT_ID);
  if (!container) return;
  if (container.dataset.mounted === 'true') return;
  container.dataset.mounted = 'true';

  const [{ createRoot }, { createElement }, { VersionComparison }] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('../components/VersionComparison/VersionComparison'),
  ]);

  createRoot(container).render(createElement(VersionComparison));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
