import { test, expect, CROSS_BROWSER_TAG, THEMES_TAG } from '../fixtures/test';
import { ManualRowMoveHiddenGapPage } from '../fixtures/pages/ManualRowMoveHiddenGapPage';

/**
 * One visible gap between two rows that holds hidden rows has two drop indexes: the lower half of the row
 * above the block and the upper half of the row below it. Both must put the moved row on the same side of
 * the hidden block, so the order users see after showing the rows does not depend on where in the gap the
 * pointer was released.
 */
test.describe('a row dragged into a gap that holds hidden rows', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  let grid: ManualRowMoveHiddenGapPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualRowMoveHiddenGapPage(page, theme, bundle);
    await grid.goto();
  });

  test('lands after the hidden block when dropped on the lower half of the row above it', async() => {
    // Rendered rows are the physical rows 0, 1, 4, 5: rendered 1 is the row above the hidden block.
    await grid.dragRowHeader(0, 1, 'lower');

    // The hooks report the resolved drop: the next visible row (4), not the first hidden row (2).
    await expect.poll(() => grid.latestMove()).toMatchObject({
      movePossible: true,
      orderChanged: true,
      dropIndex: 4,
      finalIndex: 3,
    });
    expect(await grid.rowSequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });

  test('lands after the hidden block when dropped on the upper half of the row below it', async() => {
    await grid.dragRowHeader(0, 2, 'upper');

    await expect.poll(() => grid.latestMove()).toMatchObject({
      movePossible: true,
      orderChanged: true,
      dropIndex: 4,
      finalIndex: 3,
    });
    expect(await grid.rowSequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });

  test('leaves the row in place when it is dragged up to the lower half of the row above the hidden block', async() => {
    // Rendered row 2 is the physical row 4. The drop resolves to right before the row itself, so nothing moves.
    await grid.dragRowHeader(2, 1, 'lower');

    await expect.poll(() => grid.latestMove()).toMatchObject({
      movePossible: true,
      orderChanged: false,
      dropIndex: 4,
    });
    expect(await grid.rowSequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('leaves the row in place when it is released on its own lower half', async() => {
    // Rendered row 1 is the physical row 1, with the hidden block right below it.
    await grid.dragRowHeader(1, 1, 'lower');

    await expect.poll(() => grid.latestMove()).toMatchObject({ movePossible: true, orderChanged: false });
    expect(await grid.rowSequence()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  test('shows the order of all rows after the hidden rows are shown, for a drop on the lower half', async() => {
    await grid.dragRowHeader(0, 1, 'lower');
    await expect.poll(() => grid.latestMove()).toMatchObject({ orderChanged: true });
    await grid.showHiddenRows();

    await expect(grid.firstColumnTexts()).toHaveText(['r1c0', 'r2c0', 'r3c0', 'r0c0', 'r4c0', 'r5c0']);
  });

  test('keeps a drop onto the lower half of the last visible row before the hidden rows that end the grid', async() => {
    await grid.page.evaluate(() => {
      const hot = (window as any).hot;

      hot.getPlugin('hiddenRows').showRows([2, 3]);
      hot.getPlugin('hiddenRows').hideRows([4, 5]);
      hot.render();
    });

    // Visible rows are now the physical rows 0, 1, 2, 3, and the hidden ones end the grid.
    await grid.dragRowHeader(0, 3, 'lower');

    await expect.poll(() => grid.latestMove()).toMatchObject({ movePossible: true, orderChanged: true });
    expect(await grid.rowSequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });
});

/**
 * The column plugin steps over hidden columns when it resolves a drop, so both sides of a gap that holds
 * hidden columns already give one physical order. This pins that, so the row rule above stays the mirror of it.
 */
test.describe('a column dragged into a gap that holds hidden columns', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  let grid: ManualRowMoveHiddenGapPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualRowMoveHiddenGapPage(page, theme, bundle);
    await grid.goto();
  });

  test('lands after the hidden block when dropped on the right half of the column before it', async() => {
    // Rendered columns are the physical columns 0, 1, 4, 5: rendered 1 is the column before the hidden block.
    await grid.dragColumnHeader(0, 1, 'right');

    await expect.poll(() => grid.columnSequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });

  test('lands after the hidden block when dropped on the left half of the column after it', async() => {
    await grid.dragColumnHeader(0, 2, 'left');

    await expect.poll(() => grid.columnSequence()).toEqual([1, 2, 3, 0, 4, 5]);
  });
});
