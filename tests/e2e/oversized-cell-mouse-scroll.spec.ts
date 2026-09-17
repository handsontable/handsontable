import { test, expect } from '../fixtures/test';
import { OversizedCellMouseScrollPage } from '../fixtures/pages/OversizedCellMouseScrollPage';

/**
 * DEV-1159: mouse-selecting a cell larger than the viewport must start-snap
 * so the clipped start moves into view. Overlay `scrollTo` already start-snaps
 * for keyboard/API; this spec is the mouse path. Native `scrollIntoView` can
 * leave a header-sized remainder, so the assertion is "scrolled well toward
 * the start", not an exact 0.
 *
 * Playwright's locator click would scroll the cell into view first and hide
 * the bug, so the page object clicks the already-visible intersection.
 *
 * `scrollIntoView` is counted with a pre-construction prototype wrap (see
 * `EditorPreventCloseElementPage.startUnlistenCounter()`). Last-partial skip
 * must not call it: `scrollIntoView({ block: 'nearest' })` undoes the skipped
 * axis through the holder.
 */
test.describe('oversized cell mouse scroll', () => {
  let grid: OversizedCellMouseScrollPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new OversizedCellMouseScrollPage(page, theme, bundle);
    await grid.goto();
  });

  test('mouse-selecting an oversized column start-snaps the clipped start into view', async () => {
    await grid.scrollUntilCellStartClipped(200, 0, 0, 0);

    const clippedLeft = (await grid.holderScroll()).left;

    expect(clippedLeft).toBeGreaterThan(0);

    await grid.startScrollIntoViewCounter();
    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => {
      const { left, top, scrollIntoViewCount, scrollIntoViewLastArgs } = await grid.mouseScrollOutcome();

      return {
        left,
        top,
        leftSnapped: left < clippedLeft / 2,
        scrollIntoViewCount,
        scrollIntoViewLastArgs,
      };
    }).toEqual(expect.objectContaining({
      leftSnapped: true,
      scrollIntoViewCount: 1,
      scrollIntoViewLastArgs: { block: 'nearest', inline: 'nearest' },
    }));
  });

  test('mouse-selecting an oversized row start-snaps the clipped start into view', async () => {
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const clippedTop = (await grid.holderScroll()).top;

    expect(clippedTop).toBeGreaterThan(0);

    await grid.startScrollIntoViewCounter();
    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => {
      const { left, top, scrollIntoViewCount, scrollIntoViewLastArgs } = await grid.mouseScrollOutcome();

      return {
        left,
        top,
        topSnapped: top < clippedTop / 2,
        scrollIntoViewCount,
        scrollIntoViewLastArgs,
      };
    }).toEqual(expect.objectContaining({
      topSnapped: true,
      scrollIntoViewCount: 1,
      scrollIntoViewLastArgs: { block: 'nearest', inline: 'nearest' },
    }));
  });

  test('last-partial row skip stays when only the column is oversized', async () => {
    await grid.goto('oversized-col');
    // A default last-partial sliver sits in the overlay scrollbar. Scroll a
    // bit so the last-partial row has a clickable strip above the bar.
    await grid.scrollUntilCellStartClipped(200, 20, 0, 0);

    const lastPartialRow = await grid.lastPartiallyVisibleRow();
    const before = await grid.holderScroll();

    expect(lastPartialRow).toBeGreaterThan(0);
    expect(before.left).toBeGreaterThan(0);

    await grid.startScrollIntoViewCounter();
    await grid.clickCellByEvent(lastPartialRow, 0);

    await expect.poll(async () => await grid.selectedCell()).toEqual([
      lastPartialRow,
      0,
      lastPartialRow,
      0,
    ]);
    // Horizontal start-snap can shift scrollTop by a couple of pixels
    // (scrollbar coupling). A dropped row skip would snap this last-partial
    // row to the start (hundreds of pixels). `scrollIntoView` on the cell
    // would undo the skipped axis through the holder.
    await expect.poll(async () => {
      const { left, top, scrollIntoViewCount } = await grid.mouseScrollOutcome();

      return {
        left,
        top,
        leftSnapped: left < before.left / 2,
        topStable: top < before.top + 15,
        scrollIntoViewCount,
      };
    }).toEqual(expect.objectContaining({
      leftSnapped: true,
      topStable: true,
      scrollIntoViewCount: 0,
    }));
  });

  test('last-partial column skip stays when only the row is oversized', async () => {
    await grid.goto('oversized-row');
    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const lastPartialCol = await grid.lastPartiallyVisibleColumn();
    const before = await grid.holderScroll();

    expect(lastPartialCol).toBeGreaterThan(0);
    expect(before.top).toBeGreaterThan(0);

    await grid.startScrollIntoViewCounter();
    await grid.clickCellByEvent(0, lastPartialCol);

    await expect.poll(async () => {
      const { left, top, scrollIntoViewCount } = await grid.mouseScrollOutcome();

      return {
        left,
        top,
        topSnapped: top < before.top / 2,
        leftUnmoved: left === before.left,
        scrollIntoViewCount,
      };
    }).toEqual(expect.objectContaining({
      topSnapped: true,
      leftUnmoved: true,
      scrollIntoViewCount: 0,
    }));
  });

  test('mouse-selecting a content-tall row without rowHeights start-snaps the clipped start', async () => {
    await grid.goto('content-tall');

    expect(await grid.settingsRowHeight(0)).toBeUndefined();

    await grid.scrollUntilCellStartClipped(0, 150, 0, 0);

    const clippedTop = (await grid.holderScroll()).top;

    expect(clippedTop).toBeGreaterThan(0);

    await grid.startScrollIntoViewCounter();
    await grid.clickVisiblePart(0, 0);

    await expect.poll(async () => {
      const { left, top, scrollIntoViewCount, scrollIntoViewLastArgs } = await grid.mouseScrollOutcome();

      return {
        left,
        top,
        topSnapped: top < clippedTop / 2,
        scrollIntoViewCount,
        scrollIntoViewLastArgs,
      };
    }).toEqual(expect.objectContaining({
      topSnapped: true,
      scrollIntoViewCount: 1,
      scrollIntoViewLastArgs: { block: 'nearest', inline: 'nearest' },
    }));
  });
});
