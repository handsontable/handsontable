import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasNestedRowsDetachPage } from '../fixtures/pages/FormulasNestedRowsDetachPage';

const BEFORE_DETACH = [[1, 2], [2, 6], [3, 6], [4, 8]];
const AFTER_DETACH = [[1, 2], [3, 6], [4, 8], [2, 6]];
const SHEET_AFTER_DETACH = [[1, 2], [3, '=A2*2'], [4, '=A3*2'], [2, 6]];
const HOST_DATA_AFTER_DETACH = [
  { a: 1, b: 2, __children: [] },
  { a: 3, b: '=A2*2' },
  { a: 4, b: '=A3*2' },
  { a: 2, b: 6 },
];

test.describe('Formulas across a nested row detach', { tag: BUNDLES_TAG }, () => {
  let grid: FormulasNestedRowsDetachPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasNestedRowsDetachPage(page, theme, bundle);
    await grid.goto();
  });

  test('redo of a context-menu detach shows the values the detach showed', async() => {
    await grid.detachFromParentViaContextMenu(1);

    await expect.poll(() => grid.data()).toEqual(AFTER_DETACH);

    await grid.undoWithKeyboard();

    await expect.poll(() => grid.stacks()).toEqual({ done: 0, undone: 1 });
    await expect.poll(() => grid.data()).toEqual(BEFORE_DETACH);
    await expect.poll(() => grid.sheetContent()).toEqual([[1, 2], [2, 6], [3, '=A3*2'], [4, '=A4*2']]);

    await grid.redoWithKeyboard();

    await expect.poll(() => grid.stacks()).toEqual({ done: 1, undone: 0 });
    await expect.poll(() => grid.data()).toEqual(AFTER_DETACH);
    await expect.poll(() => grid.sheetContent()).toEqual(SHEET_AFTER_DETACH);
    await expect.poll(() => grid.hostData()).toEqual(HOST_DATA_AFTER_DETACH);
  });

  test('a settings update after a detach keeps the values', async() => {
    await grid.detachFromParentViaContextMenu(1);

    await expect.poll(() => grid.hostData()).toEqual(HOST_DATA_AFTER_DETACH);

    await grid.updateSettings();

    await expect.poll(() => grid.data()).toEqual(AFTER_DETACH);
    await expect.poll(() => grid.sheetContent()).toEqual(SHEET_AFTER_DETACH);
  });
});
