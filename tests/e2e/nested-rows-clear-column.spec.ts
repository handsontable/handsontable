import { test, expect } from '../fixtures/test';
import { NestedRowsClearColumnPage, type SourceRow } from '../fixtures/pages/NestedRowsClearColumnPage';

const INITIAL_ROWS: SourceRow[] = [
  { name: 'P1', value: 'p1', note: 'n-p1' },
  { name: 'C1.1', value: 'c11', note: 'n-c11' },
  { name: 'C1.2', value: 'c12', note: 'n-c12' },
  { name: 'C1.3', value: 'c13', note: 'n-c13' },
  { name: 'G1.3.1', value: 'g131', note: 'n-g131' },
  { name: 'G1.3.2', value: 'g132', note: 'n-g132' },
  { name: 'P2', value: 'p2', note: 'n-p2' },
  { name: 'C2.1', value: 'c21', note: 'n-c21' },
  { name: 'C2.2', value: 'c22', note: 'n-c22' },
  { name: 'L3', value: 'l3', note: 'n-l3' },
];

// C1.2's value is read-only, so "Clear column" keeps it - on screen or trimmed alike.
const CLEARED_ROWS: SourceRow[] = INITIAL_ROWS.map(row => ({
  ...row,
  value: row.name === 'C1.2' ? 'c12' : null,
}));

/**
 * DEV-150: a collapsed Nested Rows parent trims its descendants out of the grid, so "Clear column"
 * from the column dropdown - which walks the visual rows of the column - left every collapsed child
 * with its value. The fix expands the collapsed parents for the duration of the command.
 */
test.describe('Clear column with collapsed nested rows', () => {
  let grid: NestedRowsClearColumnPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new NestedRowsClearColumnPage(page, theme, bundle);
  });

  test('clears the rows of collapsed parents, at every depth', async() => {
    await grid.goto();
    // C1.3 first, so a parent collapsed inside another collapsed parent is part of the state.
    // After P1 collapses, P2 sits at visual row 1.
    await grid.collapseParents([3, 0, 1]);

    expect(await grid.collapsedParents()).toEqual([0, 3, 6]);
    expect(await grid.countRows()).toBe(3);

    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    // The command put the collapse back exactly as the user left it.
    expect(await grid.collapsedParents()).toEqual([0, 3, 6]);
    expect(await grid.countRows()).toBe(3);

    // And the grid repainted that state: the three visible rows, cleared, with both parents still
    // offering to expand.
    await expect(grid.cell(0, 0)).toHaveText('P1');
    await expect(grid.cell(1, 0)).toHaveText('P2');
    await expect(grid.cell(2, 0)).toHaveText('L3');
    await expect(grid.cell(0, 1)).toHaveText('');
    await expect(grid.cell(1, 1)).toHaveText('');
    await expect(grid.cell(2, 1)).toHaveText('');
    await expect(grid.cell(0, 2)).toHaveText('n-p1');
    await expect(grid.expandButton(0)).toBeVisible();
    await expect(grid.expandButton(1)).toBeVisible();

    await grid.expandAll();

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    await expect(grid.collapseButton(0)).toBeVisible();
    await expect(grid.cell(1, 1)).toHaveText('');
    await expect(grid.cell(2, 1)).toHaveText('c12');
    await expect(grid.cell(4, 0)).toHaveText('G1.3.1');
    await expect(grid.cell(4, 1)).toHaveText('');
    expect(grid.pageErrors).toEqual([]);
  });

  test('clears them after the column was moved, as in the original report', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.moveColumn(1, 2);

    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    expect(grid.pageErrors).toEqual([]);
  });

  test('clears them from the context menu too', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);

    await grid.clearColumnViaContextMenu('Value');

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('clears them through executeCommand() before the menu was ever opened', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);

    await grid.clearColumnViaApi(1);

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('fires no collapse or expand hook, and one afterChange for every row', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.clearHookLog();

    await grid.clearColumnViaDropdown('Value');

    // Ten rows, one of them read-only. Without the fix the change covered the three visible rows.
    expect(await grid.hookLog()).toEqual(['afterChange:ContextMenu.clearColumn:9']);
  });

  test('undo and redo reach every row while the parents stay collapsed', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);

    await grid.undoWithKeyboard();

    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    await expect(grid.cell(0, 1)).toHaveText('p1');

    // Redo replays the trimmed rows through the source data rather than the grid.
    await grid.redoWithKeyboard();

    await expect.poll(() => grid.sourceRows()).toEqual(CLEARED_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    await expect(grid.cell(0, 1)).toHaveText('');

    await grid.undoWithKeyboard();
    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS);

    await grid.expandAll();

    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS);
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the formula engine in step with every cleared row', async() => {
    await grid.goto('formulas');
    await grid.collapseParents([0, 1]);

    // `note` holds `=B<n>*10` on every row.
    expect(await grid.formulaResults()).toEqual([10, 110, 120, 130, 1310, 1320, 20, 210, 220, 30]);

    await grid.clearColumnViaDropdown('Value');

    // C1.2's value is read-only, so its formula keeps reading 12.
    expect(await grid.formulaResults()).toEqual([0, 0, 120, 0, 0, 0, 0, 0, 0, 0]);
    await expect(grid.cell(0, 2)).toHaveText('0');

    await grid.undoWithKeyboard();

    await expect.poll(() => grid.formulaResults()).toEqual([10, 110, 120, 130, 1310, 1320, 20, 210, 220, 30]);
    await expect(grid.cell(0, 2)).toHaveText('10');
    expect(grid.pageErrors).toEqual([]);
  });

  test('leaves a user callback under the same key on the collapsed grid', async() => {
    await grid.goto('custom');
    await grid.collapseParents([0, 1]);

    await grid.clearColumnViaDropdown('Value');

    // The callback saw the three visible rows: nothing was expanded under it.
    expect(await grid.customClearCalls()).toEqual([3]);
    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
  });

  test('still skips the rows TrimRows trims', async() => {
    await grid.goto('trim');

    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual([
      { name: 'R0', value: null, note: 'n-r0' },
      { name: 'R1', value: 'r1', note: 'n-r1' },
      { name: 'R2', value: 'r2', note: 'n-r2' },
      { name: 'R3', value: null, note: 'n-r3' },
    ]);
  });

  test('still ends on the range an API caller hands it without Nested Rows', async() => {
    await grid.goto('trim');

    // Visual row 0 is R0 and visual row 1 is R3, because R1 and R2 are trimmed.
    await grid.clearColumnViaApi(1, 0);

    expect(await grid.sourceRows()).toEqual([
      { name: 'R0', value: null, note: 'n-r0' },
      { name: 'R1', value: 'r1', note: 'n-r1' },
      { name: 'R2', value: 'r2', note: 'n-r2' },
      { name: 'R3', value: 'r3', note: 'n-r3' },
    ]);
  });
});
