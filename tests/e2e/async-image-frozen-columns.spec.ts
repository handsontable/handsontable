import { test, expect, THEMES_TAG } from '../fixtures/test';
import { AsyncImageFrozenColumnsPage } from '../fixtures/pages/AsyncImageFrozenColumnsPage';

/**
 * DEV-307: a renderer writes an `<img>` into a scrolling column. The image arrives after the draw
 * measured the row, so the master row grows. The frozen overlay has to follow without a manual render,
 * and a renderer that recreates its images on every render must not keep the grid redrawing.
 */
test.describe('Async image in a scrolling column beside frozen columns', { tag: THEMES_TAG }, () => {
  const grownBy = (height: number, row: number) => height >= 60 + row * 10;

  /**
   * Asserts that the image of every rendered row has arrived, that the grid has stopped drawing, and that
   * it drew at most once per batch (animation frame) of arriving images. A redraw loop fails one of the two checks: either it is still
   * counting through the 60 frames, or the redraw budget ended it (up to 31 draws) with redraws that
   * brought no new image, so they outnumber the batches. The batches are counted rather than assumed,
   * because on a busy machine the image responses spread over more frames.
   */
  const expectSettledInOneDrawPerBatch = async(grid: AsyncImageFrozenColumnsPage) => {
    // A redraw can detach an image before its `load` is dispatched, and its source then arrives with the
    // cached copy a task later, after the rows have already grown. A row that grew out of the rendered band
    // takes its image with it, and an image that is not in the grid cannot make it redraw.
    await expect.poll(() => grid.imagesYetToArrive()).toBe(0);

    const stats = await grid.drawStats();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(stats.draws);
    // The grid draws once before any image arrives, in every variant.
    expect(stats.drawsBeforeContent, JSON.stringify(stats)).toBe(1);
    expect(stats.draws - 1, JSON.stringify(stats)).toBeLessThanOrEqual(stats.contentBatches);
  };

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

    await expectSettledInOneDrawPerBatch(grid);
  });

  test('settles without column headers when a short image makes the first row 1px taller', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&headers=0&small=1');
    grid.releaseImages();

    // The 4px images fit their rows, and the first row's extra pixel is its top border, drawn before any
    // image arrives. No row changes height, so no arrival may redraw: a height check that miscounted that
    // pixel would redraw on every arrival.
    await expect.poll(() => grid.contentArrivals()).toBe(6);
    await grid.waitForFrames(30);

    const { draws, drawsBeforeContent } = await grid.drawStats();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(draws);
    expect(draws).toBe(drawsBeforeContent);
    expect(await grid.overlaysMatchMaster()).toBe(true);
  });

  test('settles when a short image sits in a frozen column of a grid without column headers', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    // The frozen clone has no header row, and its first body row must still measure like the master's.
    await grid.goto('&headers=0&small=1&col=0');
    grid.releaseImages();

    // The 4px images fit their rows, and the first row's extra pixel is its top border, drawn before any
    // image arrives. No row changes height, so no arrival may redraw: a height check that miscounted that
    // pixel would redraw on every arrival.
    await expect.poll(() => grid.contentArrivals()).toBe(6);
    await grid.waitForFrames(30);

    const { draws, drawsBeforeContent } = await grid.drawStats();

    await grid.waitForFrames(60);

    expect(await grid.renderCount()).toBe(draws);
    expect(draws).toBe(drawsBeforeContent);
    expect(await grid.overlaysMatchMaster()).toBe(true);
  });

  test('aligns and settles with autoRowSize enabled', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&auto=1');
    grid.releaseImages();

    await expect.poll(async() => (await grid.rowHeights()).master.every(grownBy)
      && await grid.overlaysMatchMaster()).toBe(true);

    await expectSettledInOneDrawPerBatch(grid);
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

  test('bounds the redraws of a renderer that recreates a failing image on every render', async({
    page, theme, bundle,
  }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&broken=1');
    grid.releaseImages();

    // Each redraw recreates the failing image, which draws pending (short) and then fires `error` and grows
    // the row again, so this renderer never settles. The per-row budget is what ends it: 6 rows at 5
    // redraws each, plus the first draw. Each redraw waits for a response, so how long the loop runs depends
    // on the machine: wait until the count holds still rather than for a fixed number of frames. A loop the
    // budget does not end never holds still. Alignment is not asserted: the renderer undoes it on every draw.
    await expect.poll(() => grid.drawsHoldStill(60)).toBe(true);

    expect(await grid.renderCount()).toBeLessThanOrEqual(31);
  });

  test('aligns the overlays when the renderer keeps a failing image', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&broken=1&reuse=1');
    grid.releaseImages();

    // The failed image keeps its grown size across the redraw, so the overlays can end aligned.
    await expect.poll(async() => (await grid.rowHeights()).master.every(height => height > 60)
      && await grid.overlaysMatchMaster()).toBe(true);

    await expectSettledInOneDrawPerBatch(grid);
  });

  test('draws once per batch when failing images arrive in separate frames', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&broken=1&reuse=1');
    // The first two rows are rendered whatever the theme makes the others, so their images cannot fail unseen.
    grid.releaseImages({ holdBack: ['missing-0.svg', 'missing-1.svg'] });

    // Each held image is let through only after the redraw for the images before it, so the images arrive in
    // at least three batches however fast the machine is.
    await expect.poll(() => grid.contentArrivals()).toBe(4);
    await grid.waitForFrames(2);
    grid.releaseHeldImage('missing-0.svg');
    await expect.poll(() => grid.contentArrivals()).toBe(5);
    await grid.waitForFrames(2);
    grid.releaseHeldImage('missing-1.svg');

    await expect.poll(async() => (await grid.rowHeights()).master.every(height => height > 60)
      && await grid.overlaysMatchMaster()).toBe(true);

    const { draws, contentBatches } = await grid.drawStats();

    // Each batch grows a row, so each one redraws: more draws than a fixed ceiling of 3 allowed.
    expect(contentBatches).toBeGreaterThanOrEqual(3);
    expect(draws).toBeGreaterThan(3);
    await expectSettledInOneDrawPerBatch(grid);
  });

  test('aligns rows scrolled in later when every row shares one failing URL', async({ page, theme, bundle }) => {
    const grid = new AsyncImageFrozenColumnsPage(page, theme, bundle);

    await grid.goto('&shared=1&reuse=1&rows=60');
    grid.releaseImages();

    await expect.poll(async() => (await grid.rowHeights()).master.every(height => height > 60)
      && await grid.overlaysMatchMaster()).toBe(true);

    // One response fails the image of every rendered row at once, so all their rows share one redraw.
    await expectSettledInOneDrawPerBatch(grid);

    await grid.scrollToRow(40);

    // The rows rendered now all load the URL that already failed above.
    await expect.poll(async() => Number(await grid.firstRowHeader()) > 10).toBe(true);
    await expect.poll(async() => (await grid.rowHeights()).master.every(height => height > 60)
      && await grid.overlaysMatchMaster()).toBe(true);
  });
});
