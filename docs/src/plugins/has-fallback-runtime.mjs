/**
 * Client runtime for the `replace-has-selectors` Astro integration.
 *
 * The build-time transform rewrites static `:has()` selectors to
 * `.ht-nohas-<hash>` classes and serves a manifest as CSS custom properties on
 * `:root` (`--ht-nohas-<hash>: "<original selector>"`). This script reads that
 * manifest and stamps the classes onto the elements the original selector
 * matches, using `querySelectorAll` - which, unlike a stylesheet `:has()`
 * rule, registers no style-invalidation hooks in the browser.
 *
 * Restamping runs on page load and after DOM mutations (rAF-debounced).
 * Mutations inside a Handsontable grid (`.ht-root-wrapper`) are ignored: the
 * grid mutates on scroll/resize and never contains stamped elements.
 */
(() => {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }

  const PROPERTY_PREFIX = '--ht-nohas-';
  const GRID_SELECTOR = '.ht-root-wrapper';
  let observer = null;
  let scheduled = false;

  /**
   * Reads the stamped-class manifest out of the loaded stylesheets.
   *
   * @returns {Map<string, string>} className -> original selector.
   */
  const collectManifest = () => {
    const manifest = new Map();
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.style) {
          for (const property of rule.style) {
            if (property.startsWith(PROPERTY_PREFIX)) {
              let value = rule.style.getPropertyValue(property).trim();

              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/\\(["\\])/g, '$1');
              }

              manifest.set(`ht-nohas-${property.slice(PROPERTY_PREFIX.length)}`, value);
            }
          }
        }

        if (rule.cssRules && rule.cssRules.length > 0) {
          walk(rule.cssRules);
        }
      }
    };

    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules);
      } catch (error) {
        // cross-origin sheet - not ours, skip
      }
    }

    return manifest;
  };

  const startObserver = () => {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  };

  /**
   * Applies every manifest entry: adds the class to current matches, removes it
   * from elements that no longer match. The observer is paused while stamping
   * so our own class writes do not re-trigger it.
   */
  const stamp = () => {
    if (observer) {
      observer.disconnect();
    }

    for (const [className, selector] of collectManifest()) {
      let matches;

      try {
        matches = document.querySelectorAll(selector);
      } catch (error) {
        continue;
      }

      const matchSet = new Set(matches);

      for (const element of matches) {
        element.classList.add(className);
      }

      for (const element of document.querySelectorAll(`.${className}`)) {
        if (!matchSet.has(element)) {
          element.classList.remove(className);
        }
      }
    }

    if (observer) {
      startObserver();
    }
  };

  const schedule = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      stamp();
    });
  };

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      let element = mutation.target;

      if (element.nodeType !== Node.ELEMENT_NODE) {
        element = element.parentElement;
      }

      if (element && element.closest && element.closest(GRID_SELECTOR)) {
        continue;
      }

      schedule();

      return;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', stamp, { once: true });
  } else {
    stamp();
  }

  window.addEventListener('load', schedule);
  document.addEventListener('astro:page-load', schedule);
  startObserver();
})();
