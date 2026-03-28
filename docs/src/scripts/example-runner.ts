/**
 * Example runner — loaded by the Head component override.
 *
 * Scans the current page for [data-example-js], [data-example-jsx], and
 * [data-example-angular] elements, then dynamically imports and executes each
 * matching module.
 *
 * JS examples self-mount when their module is imported.
 * JSX examples export a default React component; the runner mounts it via createRoot.
 * Angular examples export an AppModule class; the runner bootstraps it via
 * platformBrowserDynamic after loading Zone.js and injecting the template HTML.
 */

// ── Glob maps resolved by Vite at build time ──────────────────────────────
const jsModules       = import.meta.glob('/content/**/example*.js');
const jsxModules      = import.meta.glob('/content/**/example*.jsx');
const angularModules  = import.meta.glob('/content/**/example*.ts');
const htmlTemplates   = import.meta.glob('/content/**/example*.html', { query: '?raw', import: 'default' });
const cssModules      = import.meta.glob('/content/**/example*.css', { query: '?raw', import: 'default' });

// ── Zone.js load-once guard ───────────────────────────────────────────────
let zoneLoaded = false;

async function ensureZone(): Promise<void> {
  if (zoneLoaded) return;
  zoneLoaded = true;
  await import('zone.js');
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Removes the loading shimmer from the preview section of an example element. */
function markLoaded(el: Element): void {
  el.querySelector('.hot-example-preview')?.classList.remove('hot-example-preview--loading');
}

// ── Main runner ───────────────────────────────────────────────────────────

async function runExamples(): Promise<void> {
  // ── Inject example CSS files ──────────────────────────────────────────
  for (const el of document.querySelectorAll('[data-example-css]')) {
    const src = (el as HTMLElement).dataset.exampleCss!;
    const loader = cssModules[src];

    if (loader) {
      try {
        const cssText = await loader() as string;
        const style = document.createElement('style');

        style.textContent = cssText;
        document.head.appendChild(style);
      } catch (err) {
        console.error('[hot-example] CSS failed:', src, err);
      }
    }
  }

  // ── Vanilla JS examples ────────────────────────────────────────────────
  for (const el of document.querySelectorAll('[data-example-js]')) {
    const src = (el as HTMLElement).dataset.exampleJs!;
    const loader = jsModules[src];

    if (!loader) {
      console.warn('[hot-example] No JS module for:', src);
      markLoaded(el);
      continue;
    }

    try {
      await loader();
      markLoaded(el);
    } catch (err) {
      console.error('[hot-example] JS failed:', src, err);
      markLoaded(el);
    }
  }

  // ── React JSX examples ─────────────────────────────────────────────────
  const jsxEls = [...document.querySelectorAll('[data-example-jsx]')] as HTMLElement[];

  if (jsxEls.length > 0) {
    const [{ createRoot }, { createElement }] = await Promise.all([
      import('react-dom/client'),
      import('react'),
    ]);

    for (const el of jsxEls) {
      const src = el.dataset.exampleJsx!;
      const id  = el.dataset.exampleId;
      const loader = jsxModules[src];

      if (!loader) {
        console.warn('[hot-example] No JSX module for:', src);
        markLoaded(el);
        continue;
      }

      const container = id ? document.getElementById(id) : null;

      if (!container) {
        console.warn('[hot-example] Preview container not found for id:', id);
        markLoaded(el);
        continue;
      }

      try {
        const mod = await loader() as { default: React.ComponentType };
        const Component = mod.default;

        createRoot(container).render(createElement(Component));
        markLoaded(el);
      } catch (err) {
        console.error('[hot-example] JSX failed:', src, err);
        markLoaded(el);
      }
    }
  }

  // ── Angular examples ───────────────────────────────────────────────────
  const ngEls = [...document.querySelectorAll('[data-example-angular]')] as HTMLElement[];

  if (ngEls.length > 0) {
    await ensureZone();

    // @angular/compiler must be imported before platformBrowserDynamic.
    // Vite tree-shakes it out of production bundles unless explicitly imported,
    // causing "JIT compiler not available" errors for partially-compiled libraries.
    await import('@angular/compiler');

    const { platformBrowserDynamic } = await import('@angular/platform-browser-dynamic');

    for (const el of ngEls) {
      const src     = el.dataset.exampleAngular!;
      const htmlSrc = el.dataset.exampleHtml;
      const id      = el.dataset.exampleId;
      const loader  = angularModules[src];

      if (!loader) {
        console.warn('[hot-example] No Angular module for:', src);
        markLoaded(el);
        continue;
      }

      const container = id ? document.getElementById(id) : null;

      if (!container) {
        console.warn('[hot-example] Angular container not found for id:', id);
        markLoaded(el);
        continue;
      }

      try {
        if (htmlSrc) {
          const htmlLoader = htmlTemplates[htmlSrc];

          if (htmlLoader) {
            container.innerHTML = await htmlLoader() as string;
          }
        }

        const mod = await loader() as { AppModule: unknown };
        const AppModule = mod.AppModule;

        if (!AppModule) {
          console.warn('[hot-example] Angular module has no AppModule export:', src);
          markLoaded(el);
          continue;
        }

        await platformBrowserDynamic().bootstrapModule(AppModule as never, {
          ngZoneEventCoalescing: true,
        });
        markLoaded(el);
      } catch (err) {
        console.error('[hot-example] Angular failed:', src, err);
        markLoaded(el);
      }
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runExamples);
} else {
  runExamples();
}
