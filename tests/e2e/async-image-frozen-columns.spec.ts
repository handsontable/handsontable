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
    grid.releaseImages();

    // Every image has loaded once each master row is at least as tall as its image.
    await expect.poll(async() => (await grid.rowHeights()).master.every((height, row) => height >= 60 + row * 10))
      .toBe(true);

    // Before the fix the frozen overlay kept the drawn heights until the next render. Master and
    // overlay are compared inside one read, so the check cannot straddle a layout change.
    await expect.poll(async() => {
      const { master, frozen } = await grid.rowHeights();

      return master.join() === frozen.join();
    }).toBe(true);
  });

  test('does not redraw in a loop although the renderer recreates its images on every render', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto();
    grid.releaseImages();

    await expect.poll(async() => {
      const { master, frozen } = await grid.rowHeights();

      return master.every((height, row) => height >= 60 + row * 10) && master.join() === frozen.join();
    }).toBe(true);

    const settled = await grid.renderCount();

    // A looping redraw keeps counting through these frames; a settled grid stays put.
    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
  });
});
