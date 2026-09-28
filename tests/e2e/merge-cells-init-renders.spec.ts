import { test, expect } from '../fixtures/test';
import { MergeCellsInitRendersPage } from '../fixtures/pages/MergeCellsInitRendersPage';

/**
 * Issue #5687: enabling `mergeCells` made the grid draw itself two extra times while it
 * initialized. Both extra draws came from the plugin's `afterInit` handler - the write that clears
 * the cells a merge covers rendered on its own, and the handler then rendered again - so a grid
 * with merge areas ran every cell renderer three times before the user saw anything.
 *
 * The grid is 10x10 with no headers, so one full draw is exactly 100 `afterRenderer` calls and the
 * draw count is readable straight off the cell count.
 */
const CELLS_PER_DRAW = 100;

test.describe('`mergeCells` does not cost extra draws while the grid initializes', () => {
  test('a grid without `mergeCells` draws once', async({ page, theme, bundle }) => {
    const grid = new MergeCellsInitRendersPage(page, theme, bundle, 'none');

    await grid.goto();

    const snapshot = await grid.afterConstruct();

    expect(snapshot.afterRender).toBe(1);
    expect(snapshot.afterRenderer).toBe(CELLS_PER_DRAW);
    expect(snapshot.spannedCells).toBe(0);
  });

  test('an enabled plugin with no declared area costs no extra draw', async({ page, theme, bundle }) => {
    const grid = new MergeCellsInitRendersPage(page, theme, bundle, 'enabled');

    await grid.goto();

    const snapshot = await grid.afterConstruct();

    // Nothing to merge, so the initial draw already showed the final grid. Drawing again here
    // repainted an identical table.
    expect(snapshot.afterRender).toBe(1);
    expect(snapshot.afterRenderer).toBe(CELLS_PER_DRAW);
    expect(snapshot.spannedCells).toBe(0);
  });

  test('declared merge areas cost exactly one extra draw, and are applied by it',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsInitRendersPage(page, theme, bundle, 'areas');

      await grid.goto();

      const snapshot = await grid.afterConstruct();

      // One draw for the grid itself, one for the merges - which cannot be folded into the first,
      // because `afterInit` only runs once the grid has already been drawn.
      expect(snapshot.afterRender).toBe(2);
      expect(snapshot.afterRenderer).toBe(2 * CELLS_PER_DRAW);
      // The second draw is the one that applies them, so the merges are on screen by the time the
      // constructor returns.
      expect(snapshot.spannedCells).toBe(2);

      await expect(grid.cell(1, 1)).toHaveAttribute('rowspan', '2');
      await expect(grid.cell(1, 1)).toHaveAttribute('colspan', '2');
      await expect(grid.cell(5, 3)).toHaveAttribute('rowspan', '3');
    });

  test('the object form of the setting costs the same one extra draw', async({ page, theme, bundle }) => {
    const grid = new MergeCellsInitRendersPage(page, theme, bundle, 'object-form');

    await grid.goto();

    const snapshot = await grid.afterConstruct();

    // `mergeCells: { cells: [...] }` reaches the init guard through a different `getSetting()`
    // branch than the array form above, so it gets its own case rather than being assumed equal.
    expect(snapshot.afterRender).toBe(2);
    expect(snapshot.afterRenderer).toBe(2 * CELLS_PER_DRAW);
    expect(snapshot.spannedCells).toBe(2);

    await expect(grid.cell(1, 1)).toHaveAttribute('rowspan', '2');
  });

  test('merges still apply synchronously when the clearing write validates asynchronously',
    async({ page, theme, bundle }) => {
      const grid = new MergeCellsInitRendersPage(page, theme, bundle, 'async-validator');

      await grid.goto();

      // An async validator defers the merge-clearing write past the end of `afterInit`, which
      // swaps which of the plugin's two init draws applies the merges. Whichever one it is, the
      // grid must be merged by the time the constructor returns - never merged only once
      // validation resolves. The draw count is deliberately not asserted here: the deferred write
      // brings its own draw, and how many that ends up being is not a promise this makes.
      const snapshot = await grid.afterConstruct();

      expect(snapshot.spannedCells).toBe(2);

      await expect(grid.cell(1, 1)).toHaveAttribute('rowspan', '2');

      // And the deferred write must not undo them. Wait for the draw it brings with it before
      // looking - polling the span count on its own would resolve on the first sample, which is
      // the state already asserted above, and would stay green if that write unmerged the grid.
      await expect.poll(async() => (await grid.renderCounts()).afterRender)
        .toBeGreaterThan(snapshot.afterRender);

      expect(await grid.spannedCells()).toBe(2);
    });
});
