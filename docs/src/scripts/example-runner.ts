/**
 * Example runner — loaded by the Head component override.
 *
 * Scans the current page for [data-example-js], [data-example-jsx], and
 * [data-example-angular] elements, then dynamically imports and executes each
 * matching module.
 *
 * JS examples self-mount when their module is imported.
 * JSX examples export a default React component; the runner mounts it via createRoot.
 * Angular examples support two patterns:
 *   - Legacy NgModule:  export class AppModule {}  (bootstrapped via platformBrowserDynamic)
 *   - Modern standalone: export class AppComponent {} + export const appConfig  (bootstrapped via bootstrapApplication)
 */

// ── Glob maps resolved by Vite at build time ──────────────────────────────
const jsModules       = import.meta.glob('/content/**/example*.js');
const jsxModules      = import.meta.glob('/content/**/example*.jsx');
const vueModules      = import.meta.glob('/content/**/vue/example*.vue');
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

// ── Angular bootstrap helper (NgModule + standalone) ─────────────────────

/**
 * Bootstraps an Angular example module.
 *
 * Supports two export conventions:
 *  - Legacy NgModule:    { AppModule }         → platformBrowserDynamic().bootstrapModule()
 *  - Modern standalone:  { AppComponent, appConfig? } → bootstrapApplication()
 */
async function bootstrapAngular(mod: Record<string, unknown>): Promise<void> {
  if (mod.AppModule) {
    const { platformBrowserDynamic } = await import('@angular/platform-browser-dynamic');

    await platformBrowserDynamic().bootstrapModule(mod.AppModule as never, {
      ngZoneEventCoalescing: true,
    });
  } else if (mod.AppComponent) {
    const { bootstrapApplication } = await import('@angular/platform-browser');
    const config = (mod.appConfig ?? { providers: [] }) as never;

    await bootstrapApplication(mod.AppComponent as never, config);
  } else {
    throw new Error('Angular example must export AppModule (NgModule) or AppComponent (standalone)');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Removes the loading shimmer from the preview section of an example element. */
function markLoaded(el: Element): void {
  el.querySelector('.hot-example-preview')?.classList.remove('hot-example-preview--loading');
}

/** Frame budget guarding the autoRowSize wait loop (~1s at 60fps) against a stuck inProgress flag. */
const MAX_SETTLE_FRAMES = 60;

/**
 * Refreshes the dimensions of every Handsontable instance inside an example element.
 *
 * Examples mount inside a zero-size loading shimmer, so the grid initializes with stale
 * (often zero) dimensions. Once markLoaded() reveals the real container we must re-read its
 * size. A fixed setTimeout(100) before render() used to do this, but it was a race:
 * autoRowSize samples row heights across several requestAnimationFrame cycles, and on slow
 * machines sampling outlasts 100ms. A render() fired mid-sampling computes 0 visible rows and
 * leaves the grid in the broken initial state (default row-number headers instead of the
 * configured empty ones).
 *
 * Instead, wait frame by frame until autoRowSize reports it has finished sampling, then call
 * refreshDimensions(), which re-reads the container box and re-renders only when the size
 * actually changed.
 */
function renderInstances(el: Element): void {
  el.querySelectorAll<HTMLElement>('.ht-root-wrapper').forEach((wrapper) => {
    const hot = (wrapper as any).__hotInstance;

    if (!hot) return;

    let frames = 0;

    const refreshWhenSettled = (): void => {
      if (hot.isDestroyed) return;

      const autoRowSize = hot.getPlugin?.('autoRowSize');

      // autoRowSize samples row heights over several RAF cycles; refreshing mid-sampling
      // produces 0 rows. Wait until it reports completion (capped, so a stuck flag can't hang).
      if (autoRowSize?.isEnabled?.() && autoRowSize.inProgress && frames < MAX_SETTLE_FRAMES) {
        frames += 1;
        requestAnimationFrame(refreshWhenSettled);

        return;
      }

      try {
        hot.refreshDimensions();
      } catch (err) {
        console.warn('[hot-example] renderInstances failed:', err);
      }
    };

    requestAnimationFrame(refreshWhenSettled);
  });
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
      renderInstances(el);
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

        const root = createRoot(container);
        root.render(createElement(Component));
        markLoaded(el);
        renderInstances(el);
      } catch (err) {
        console.error('[hot-example] JSX failed:', src, err);
        markLoaded(el);
      }
    }
  }

  // ── Vue 3 examples ────────────────────────────────────────────────────
  const vueEls = [...document.querySelectorAll('[data-example-vue]')] as HTMLElement[];

  if (vueEls.length > 0) {
    const { createApp } = await import('vue');

    for (const el of vueEls) {
      const src = el.dataset.exampleVue!;
      const id  = el.dataset.exampleId;
      const loader  = vueModules[src];

      if (!loader) {
        console.warn('[hot-example] No Vue module for:', src);
        markLoaded(el);
        continue;
      }

      const container = id ? document.getElementById(id) : null;

      if (!container) {
        console.warn('[hot-example] Vue container not found for id:', id);
        markLoaded(el);
        continue;
      }

      try {
        const mod = await loader() as { default: any };
        const app = createApp(mod.default);

        app.mount(container);
        markLoaded(el);
        renderInstances(el);
      } catch (err) {
        console.error('[hot-example] Vue failed:', src, err);
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

        const mod = await loader() as Record<string, unknown>;
        await bootstrapAngular(mod);
        markLoaded(el);
        renderInstances(el);
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
