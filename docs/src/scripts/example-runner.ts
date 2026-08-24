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

import { createExampleErrorReporter } from '../lib/example-error-reporting.mjs';

/**
 * Forwards caught example failures to Sentry, minus the classes that carry no signal (failed chunk
 * fetches, errors Handsontable throws on purpose, the expected `HTTP <status>` of the server-side
 * data examples), deduplicated and capped per page load. See the module for the full rationale.
 */
const reportExampleError = createExampleErrorReporter();

// ── Glob maps resolved by Vite at build time ──────────────────────────────
const jsModules       = import.meta.glob('/content/**/example*.js');
const jsxModules      = import.meta.glob('/content/**/example*.jsx');
const vueModules      = import.meta.glob('/content/**/vue/example*.vue');
const vueJsModules    = import.meta.glob('/content/**/vue/example*.js');
const angularModules  = import.meta.glob('/content/**/example*.ts');
const htmlTemplates   = import.meta.glob('/content/**/example*.html', { query: '?raw', import: 'default' });
const cssModules      = import.meta.glob('/content/**/example*.css', { query: '?raw', import: 'default' });

// ── Zone.js load-once guard ───────────────────────────────────────────────
let zoneLoaded = false;

async function ensureZone(): Promise<void> {
  if (zoneLoaded) return;
  // Flag set after the import resolves, so a failed load does not mark zone.js as present.
  await import('zone.js');
  zoneLoaded = true;
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

/**
 * Stops the shimmer and tells the reader the example is not coming.
 *
 * Used only where nothing can possibly mount - the shared framework runtime failed to load, so
 * every example of that framework on the page is dead. A per-example failure keeps the plain
 * markLoaded() degradation: some examples render nothing by design, and a notice there would be
 * wrong more often than right.
 */
function markFailed(el: Element): void {
  markLoaded(el);

  const preview = el.querySelector('.hot-example-preview');

  if (!preview || preview.querySelector('.hot-example-error')) return;

  const notice = document.createElement('p');

  notice.className = 'hot-example-error';
  notice.textContent = 'This example could not be loaded. Reload the page to try again.';
  preview.appendChild(notice);
}

/**
 * Loads a framework runtime that a whole group of examples depends on.
 *
 * These imports used to sit outside every try/catch, so a single failed chunk escaped as an
 * unhandled rejection (Sentry HANDSONTABLE-DOCS-1FX for `import('vue')`) and left every example of
 * that framework stuck on its loading shimmer. Returns `null` when the runtime is unavailable, in
 * which case the group is marked as failed and skipped.
 */
async function loadRuntime<T>(
  framework: string,
  els: Element[],
  load: () => Promise<T>
): Promise<T | null> {
  try {
    return await load();
  } catch (err) {
    console.error(`[hot-example] ${framework} runtime failed to load:`, err);
    reportExampleError(err, { framework, phase: 'runtime-import' });
    els.forEach(markFailed);

    return null;
  }
}

/** Frame budget guarding each RAF wait loop (~1s at 60fps) against a never-met condition. */
const MAX_SETTLE_FRAMES = 60;

/** Returns the live, non-destroyed Handsontable instances mounted inside an example element. */
function getInstances(el: Element): any[] {
  return [...el.querySelectorAll<HTMLElement>('.ht-root-wrapper')]
    .map(wrapper => (wrapper as any).__hotInstance)
    .filter(hot => hot && !hot.isDestroyed);
}

/**
 * Forces a full overlay resync, mirroring what a user scroll does.
 *
 * The inline-start (row header) overlay is a separate clone element whose height is sized from the
 * holder's height. When the grid first renders into a collapsed (0-height) container, that clone
 * height is computed as 0, so its row numbers are clipped even though the inner table renders
 * correctly. A plain render() does not recompute the clone height — but scrolling does. Nudging the
 * holder's scroll position by a pixel and back triggers the same resync without moving the visible
 * position. (Verified live: this is what turns the empty row-header column back into 1, 2, 3…)
 */
function resyncOverlays(hot: any): void {
  const holder = hot?.view?._wt?.wtTable?.holder;

  if (!holder) return;

  const { scrollTop, scrollLeft } = holder;

  holder.scrollTop = scrollTop + 1;
  holder.scrollLeft = scrollLeft + 1;
  holder.dispatchEvent(new Event('scroll'));
  holder.scrollTop = scrollTop;
  holder.scrollLeft = scrollLeft;
  holder.dispatchEvent(new Event('scroll'));
}

/**
 * Re-renders a Handsontable instance once autoRowSize stops sampling, then re-syncs its overlays.
 *
 * Examples sit in a flex layout where the grid fills its container (`.ht-wrapper { height: 100% }`)
 * while the container is sized by the grid's content. At first render — before the layout and CSS
 * settle — this resolves to a height of 0, and nothing breaks the deadlock on its own.
 *
 * The fix is two passes:
 *   1. render() applies the configured pixel height to the holder, which breaks the 0-height
 *      collapse so the container reflows to its real size.
 *   2. On the next frame — after the container has reflowed — resyncOverlays() nudges the scroll to
 *      re-size the overlay clones against the now-correct holder height. Without this the
 *      inline-start (row header) overlay keeps the 0 height it computed against the collapsed
 *      viewport, so the row numbers stay clipped until the user scrolls.
 *
 * autoRowSize samples row heights across several requestAnimationFrame cycles, and rendering
 * mid-sampling computes 0 visible rows. So wait frame by frame until it reports completion
 * (capped, so a stuck flag can't hang), then render. Using requestAnimationFrame means a grid
 * loaded in a background tab refreshes as soon as the tab becomes visible, before any interaction.
 */
function refreshWhenSettled(hot: any): void {
  let frames = 0;

  const tick = (): void => {
    if (hot.isDestroyed) return;

    const autoRowSize = hot.getPlugin?.('autoRowSize');

    if (autoRowSize?.isEnabled?.() && autoRowSize.inProgress && frames < MAX_SETTLE_FRAMES) {
      frames += 1;
      requestAnimationFrame(tick);

      return;
    }

    try {
      hot.render();

      requestAnimationFrame(() => {
        if (hot.isDestroyed) return;
        resyncOverlays(hot);
      });
    } catch (err) {
      console.warn('[hot-example] renderInstances failed:', err);
    }
  };

  requestAnimationFrame(tick);
}

/**
 * Refreshes the dimensions of every Handsontable instance inside an example element.
 *
 * Examples mount inside a zero-size loading shimmer, so the grid initializes with stale
 * (often zero) dimensions. Once markLoaded() reveals the real container we must re-read its
 * size. A fixed setTimeout(100) before render() used to do this, but it was a race against
 * autoRowSize sampling: on slow machines the render fired mid-sampling, computed 0 rows, and
 * left the grid in the broken initial state (default row-number headers instead of empty ones).
 *
 * React, Vue, and Angular mount their components asynchronously, so the instances may not be in
 * the DOM yet when this runs. Poll for them first (the old fixed delay masked this by deferring
 * the whole query), then schedule a settle-aware refresh for each.
 */
function renderInstances(el: Element): void {
  let frames = 0;

  const waitForInstances = (): void => {
    const instances = getInstances(el);

    if (instances.length === 0 && frames < MAX_SETTLE_FRAMES) {
      frames += 1;
      requestAnimationFrame(waitForInstances);

      return;
    }

    instances.forEach(refreshWhenSettled);
  };

  requestAnimationFrame(waitForInstances);
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
        // Not forwarded to Sentry: a missing stylesheet leaves the example working, and the only
        // realistic cause is the chunk-fetch failure the reporter drops anyway.
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
      reportExampleError(err, { framework: 'javascript', phase: 'example-init', source: src });
      markLoaded(el);
    }
  }

  // ── React JSX examples ─────────────────────────────────────────────────
  const jsxEls = [...document.querySelectorAll('[data-example-jsx]')] as HTMLElement[];

  const react = jsxEls.length > 0
    ? await loadRuntime('react', jsxEls, () => Promise.all([
      import('react-dom/client'),
      import('react'),
    ]))
    : null;

  if (react) {
    const [{ createRoot }, { createElement }] = react;

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
        reportExampleError(err, { framework: 'react', phase: 'example-init', source: src });
        markLoaded(el);
      }
    }
  }

  // ── Vue 3 examples ────────────────────────────────────────────────────
  const vueEls = [...document.querySelectorAll('[data-example-vue]')] as HTMLElement[];

  const vue = vueEls.length > 0
    ? await loadRuntime('vue', vueEls, () => import('vue'))
    : null;

  if (vue) {
    const { createApp } = vue;

    for (const el of vueEls) {
      const src = el.dataset.exampleVue!;
      const id  = el.dataset.exampleId;
      const loader = vueModules[src] ?? vueJsModules[src];

      // Same early-out as the other frameworks. Without it a src that matches neither glob - a
      // .vue file moved out of a vue/ directory, say - would throw "loader is not a function" for
      // every reader of that page, and the reporter has no reason to treat that as noise.
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
        // Inject HTML template for JS-based Vue components (in-DOM template pattern).
        const htmlSrc = el.dataset.exampleHtml;

        if (htmlSrc) {
          const htmlLoader = htmlTemplates[htmlSrc];

          if (htmlLoader) {
            container.innerHTML = await htmlLoader() as string;
          }
        }

        const mod = await loader() as { default: any };
        const mountTarget = container.querySelector('[id]') ?? container;
        const app = createApp(mod.default);

        app.mount(mountTarget);
        markLoaded(el);
        renderInstances(el);
      } catch (err) {
        console.error('[hot-example] Vue failed:', src, err);
        reportExampleError(err, { framework: 'vue', phase: 'example-init', source: src });
        markLoaded(el);
      }
    }
  }

  // ── Angular examples ───────────────────────────────────────────────────
  const ngEls = [...document.querySelectorAll('[data-example-angular]')] as HTMLElement[];

  const angularReady = ngEls.length > 0
    ? await loadRuntime('angular', ngEls, async () => {
      await ensureZone();

      // @angular/compiler must be imported before platformBrowserDynamic.
      // Vite tree-shakes it out of production bundles unless explicitly imported,
      // causing "JIT compiler not available" errors for partially-compiled libraries.
      await import('@angular/compiler');

      return true;
    })
    : null;

  if (angularReady) {
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
        reportExampleError(err, { framework: 'angular', phase: 'example-init', source: src });
        markLoaded(el);
      }
    }
  }

}

/**
 * Last-resort guard: `runExamples()` is async, so anything that escapes its inner handlers would
 * surface as an unhandled rejection with no page context. Report it once and keep the page alive.
 */
function startExamples(): void {
  runExamples().catch((err) => {
    console.error('[hot-example] runner failed:', err);
    reportExampleError(err, { framework: 'runner', phase: 'run-examples' });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startExamples);
} else {
  startExamples();
}
