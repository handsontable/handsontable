/**
 * Hook-to-hook timing -- inject performance.now() listeners on Handsontable hooks
 * to measure the elapsed time between a "before" and "after" hook pair.
 */

/**
 * Inject timing listeners for a before/after hook pair.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} beforeHook -- e.g. 'beforeFilter'
 * @param {string} afterHook -- e.g. 'afterFilter'
 */
export async function injectHookTimer(page, beforeHook, afterHook) {
  await page.evaluate(({ beforeHook, afterHook }) => {
    const hot = /** @type {any} */ (window).__hot;

    window.__hookTimings = window.__hookTimings || {};
    window.__hookTimings[`${beforeHook}_${afterHook}`] = { start: null, end: null };

    const store = window.__hookTimings[`${beforeHook}_${afterHook}`];

    hot.addHook(beforeHook, () => {
      store.start = performance.now();
    });

    hot.addHook(afterHook, () => {
      store.end = performance.now();
    });
  }, { beforeHook, afterHook });
}

/**
 * Retrieve the hook timing delta.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} beforeHook
 * @param {string} afterHook
 * @returns {Promise<{ deltaMs: number | null }>}
 */
export async function getHookTiming(page, beforeHook, afterHook) {
  return page.evaluate(({ beforeHook, afterHook }) => {
    const store = window.__hookTimings?.[`${beforeHook}_${afterHook}`];

    if (!store || store.start == null || store.end == null) {
      return { deltaMs: null };
    }

    return { deltaMs: store.end - store.start };
  }, { beforeHook, afterHook });
}
