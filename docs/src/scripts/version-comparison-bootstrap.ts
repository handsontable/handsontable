// TODO PRO-1201: wire build-time data injection. The version-comparison page
// is currently a plain .md file (the content loader at
// src/plugins/framework-loader.mjs only scans .md, not .mdx), so the
// <script type="application/json" id="version-comparison-data"> tag is
// emitted empty. The VersionComparison React component reads textContent
// from that tag and will throw a clear error until a remark/rehype plugin
// (or migration to .mdx + an imported VersionComparisonData.astro) fills it.
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
