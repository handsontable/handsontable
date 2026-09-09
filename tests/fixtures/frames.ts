import { type Page } from '@playwright/test';

/**
 * Waits for the given number of animation frames INSIDE the page.
 *
 * This is the bounded settle for a negative assertion — "the timer did not fire", "the hook ran
 * once and not again" — and it is only sound beside a positive control that proved the machinery
 * delivers at all. See `tests/AGENTS.md`.
 *
 * Frames, not milliseconds, because the page's own rAF clock is the thing being settled against.
 * At 60fps a frame is ~16.7ms, so 40 frames is roughly 660ms; on a faster display the same count
 * is less wall-clock time, which is why a count has to be chosen with margin over whatever delay
 * it is outlasting.
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
