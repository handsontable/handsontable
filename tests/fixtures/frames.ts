import { type Page } from '@playwright/test';

/**
 * Waits until at least `ms` of wall-clock time has passed INSIDE the page, pumped by animation
 * frames rather than by a timer.
 *
 * This is the bounded settle to use when the thing being outlasted is a `setTimeout`, because a
 * `setTimeout` is measured in milliseconds and a frame count is not: 40 frames is ~667ms at 60Hz
 * but only ~278ms at 144Hz, so a count chosen against a 60Hz display silently stops covering the
 * delay on a faster one. Use `afterAnimationFrames` only when the wait really is about rendering.
 *
 * Like every bounded settle it is sound only beside a positive control that proved the machinery
 * delivers at all. See `tests/AGENTS.md`.
 *
 * @param {Page} page The Playwright page.
 * @param {number} ms Minimum milliseconds to wait for.
 */
export async function afterAtLeast(page: Page, ms: number): Promise<void> {
  await page.evaluate(duration => new Promise<void>((resolve) => {
    const start = performance.now();
    const step = () => {
      if (performance.now() - start >= duration) {
        resolve();

        return;
      }
      requestAnimationFrame(step);
    };

    step();
  }), ms);
}

/**
 * Waits for the given number of animation frames INSIDE the page.
 *
 * Use this only when the wait is genuinely about rendering — "two frames for the browser to
 * recompute `:hover`". To outlast a millisecond delay, use `afterAtLeast` instead; see the note
 * on refresh rates there.
 *
 * @param {Page} page The Playwright page.
 * @param {number} count How many frames to wait.
 */
export async function afterAnimationFrames(page: Page, count: number): Promise<void> {
  await page.evaluate(frames => new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();

        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };

    step(frames);
  }), count);
}
