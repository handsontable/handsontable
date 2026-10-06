import { test, expect } from '../fixtures/test';
import { AsyncImageFrozenColumnsPage } from '../fixtures/pages/AsyncImageFrozenColumnsPage';

/**
 * DEV-307: a renderer writes an `<img>` into a scrolling column. The image arrives after the draw
 * measured the row, so the master row grows. The frozen overlay has to follow without a manual render,
 * and a renderer that recreates its images on every render must not keep the grid redrawing.
 */
test.describe('Async image in a scrolling column beside frozen columns', () => {
  const grownBy = (height: number, row: number) => height >= 60 + row * 10;

  test('keeps the frozen overlay rows as tall as the master rows once the images load', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto();
    grid.releaseImages();

    // Every image has loaded once each master row is at least as tall as its image.
    await expect.poll(async() => (await grid.rowHeights()).master.every(grownBy)).toBe(true);

    // Before the fix the frozen overlay kept the drawn heights until the next render. Master and
    // overlay are compared inside one read, so the check cannot straddle a layout change.
    await expect.poll(() => grid.overlaysMatchMaster()).toBe(true);
  });

  test('does not redraw in a loop although the renderer recreates its images on every render', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto();
    grid.releaseImages();

    await expect.poll(async() => (await grid.rowHeights()).master.every(grownBy)
      && await grid.overlaysMatchMaster()).toBe(true);

    const settled = await grid.renderCount();

    // A looping redraw keeps counting through these frames; a settled grid stays put. The draw plus one
    // redraw is the whole cost: the redraw budget alone would let a loop reach 31 draws.
    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(3);
  });

  test('settles without column headers when a short image makes the first row 1px taller', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&headers=0&small=1');
    grid.releaseImages();

    await grid.waitForFrames(30);

    const settled = await grid.renderCount();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(2);
    expect(await grid.overlaysMatchMaster()).toBe(true);
  });

  test('settles when a short image sits in a frozen column of a grid without column headers', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    // The frozen clone has no header row, and its first body row must still measure like the master's.
    await grid.goto('&headers=0&small=1&col=0');
    grid.releaseImages();

    await grid.waitForFrames(30);

    const settled = await grid.renderCount();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(2);
    expect(await grid.overlaysMatchMaster()).toBe(true);
  });

  test('aligns and settles with autoRowSize enabled', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&auto=1');
    grid.releaseImages();

    await expect.poll(async() => (await grid.rowHeights()).master.every(grownBy)
      && await grid.overlaysMatchMaster()).toBe(true);

    const settled = await grid.renderCount();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(3);
  });

  test('aligns the frozen end overlay when the image sits in a column frozen at the end', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&end=1');
    grid.releaseImages();

    await expect.poll(async() => (await grid.rowHeights()).master.every(grownBy)
      && await grid.overlaysMatchMaster()).toBe(true);
  });

  test('stops redrawing for images that fail on every render', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&broken=1');
    grid.releaseImages();

    // Each redraw recreates the failing image, which fires `error` again. A source that failed once is
    // not asked about again, so each of the 6 failing URLs costs one redraw: 7 draws with the first one.
    // The per-row budget alone would let this reach 31.
    await grid.waitForFrames(120);

    const settled = await grid.renderCount();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(7);
  });
});
