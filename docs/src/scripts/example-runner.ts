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
const vueModules      = import.meta.glob('/content/**/vue/example*.js');
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

/** Store original preview HTML for reset. */
const originalPreviews = new WeakMap<Element, string>();

/** Saves the initial preview HTML so we can restore it on reset. */
function savePreview(el: Element): void {
  const preview = el.querySelector('.hot-example-preview');
  if (preview && !originalPreviews.has(el)) {
    originalPreviews.set(el, preview.innerHTML);
  }
}

/** Destroys all Handsontable instances inside a container. */
function destroyInstances(container: Element): void {
  // @ts-expect-error — Handsontable is loaded globally by examples
  const Handsontable = (window as any).Handsontable;
  if (!Handsontable?.instances) return;

  const instances = [...Handsontable.instances];
  for (const hot of instances) {
    try {
      if (container.contains(hot.rootElement)) {
        hot.destroy();
      }
    } catch { /* already destroyed */ }
  }
}

// ── Reset handler ─────────────────────────────────────────────────────────

function setupResetButtons(): void {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest('.hot-example-reset-btn');
    if (!btn) return;

    const wrapper = btn.closest('.hot-example') as HTMLElement | null;
    if (!wrapper) return;

    const preview = wrapper.querySelector('.hot-example-preview');
    if (!preview) return;

    // Destroy existing Handsontable instances
    destroyInstances(preview);

    // Unmount React roots
    const reactRoots = (wrapper as any).__reactRoots as any[];
    if (reactRoots) {
      for (const root of reactRoots) {
        try { root.unmount(); } catch { /* ok */ }
      }
      (wrapper as any).__reactRoots = [];
    }

    // Restore original preview HTML
    const original = originalPreviews.get(wrapper);
    if (original) {
      preview.innerHTML = original;
    }

    // Re-run the example
    const jsSrc = wrapper.dataset.exampleJs;
    const jsxSrc = wrapper.dataset.exampleJsx;
    const vueSrc = wrapper.dataset.exampleVue;
    const ngSrc = wrapper.dataset.exampleAngular;
    const id = wrapper.dataset.exampleId;
    const cacheBust = `?t=${Date.now()}`;

    if (jsSrc) {
      try {
        await import(/* @vite-ignore */ jsSrc + cacheBust);
      } catch (err) {
        console.error('[hot-example] Reset JS failed:', jsSrc, err);
      }
    } else if (jsxSrc && id) {
      try {
        const [{ createRoot }, { createElement }] = await Promise.all([
          import('react-dom/client'),
          import('react'),
        ]);
        const mod = await import(/* @vite-ignore */ jsxSrc + cacheBust) as { default: React.ComponentType };
        const container = document.getElementById(id);
        if (container) {
          const root = createRoot(container);
          root.render(createElement(mod.default));
          if (!(wrapper as any).__reactRoots) (wrapper as any).__reactRoots = [];
          (wrapper as any).__reactRoots.push(root);
        }
      } catch (err) {
        console.error('[hot-example] Reset JSX failed:', jsxSrc, err);
      }
    } else if (vueSrc && id) {
      try {
        const { createApp } = await import('vue');
        const htmlSrc = wrapper.dataset.exampleHtml;
        const container = document.getElementById(id);
        if (container && htmlSrc) {
          const htmlLoader = htmlTemplates[htmlSrc];
          if (htmlLoader) {
            container.innerHTML = await htmlLoader() as string;
          }
        }
        const mod = await import(/* @vite-ignore */ vueSrc + cacheBust) as { default: any };
        if (container) {
          createApp(mod.default).mount(container);
        }
      } catch (err) {
        console.error('[hot-example] Reset Vue failed:', vueSrc, err);
      }
    } else if (ngSrc && id) {
      try {
        const htmlSrc = wrapper.dataset.exampleHtml;
        const container = document.getElementById(id);
        if (container && htmlSrc) {
          const htmlLoader = htmlTemplates[htmlSrc];
          if (htmlLoader) {
            container.innerHTML = await htmlLoader() as string;
          }
        }
        await ensureZone();
        await import('@angular/compiler');
        const { platformBrowserDynamic } = await import('@angular/platform-browser-dynamic');
        const mod = await import(/* @vite-ignore */ ngSrc + cacheBust) as { AppModule: unknown };
        if (mod.AppModule) {
          await platformBrowserDynamic().bootstrapModule(mod.AppModule as never, {
            ngZoneEventCoalescing: true,
          });
        }
      } catch (err) {
        console.error('[hot-example] Reset Angular failed:', ngSrc, err);
      }
    }
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
    savePreview(el);
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
      savePreview(el);
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
        if (!(el as any).__reactRoots) (el as any).__reactRoots = [];
        (el as any).__reactRoots.push(root);
        markLoaded(el);
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
      savePreview(el);
      const src     = el.dataset.exampleVue!;
      const htmlSrc = el.dataset.exampleHtml;
      const id      = el.dataset.exampleId;
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
        if (htmlSrc) {
          const htmlLoader = htmlTemplates[htmlSrc];

          if (htmlLoader) {
            container.innerHTML = await htmlLoader() as string;
          }
        }

        const mod = await loader() as { default: any };
        const app = createApp(mod.default);

        app.mount(container);
        markLoaded(el);
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

    const { platformBrowserDynamic } = await import('@angular/platform-browser-dynamic');

    for (const el of ngEls) {
      savePreview(el);
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

setupResetButtons();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runExamples);
} else {
  runExamples();
}
