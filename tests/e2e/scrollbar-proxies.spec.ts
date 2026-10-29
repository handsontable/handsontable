import { test, expect, THEMES_TAG } from '../fixtures/test';
import { type Box, HOLDER_THUMB_RGB, ScrollbarProxiesPage } from '../fixtures/pages/ScrollbarProxiesPage';

/**
 * A grid's classic scrollbars run beside the part of each edge that scrolls: the vertical one starts
 * below the column headers and the frozen top rows and ends above the frozen bottom rows, and the
 * horizontal one runs between the row headers or frozen start columns and the frozen end columns. The
 * rest of each gutter is covered in the track color, and the grid's frame is redrawn over the gutters.
 *
 * Chromium only. Playwright's headless Chromium starts with `--hide-scrollbars`, which forces every
 * gutter to 0 (an overlay scrollbar's layout), so this file drops that flag; the cases that need no
 * gutter hide it with `scrollbar-width: none` instead. Headless Firefox reads every gutter as 0 too,
 * which is why the file carries no engine tag.
 */
test.use({
  launchOptions: {
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
});

/**
 * Asserts that two edges meet, to within the pixel the browser may round either one by.
 *
 * @param {number} actual The edge measured.
 * @param {number} expected The edge it should meet.
 * @param {string} what What the edge is, for the failure message.
 */
function expectEdge(actual: number, expected: number, what: string): void {
  expect(Math.abs(actual - expected), `${what}: ${actual} against ${expected}`).toBeLessThanOrEqual(1);
}

/**
 * The total length of boxes laid end to end along one axis.
 *
 * @param {Box[]} boxes The boxes.
 * @param {'width' | 'height'} size Which side to add up.
 * @returns {number}
 */
function totalLength(boxes: Box[], size: 'width' | 'height'): number {
  return boxes.reduce((sum, box) => sum + box[size], 0);
}

test.describe('scrollbars beside the scrolling area', { tag: THEMES_TAG }, () => {
  test('start below the column headers and after the row headers', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both' });

    const { gutters, client, vertical, horizontal, fillers, clones } = await grid.layout();

    // Without a classic gutter there is nothing to move, and every check below would pass on nothing.
    expect(gutters.vertical).toBeGreaterThan(0);
    expect(gutters.horizontal).toBeGreaterThan(0);
    expect(vertical).not.toBeNull();
    expect(horizontal).not.toBeNull();
    expect(clones.top).not.toBeNull();
    expect(clones.inlineStart).not.toBeNull();

    expectEdge(vertical!.left, client.right, 'vertical bar start');
    expectEdge(vertical!.width, gutters.vertical, 'vertical bar width');
    expectEdge(vertical!.top, clones.top!.bottom, 'vertical bar top');
    expectEdge(vertical!.bottom, client.bottom, 'vertical bar bottom');

    expectEdge(horizontal!.top, client.bottom, 'horizontal bar top');
    expectEdge(horizontal!.height, gutters.horizontal, 'horizontal bar height');
    expectEdge(horizontal!.left, clones.inlineStart!.right, 'horizontal bar start');
    expectEdge(horizontal!.right, client.right, 'horizontal bar end');

    // The strip beside the column headers and the one under the row headers are covered.
    expect(fillers.vertical).toHaveLength(1);
    expectEdge(fillers.vertical[0].top, client.top, 'filler above the vertical bar, top');
    expectEdge(fillers.vertical[0].bottom, vertical!.top, 'filler above the vertical bar, bottom');
    expect(fillers.horizontal).toHaveLength(1);
    expectEdge(fillers.horizontal[0].left, client.left, 'filler before the horizontal bar, start');
    expectEdge(fillers.horizontal[0].right, horizontal!.left, 'filler before the horizontal bar, end');
    expect(fillers.stray).toEqual([]);
  });

  test('stop at the frozen bands on all four sides', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 2, fb: 1, fs: 1, fe: 1 });

    const { gutters, client, vertical, horizontal, fillers, clones } = await grid.layout();

    expect(gutters.vertical).toBeGreaterThan(0);
    expect(gutters.horizontal).toBeGreaterThan(0);
    expect(clones.bottom).not.toBeNull();
    expect(clones.inlineEnd).not.toBeNull();

    expectEdge(vertical!.top, clones.top!.bottom, 'vertical bar top');
    expectEdge(vertical!.bottom, clones.bottom!.top, 'vertical bar bottom');
    expectEdge(horizontal!.left, clones.inlineStart!.right, 'horizontal bar start');
    expectEdge(horizontal!.right, clones.inlineEnd!.left, 'horizontal bar end');

    // A filler on each side of each bar, and together they cover the gutter edge to edge.
    expect(fillers.vertical).toHaveLength(2);
    expect(fillers.horizontal).toHaveLength(2);
    expect(fillers.stray).toEqual([]);
    expectEdge(totalLength([vertical!, ...fillers.vertical], 'height'), client.height, 'vertical gutter covered');
    expectEdge(totalLength([horizontal!, ...fillers.horizontal], 'width'), client.width, 'horizontal gutter covered');
  });

  test('mirror the inline edges in RTL', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', dir: 'rtl', ft: 1, fb: 1, fs: 1, fe: 1 });

    const { holder, gutters, client, vertical, horizontal, fillers, clones } = await grid.layout();

    expect(gutters.vertical).toBeGreaterThan(0);
    expect(gutters.horizontal).toBeGreaterThan(0);

    // The vertical bar is on the left, and the frozen start columns are on the right.
    expectEdge(vertical!.left, holder.left, 'vertical bar start');
    expectEdge(vertical!.right, client.left, 'vertical bar end');
    expectEdge(vertical!.top, clones.top!.bottom, 'vertical bar top');
    expectEdge(vertical!.bottom, clones.bottom!.top, 'vertical bar bottom');
    expectEdge(horizontal!.left, clones.inlineEnd!.right, 'horizontal bar left');
    expectEdge(horizontal!.right, clones.inlineStart!.left, 'horizontal bar right');

    expect(fillers.vertical).toHaveLength(2);
    expect(fillers.horizontal).toHaveLength(2);
    expect(fillers.stray).toEqual([]);
    expectEdge(totalLength([horizontal!, ...fillers.horizontal], 'width'), client.width, 'horizontal gutter covered');
  });

  test('leave a grid with no headers and no frozen bands its own scrollbars', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'none' });

    const owners = await grid.scrollOwners();
    const classes = (await grid.addedElements()).map(element => element.className);

    expect(owners.gutters.vertical).toBeGreaterThan(0);
    expect(owners.holderScrolls).toBe(true);
    // The holder's own bars run the whole edge, and only the frame is drawn over them.
    expect(classes).toEqual(['htScrollbarFrame']);
  });

  test('add nothing when the holder reserves no gutter', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fb: 1, fs: 1, fe: 1, gutter: 'none' });

    const owners = await grid.scrollOwners();

    // The holder still scrolls both axes, but its scrollbars take no space, as overlay scrollbars.
    expect(owners.gutters).toEqual({ vertical: 0, horizontal: 0 });
    expect(owners.holderScrolls).toBe(true);
    expect(await grid.addedElements()).toEqual([]);
  });

  test('add nothing to a grid the window scrolls', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1, mode: 'window' });

    const owners = await grid.scrollOwners();

    expect(owners.pageScrolls).toBe(true);
    expect(owners.gutters).toEqual({ vertical: 0, horizontal: 0 });
    expect(await grid.addedElements()).toEqual([]);
  });

  test('give each bar the holder\'s scroll range, also after rows are added', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });

    const before = await grid.scrollRanges();

    expect(before.holderVertical).toBeGreaterThan(0);
    expect(before.holderHorizontal).toBeGreaterThan(0);
    expectEdge(before.proxyVertical!, before.holderVertical, 'vertical range');
    expectEdge(before.proxyHorizontal!, before.holderHorizontal, 'horizontal range');

    await grid.appendRows(300);

    await expect.poll(async() => {
      const after = await grid.scrollRanges();

      return after.holderVertical > before.holderVertical
        && Math.abs(after.proxyVertical! - after.holderVertical) <= 1;
    }, { message: 'the vertical bar takes the longer range' }).toBe(true);
  });

  test('follow a scroll of the grid', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });
    await grid.scrollHolderTo({ top: 600, left: 400 });

    const state = await grid.scrollState();

    expect(state.holderTop).toBe(600);
    expect(state.holderLeft).toBe(400);
    expectEdge(state.proxyTop!, state.holderTop, 'vertical bar offset');
    expectEdge(state.proxyLeft!, state.holderLeft, 'horizontal bar offset');
  });

  test('scroll the grid when a bar is scrolled', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });
    await grid.scrollProxyTo('vertical', 600);
    await grid.scrollProxyTo('horizontal', 400);

    await expect.poll(async() => {
      const state = await grid.scrollState();

      return {
        holderTop: Math.round(state.holderTop),
        holderLeft: Math.round(state.holderLeft),
        rowsMoved: state.firstRenderedRow > 1,
        columnsMoved: state.firstRenderedColumn > 1,
      };
    }).toEqual({ holderTop: 600, holderLeft: 400, rowsMoved: true, columnsMoved: true });
  });

  test('scroll the grid when the wheel turns over a bar', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });
    await grid.wheelOverProxy('vertical', 400);

    await expect.poll(async() => {
      const state = await grid.scrollState();

      return state.holderTop > 0 && state.firstRenderedRow > 1 && Math.abs(state.proxyTop! - state.holderTop) <= 1;
    }, { message: 'the grid and the bar scrolled together' }).toBe(true);
  });

  test('drag a bar\'s thumb without moving it from script, and keep the selection', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });
    await grid.selectCell(3, 3);
    await grid.startCountingProxyWrites();

    // The positive control: a scroll of the grid is copied into the bar, so the counter sees writes.
    await grid.scrollHolderToVerticalMiddle();
    await expect.poll(() => grid.proxyWrites()).toBeGreaterThan(0);
    await grid.resetProxyWrites();

    const start = await grid.scrollState();
    const thumb = await grid.proxyCenter('vertical');

    expectEdge(start.proxyTop!, start.holderTop, 'bar offset before the drag');

    await page.mouse.move(thumb.x, thumb.y);
    await page.mouse.down();
    await page.mouse.move(thumb.x, thumb.y + 40, { steps: 5 });

    await expect.poll(async() => (await grid.scrollState()).holderTop, { message: 'the drag scrolled the grid' })
      .toBeGreaterThan(start.holderTop + 100);
    await expect.poll(() => grid.isScrollbarDragActive(), { message: 'the press counts as a scrollbar drag' })
      .toBe(true);

    const dragged = await grid.scrollState();

    expect(dragged.firstRenderedRow).toBeGreaterThan(start.firstRenderedRow);

    // A thumb follows the pointer back to where it was pressed; a press on the track would not. The thumb
    // sits on whole pixels, so it lands within one pointer pixel's worth of scroll of the start. Waiting
    // for the offset to hold still also lets the last pointer move land before the grid scrolls below:
    // a thumb move that lands after that is the user's, and moves the grid back.
    const scrollPerPointerPixel = (dragged.holderTop - start.holderTop) / 40;

    await page.mouse.move(thumb.x, thumb.y, { steps: 5 });
    await expect.poll(async() => {
      const { holderTop, settled } = await grid.settledScrollTop();

      return settled && Math.abs(holderTop - start.holderTop) <= scrollPerPointerPixel;
    }, { message: 'the thumb came back with the pointer and stayed' }).toBe(true);

    // The grid scrolls itself while the thumb is held (an API call, a resize). Copied into the bar, that
    // offset would pull the thumb out from under the pointer. Halfway from the dragged offset to the end
    // of the range: far from the thumb, and never clamped.
    const movedByGrid = Math.round((dragged.holderTop + (await grid.scrollRanges()).holderVertical) / 2);

    await grid.scrollHolderTo({ top: movedByGrid });

    // Nothing but the user moved the bar while it was held.
    expect(await grid.proxyWrites()).toBe(0);

    await page.mouse.up();
    await expect.poll(() => grid.isScrollbarDragActive()).toBe(false);
    // On release the bar takes the offset the grid moved to.
    await expect.poll(async() => {
      const state = await grid.scrollState();

      return Math.abs(state.holderTop - movedByGrid) <= 1 && Math.abs(state.proxyTop! - state.holderTop) <= 1;
    }, { message: 'the bar and the grid agree after the drag' }).toBe(true);

    expect(await grid.selectionState()).toEqual({ selected: [3, 3, 3, 3], listening: true });

    await page.keyboard.press('ArrowDown');
    await expect.poll(async() => (await grid.selectionState()).selected).toEqual([4, 3, 4, 3]);
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    test(`redraw the grid's frame over the gutters (${dir})`, async({ page, theme, bundle }) => {
      const grid = new ScrollbarProxiesPage(page, theme, bundle);

      await grid.goto({ headers: 'both', ft: 1, fs: 1, dir });

      const frame = await grid.frame();

      expect(frame).not.toBeNull();
      expectEdge(frame!.frame.left, frame!.holder.left, 'frame left');
      expectEdge(frame!.frame.top, frame!.holder.top, 'frame top');
      expectEdge(frame!.frame.width, frame!.holder.width, 'frame width');
      expectEdge(frame!.frame.height, frame!.holder.height, 'frame height');
      expect(frame!.clipPath).toBe(frame!.expectedClipPath);
      expect(frame!.boxShadow).toContain('inset');
      expect(frame!.borderRadius).toBe(frame!.holderBorderRadius);
      // The bars under it stay usable.
      expect(frame!.pointerEvents).toBe('none');
    });
  }

  test('cover the grid\'s own bar where a page widened it alone', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', host: 'holder' });
    // The holder's own thumb sits in the middle of its track, beside the proxy.
    await grid.scrollHolderToVerticalMiddle();

    const widths = await grid.verticalBarWidths();

    // The page rule took effect on the holder only: its gutter is wider than the proxy's own bar.
    expect(widths.gutter).toBe(30);
    expect(widths.proxyBar).toBeGreaterThan(0);
    expect(widths.proxyBar).toBeLessThan(widths.gutter);

    const pixels = await grid.pixelsInVerticalProxy(HOLDER_THUMB_RGB);

    expect(pixels.total).toBeGreaterThan(0);
    expect(pixels.matching).toBe(0);
  });

  test('let the pointer reach the bars, the covered strips and the gutter corner', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fs: 1 });

    const { gutters, client, vertical, horizontal, fillers } = await grid.layout();
    const center = (box: Box) => ({ x: box.left + (box.width / 2), y: box.top + (box.height / 2) });
    const corner = { x: client.right + (gutters.vertical / 2), y: client.bottom + (gutters.horizontal / 2) };
    const classes = await grid.classNamesAt([
      center(vertical!),
      center(horizontal!),
      center(fillers.vertical[0]),
      center(fillers.horizontal[0]),
      corner,
    ]);

    expect(classes).toEqual([
      'htScrollbarProxy htScrollbarProxy-vertical',
      'htScrollbarProxy htScrollbarProxy-horizontal',
      'htScrollbarProxyFiller',
      'htScrollbarProxyFiller',
      'wtHolder',
    ]);
  });

  test('hide the added elements from assistive technology and the tab order', async({ page, theme, bundle }) => {
    const grid = new ScrollbarProxiesPage(page, theme, bundle);

    await grid.goto({ headers: 'both', ft: 1, fb: 1, fs: 1, fe: 1 });

    const added = await grid.addedElements();

    expect(added.map(element => element.className).sort()).toEqual([
      'htScrollbarFrame',
      'htScrollbarProxy htScrollbarProxy-horizontal',
      'htScrollbarProxy htScrollbarProxy-vertical',
      'htScrollbarProxyFiller',
      'htScrollbarProxyFiller',
      'htScrollbarProxyFiller',
      'htScrollbarProxyFiller',
    ]);
    added.forEach(element => expect(element.ariaHidden, element.className).toBe('true'));
    // An empty scroll container is a tab stop in Chromium 127+ unless it says otherwise.
    added.filter(element => element.className.startsWith('htScrollbarProxy '))
      .forEach(element => expect(element.tabindex, element.className).toBe('-1'));
  });
});
