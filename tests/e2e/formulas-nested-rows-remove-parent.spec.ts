import { test, expect } from '../fixtures/test';
import { FormulasNestedRowsRemoveParentPage } from '../fixtures/pages/FormulasNestedRowsRemoveParentPage';

/**
 * DEV-3092: removing a nested parent row must remove its whole subtree from HyperFormula, not
 * only the parent. Formulas' `beforeRemoveRow` listener (priority 260) used to read the removed
 * physical rows before NestedRows' (priority 300) expanded that list into the parent's whole
 * subtree, so the engine call was built from the un-expanded list while the grid removed every
 * descendant. The engine was then left holding rows the grid no longer showed, and a formula below
 * the removed subtree resolved against the wrong row because the two disagreed on how far
 * everything shifted. NestedRows now expands the list first (`orderIndex: -1`).
 *
 * Every case asserts the engine's serialized sheet (leftover descendants would show up there),
 * the grid's own row count against that same sheet height (never `getSheetDimensions()` - it does
 * not shrink, see `formulas/AGENTS.md`), and the formula's computed value, which reads `x!` only
 * when the engine and the grid agree on how many rows moved.
 */

const ORIGINAL_SHEET = [
  ['Root A'],
  ['A-1'],
  ['A-1-a'],
  ['A-2'],
  ['Root B'],
  ['B-1'],
  ['x'],
  ['=A7 & "!"'],
];

/**
 * Asserts the engine's sheet, the grid's row count against it, and the formula's computed value.
 *
 * @param {FormulasNestedRowsRemoveParentPage} grid The page object.
 * @param {unknown[][]} sheet The expected serialized sheet.
 * @param {number} formulaRow The visual row the formula now sits on, to read its computed value.
 */
async function expectSheet(
  grid: FormulasNestedRowsRemoveParentPage, sheet: unknown[][], formulaRow: number
): Promise<void> {
  await expect.poll(() => grid.sheetContent()).toEqual(sheet);
  await expect.poll(() => grid.countRows()).toBe(sheet.length);
  await expect.poll(() => grid.sheetHeight()).toBe(sheet.length);
  await expect.poll(() => grid.dataAtCell(formulaRow, 0)).toBe('x!');
}

test.describe('Formulas across a nested parent removal', () => {
  let grid: FormulasNestedRowsRemoveParentPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasNestedRowsRemoveParentPage(page, theme, bundle);
  });

  test('removing a three-level parent removes every descendant from the engine', async() => {
    await grid.goto();

    // `Root A` owns a child (`A-1`) that owns a child of its own (`A-1-a`), plus a second, leaf
    // child (`A-2`) - the walk has to reach past the direct children on one branch while stopping
    // at a leaf on the other. `Root B` and its own child survive untouched.
    await grid.removeRow(0);

    await expectSheet(grid, [
      ['Root B'],
      ['B-1'],
      ['x'],
      ['=A3 & "!"'],
    ], 3);
  });

  test('removing a parent whose child is collapsed removes the collapsed descendants too', async() => {
    await grid.goto();

    // Collapsing `A-1` trims `A-1-a` out of the visual space entirely - it has no visual index at
    // all. The removal still has to reach it, or it survives in the engine as a row nobody can see.
    await grid.collapseParent(1);
    await expect.poll(() => grid.countRows()).toBe(7);

    await grid.removeRow(0);

    await expectSheet(grid, [
      ['Root B'],
      ['B-1'],
      ['x'],
      ['=A3 & "!"'],
    ], 3);
  });

  test('removing two collapsed parents in one call expands both subtrees', async() => {
    await grid.goto();

    // Collapsing BOTH roots first means the range `removeRow(0, 2)` names only the two parents
    // themselves - their descendants have no visual index at all for a wider range to sweep up on
    // its own. NestedRows has to expand past both of them, not just the first one a call spanning a
    // wider, uncollapsed range would already cover.
    await grid.collapseParent(0);
    await expect.poll(() => grid.countRows()).toBe(5);

    await grid.collapseParent(1);
    await expect.poll(() => grid.countRows()).toBe(4);

    await grid.removeRow(0, 2);

    await expectSheet(grid, [
      ['x'],
      ['=A1 & "!"'],
    ], 1);
  });

  test('re-registering NestedRows through updateSettings() keeps a host beforeRemoveRow in step', async() => {
    await grid.goto();

    // A React re-render resends `nestedRows: true`, which runs NestedRows' `updatePlugin()` -
    // `disablePlugin()` clears its hooks and `enablePlugin()` re-adds them. The host's own
    // `beforeRemoveRow` (declared in the constructor settings, never touched by that cycle) has to
    // keep seeing the expanded list afterwards, not just on the grid's very first construction.
    await grid.reenableNestedRows();

    await grid.removeRow(0);

    // Asserted first: the host's own physical rows are what pins the `updatePlugin()` round trip
    // specifically. The sheet check below already fails without the fix on every case in this file,
    // so it cannot alone tell this test apart from the others - the host log is the one thing here
    // that only breaks once the re-registration moves NestedRows' listener behind it.
    const hostLog = await grid.hostBeforeRemoveRowLog();

    expect(hostLog).toHaveLength(1);
    expect([...hostLog[0]].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);

    await expectSheet(grid, [
      ['Root B'],
      ['B-1'],
      ['x'],
      ['=A3 & "!"'],
    ], 3);
  });

  test('undo then redo keeps the engine in step with the restored and re-removed subtree', async() => {
    await grid.goto();

    await grid.removeRow(0);
    await expectSheet(grid, [
      ['Root B'],
      ['B-1'],
      ['x'],
      ['=A3 & "!"'],
    ], 3);

    await grid.undo();
    await expectSheet(grid, ORIGINAL_SHEET, 7);

    await grid.redo();
    await expectSheet(grid, [
      ['Root B'],
      ['B-1'],
      ['x'],
      ['=A3 & "!"'],
    ], 3);
  });
});
