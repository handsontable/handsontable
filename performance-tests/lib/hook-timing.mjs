/**
 * Hook-to-hook timing -- inject performance.now() listeners on Handsontable hooks
 * to measure the elapsed time between a "before" and "after" hook pair.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Inject timing listeners for a before/after hook pair.
 * Safe to call multiple times -- skips hook registration if already injected.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} beforeHook -- e.g. 'beforeFilter'
 * @param {string} afterHook -- e.g. 'afterFilter'
 */
export async function injectHookTimer(page, beforeHook, afterHook) {
  await page.evaluate(({ beforeHook, afterHook }) => {
    const hot = /** @type {any} */ (window).__hot;
    const key = `${beforeHook}_${afterHook}`;

    window.__hookTimings = window.__hookTimings || {};

    // Prevent duplicate listener registration across iterations
    if (window.__hookTimings[key]?.injected) {
      window.__hookTimings[key].start = null;
      window.__hookTimings[key].end = null;

      return;
    }

    const store = { start: null, end: null, injected: true };

    window.__hookTimings[key] = store;

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

/**
 * Persist collected hook deltas to a JSON file alongside trace data.
 *
 * @param {string} outputDir -- scenario output directory
 * @param {number[]} deltas -- per-iteration delta values (ms)
 */
export async function saveHookTimings(outputDir, deltas) {
  if (deltas.length === 0) {
    return;
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    join(outputDir, 'hook-timing.json'),
    JSON.stringify({ deltas, averageDeltaMs: avgDelta }, null, 2),
    'utf8',
  );
}
