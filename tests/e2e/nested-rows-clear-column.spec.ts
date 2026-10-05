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
 * with its value. The fix clears the visible rows as before and writes the hidden rows through the
 * source data, by row object, in the same undo step - nothing is expanded, so validators, listeners,
 * and the selection only ever see the grid the user sees.
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

  test('fires no collapse or expand hook, and reports the hidden rows as source writes', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.clearHookLog();

    await grid.clearColumnViaDropdown('Value');

    // `afterChange` covers the three visible rows, as without Nested Rows. The six hidden rows that
    // are not read-only (all but C1.2) arrive as one source write.
    expect(await grid.hookLog()).toEqual([
      'afterChange:ContextMenu.clearColumn:3',
      'afterSetSourceDataAtCell:ContextMenu.clearColumn:6',
    ]);
  });

  test('clears them on a column with a validator, and adds no rows', async() => {
    await grid.goto('numeric');
    await grid.collapseParents([0, 1]);

    await grid.clearColumnViaDropdown('Value');

    // The validator settles in a microtask, so poll. C1.2 (physical 2, value 3) is read-only.
    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS.map((row, physicalRow) => ({
      ...row,
      value: row.name === 'C1.2' ? physicalRow + 1 : null,
    })));
    expect(await grid.countRows()).toBe(3);
    expect(await grid.collapsedParents()).toEqual([0, 6]);

    await grid.undoWithKeyboard();

    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS.map((row, physicalRow) => ({
      ...row,
      value: physicalRow + 1,
    })));
    expect(await grid.countRows()).toBe(3);
    expect(grid.pageErrors).toEqual([]);
  });

  test('keeps the selection and its focus where the user left them', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.selectColumnByHeader('Value');
    // Enter moves the focus down the selected column, onto P2.
    await grid.page.keyboard.press('Enter');

    const before = await grid.selection();

    expect(before.focus).toEqual({ row: 1, col: 1 });

    await grid.clearHookLog();
    await grid.clearColumnWithCurrentSelection();

    expect(await grid.sourceRows()).toEqual(CLEARED_ROWS);
    expect(await grid.selection()).toEqual(before);
    expect(await grid.hookLog()).not.toContain('afterDeselect');
  });

  test('writes the hidden rows by record when a listener restructures the tree mid-clear', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    // Removing P1 takes its subtree with it and moves C2.1 and C2.2 from physical 7 and 8 to 1 and 2.
    await grid.removeRowOnFirstClear(0);

    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual([
      { name: 'P2', value: null, note: 'n-p2' },
      { name: 'C2.1', value: null, note: 'n-c21' },
      { name: 'C2.2', value: null, note: 'n-c22' },
      { name: 'L3', value: null, note: 'n-l3' },
    ]);
    // P2 is still collapsed, now at physical 0.
    expect(await grid.collapsedParents()).toEqual([0]);
    expect(await grid.countRows()).toBe(2);
    expect(grid.pageErrors).toEqual([]);
  });

  test('ends on the range an API caller hands it when nothing is collapsed', async() => {
    await grid.goto();

    await grid.clearColumnViaApi(1, 1);

    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS.map((row, physicalRow) => ({
      ...row,
      value: physicalRow <= 1 ? null : row.value,
    })));
  });

  test('ends on a header selection the user shrank', async() => {
    await grid.goto();
    await grid.collapseParents([0]);
    await grid.selectColumnByHeader('Value');
    // Shift+PageUp shrinks the column selection to its first row, and keeps it a header selection.
    await grid.page.keyboard.press('Shift+PageUp');

    expect((await grid.selection()).selected).toEqual([[-1, 1, 0, 1]]);

    await grid.clearColumnViaCellContextMenu(0, 1);

    // P1 and the rows it hides are cleared; P2's branch and L3, outside the range, keep their values.
    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS.map((row, physicalRow) => ({
      ...row,
      value: physicalRow <= 5 && row.name !== 'C1.2' ? null : row.value,
    })));
    expect(grid.pageErrors).toEqual([]);
  });

  test('stays enabled while only the hidden rows hold editable cells', async() => {
    await grid.goto();
    // Every visible row's Value is read-only once P1 and P2 are collapsed: P1, P2, L3.
    await grid.makeValueReadOnly([0, 6, 9]);

    // Positive control: with every parent expanded the menu offers the item, through C1.1.
    expect(await grid.isClearColumnDisabledInDropdown('Value')).toBe(false);

    await grid.collapseParents([0, 1]);

    expect(await grid.isClearColumnDisabledInDropdown('Value')).toBe(false);

    await grid.clearColumnViaDropdown('Value');

    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS.map(row => ({
      ...row,
      value: ['P1', 'C1.2', 'P2', 'L3'].includes(row.name) ? row.value : null,
    })));

    // The visible clear changed nothing, yet the hidden write is still one undo step.
    await grid.undoWithKeyboard();

    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS);
    expect(await grid.collapsedParents()).toEqual([0, 6]);

    await grid.redoWithKeyboard();

    await expect.poll(() => grid.sourceRows()).toEqual(INITIAL_ROWS.map(row => ({
      ...row,
      value: ['P1', 'C1.2', 'P2', 'L3'].includes(row.name) ? row.value : null,
    })));
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('is disabled when no cell it would reach is editable', async() => {
    await grid.goto();
    await grid.makeValueReadOnly([0, 1, 3, 4, 5, 6, 7, 8, 9]);
    await grid.collapseParents([0, 1]);

    expect(await grid.isClearColumnDisabledInDropdown('Value')).toBe(true);
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

  test('undoes a listener\'s row removal with the clear, and no earlier edit', async() => {
    await grid.goto('formulas');
    // An earlier edit the undo of the clear must leave alone: L3's value 3 becomes 5.
    await grid.setValueAt(9, 5);
    await grid.collapseParents([0, 1]);

    const beforeClear = await grid.sourceRows();
    const resultsBeforeClear = [10, 110, 120, 130, 1310, 1320, 20, 210, 220, 50];

    expect(await grid.formulaResults()).toEqual(resultsBeforeClear);

    // The listener removes P1 and its subtree while the clear runs, so the formula engine sees a
    // structural change between the visible clear and the hidden writes.
    await grid.removeRowOnFirstClear(0);
    await grid.clearColumnViaDropdown('Value');

    expect(await grid.countRows()).toBe(2);

    await grid.undoWithKeyboard();

    // One undo puts back the clear and the removal together, and stops there.
    await expect.poll(() => grid.sourceRows()).toEqual(beforeClear);
    await expect.poll(() => grid.formulaResults()).toEqual(resultsBeforeClear);
    expect(await grid.collapsedParents()).toEqual([0, 6]);
    await expect(grid.cell(2, 2)).toHaveText('50');
    expect(grid.pageErrors).toEqual([]);
  });

  test('writes the hidden rows even when beforeChange cancels the visible clear', async() => {
    await grid.goto();
    await grid.collapseParents([0, 1]);
    await grid.cancelClearInBeforeChange();

    await grid.clearColumnViaDropdown('Value');

    // Deliberate: the hidden rows are source writes, which `beforeChange` never gates
    // (`nestedRows/AGENTS.md`). The visible rows keep their values; the hidden ones are cleared.
    expect(await grid.sourceRows()).toEqual(INITIAL_ROWS.map(row => ({
      ...row,
      value: ['P1', 'C1.2', 'P2', 'L3'].includes(row.name) ? row.value : null,
    })));
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
