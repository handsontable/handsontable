import { test, expect } from '../fixtures/test';
import { AsyncImageFrozenColumnsPage } from '../fixtures/pages/AsyncImageFrozenColumnsPage';

/**
 * DEV-307: a renderer writes an `<img>` into a scrolling column. The image arrives after the draw
 * measured the row, so the master row grows. The frozen overlay has to follow without a manual render.
 */
test.describe('Async image in a scrolling column beside frozen columns', () => {
  test('keeps the frozen overlay rows as tall as the master rows once the images load', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto();

    const heightsBeforeLoad = await grid.rowHeights('master');

    grid.releaseImages();

    // The images make every row taller than its drawn height.
    await expect.poll(async() => (await grid.rowHeights('master'))[5]).toBeGreaterThan(heightsBeforeLoad[5]);

    // Before the fix the frozen overlay kept the drawn heights until the next render.
    await expect.poll(() => grid.rowHeights('clone_inline_start')).toEqual(await grid.rowHeights('master'));
  });

  test('does not redraw in a loop although the renderer recreates its images on every render', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto();
    grid.releaseImages();

    await expect.poll(() => grid.rowHeights('clone_inline_start')).toEqual(await grid.rowHeights('master'));

    const settled = await grid.renderCount();

    // A looping redraw keeps counting through these frames; a settled grid stays put.
    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThan(10);
  });
});
