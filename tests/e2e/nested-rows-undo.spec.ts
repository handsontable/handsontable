import { test, expect } from '../fixtures/test';
import { NestedRowsUndoPage } from '../fixtures/pages/NestedRowsUndoPage';

const EXPECTED_NAMES = [
  'Leaf 0',
  'Leaf 1',
  'Leaf 2',
  'Leaf 3',
  'Leaf 4',
  'Leaf 5',
  'Leaf 6',
  'Leaf 7',
  'Leaf 8',
  'Leaf 9',
  'Leaf 10',
  'Leaf 11',
  'Leaf 12',
  'Parent 13',
  'Child 13',
  'Grandchild 13',
  'After 13',
];

/**
 * DEV-30: removing a nested parent through the context menu and undoing with Cmd/Ctrl+Z must
 * restore the complete source subtree, not only the flat parent row.
 */
test('undo restores a removed nested parent and its descendants', async({ page, theme, bundle }) => {
  const nestedRows = new NestedRowsUndoPage(page, theme, bundle);

  await nestedRows.goto();
  expect(await nestedRows.visibleNames()).toEqual(EXPECTED_NAMES);

  await nestedRows.removeRowViaContextMenu(13);

  const removedState = await nestedRows.state();
  expect(removedState.sourceData).toEqual([
    { name: 'Leaf 0' },
    { name: 'Leaf 1' },
    { name: 'Leaf 2' },
    { name: 'Leaf 3' },
    { name: 'Leaf 4' },
    { name: 'Leaf 5' },
    { name: 'Leaf 6' },
    { name: 'Leaf 7' },
    { name: 'Leaf 8' },
    { name: 'Leaf 9' },
    { name: 'Leaf 10' },
    { name: 'Leaf 11' },
    { name: 'Leaf 12' },
    { name: 'After 13' },
  ]);

  await nestedRows.undoWithKeyboard();

  const restoredState = await nestedRows.state();

  // The assertions below cover the complete restoration contract, including the raw nested tree
  // and the physical row index sequence.
  expect(restoredState.error).toBeUndefined();
  expect(restoredState.countRows).toBe(EXPECTED_NAMES.length);
  expect(restoredState.visibleNames).toEqual(EXPECTED_NAMES);
  expect(restoredState.cellMeta).toEqual(['parent-meta', 'child-meta', 'grandchild-meta']);
  expect(restoredState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    {
      name: 'Parent 13',
      __children: [{
        name: 'Child 13',
        __children: [{ name: 'Grandchild 13' }],
      }],
    },
    { name: 'After 13' },
  ]);
  expect(restoredState.rowIndexesSequence).toEqual(EXPECTED_NAMES.map((_, index) => index));
  expect(await nestedRows.removeLog()).toEqual([
    {
      hook: 'beforeRemoveRow',
      index: 13,
      amount: 1,
      physicalRows: [13, 14, 15],
      source: 'ContextMenu.removeRow',
    },
    {
      hook: 'afterRemoveRow',
      index: 13,
      amount: 3,
      physicalRows: [13, 14, 15],
      source: 'ContextMenu.removeRow',
    },
  ]);
  expect(nestedRows.pageErrors).toEqual([]);

  await nestedRows.redo();

  const redoneState = await nestedRows.state();

  expect(redoneState.countRows).toBe(14);
  expect(redoneState.visibleNames).toEqual(EXPECTED_NAMES.filter((_, index) => index !== 13 &&
    index !== 14 && index !== 15));
  expect(redoneState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    { name: 'After 13' },
  ]);
});

test('undo after a context-menu removal keeps the highlight on the restored parent', async({
  page, theme, bundle,
}) => {
  const nestedRows = new NestedRowsUndoPage(page, theme, bundle);

  await nestedRows.goto();
  await nestedRows.removeRowViaContextMenu(13);
  await nestedRows.undoViaPlugin();

  expect(await nestedRows.selectedRow()).toBe(13);
  expect(await nestedRows.visibleNames()).toEqual(EXPECTED_NAMES);
});

/**
 * DEV-138: NestedRows emits a remove/create hook pair for one detach gesture. Ctrl/Cmd+Z must put
 * the child subtree back under its parent in one step; Ctrl/Cmd+Shift+Z must detach it again.
 */
test('undoes and redoes a context-menu child detach as one action', async({ page, theme, bundle }) => {
  const nestedRows = new NestedRowsUndoPage(page, theme, bundle);

  await nestedRows.goto();
  await nestedRows.detachFromParentViaContextMenu(14);

  expect(await nestedRows.undoAction()).toMatchObject({ actionType: 'nested_rows_detach' });
  expect(await nestedRows.visibleNames()).toEqual([
    ...EXPECTED_NAMES.slice(0, 14),
    'After 13',
    'Child 13',
    'Grandchild 13',
  ]);

  await nestedRows.undoWithKeyboard();

  const restoredState = await nestedRows.state();

  expect(restoredState.countRows).toBe(EXPECTED_NAMES.length);
  expect(restoredState.visibleNames).toEqual(EXPECTED_NAMES);
  expect(restoredState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    {
      name: 'Parent 13',
      __children: [{
        name: 'Child 13',
        __children: [{ name: 'Grandchild 13' }],
      }],
    },
    { name: 'After 13' },
  ]);

  await expect.poll(() => page.evaluate(() => ({
    doneActions: window.hot.getPlugin('undoRedo').doneActions.length,
    undoneActions: window.hot.getPlugin('undoRedo').undoneActions.length,
  }))).toEqual({ doneActions: 0, undoneActions: 1 });

  await nestedRows.redoWithKeyboard();

  await expect.poll(() => page.evaluate(() => ({
    doneActions: window.hot.getPlugin('undoRedo').doneActions.length,
    undoneActions: window.hot.getPlugin('undoRedo').undoneActions.length,
  }))).toEqual({ doneActions: 1, undoneActions: 0 });

  const redoneState = await nestedRows.state();

  expect(redoneState.countRows).toBe(EXPECTED_NAMES.length);
  expect(redoneState.visibleNames).toEqual([
    ...EXPECTED_NAMES.slice(0, 14),
    'After 13',
    'Child 13',
    'Grandchild 13',
  ]);
  expect(redoneState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    { name: 'Parent 13', __children: [] },
    { name: 'After 13' },
    {
      name: 'Child 13',
      __children: [{ name: 'Grandchild 13' }],
    },
  ]);
  expect(nestedRows.pageErrors).toEqual([]);
});

/**
 * DEV-3967: inserting a child into a parent below the top level must change that parent only. The
 * fixture's nested parent (`Child 13`, row 14) sits at a flattened row that is also a valid top-level
 * position, which is where the insert used to copy its `__children` to the last top-level row.
 */
test('inserting a child into a nested parent leaves the other rows alone, and undo restores the grid', async({
  page, theme, bundle,
}) => {
  const nestedRows = new NestedRowsUndoPage(page, theme, bundle);

  await nestedRows.goto();
  await nestedRows.addChildAtIndex(14, 0, 'NEW');

  const insertedState = await nestedRows.state();

  expect(insertedState.error).toBeUndefined();
  expect(insertedState.visibleNames).toEqual([
    ...EXPECTED_NAMES.slice(0, 15),
    'NEW',
    ...EXPECTED_NAMES.slice(15),
  ]);
  expect(insertedState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    {
      name: 'Parent 13',
      __children: [{
        name: 'Child 13',
        __children: [{ name: 'NEW' }, { name: 'Grandchild 13' }],
      }],
    },
    { name: 'After 13' },
  ]);

  await nestedRows.undoViaPlugin();

  const undoneState = await nestedRows.state();

  expect(undoneState.countRows).toBe(EXPECTED_NAMES.length);
  expect(undoneState.visibleNames).toEqual(EXPECTED_NAMES);
  expect(undoneState.sourceData).toEqual([
    ...Array.from({ length: 13 }, (_, index) => ({ name: `Leaf ${index}` })),
    {
      name: 'Parent 13',
      __children: [{
        name: 'Child 13',
        __children: [{ name: 'Grandchild 13' }],
      }],
    },
    { name: 'After 13' },
  ]);
  expect(nestedRows.pageErrors).toEqual([]);
});

/**
 * DEV-3967: "Insert row above" on the only child of a nested parent reaches `addChildAtIndex()` through
 * `addSibling()`, so the context menu must not touch any other row's children either.
 */
test('inserting a row above a grandchild leaves the last top-level row alone, and undo restores the grid', async({
  page, theme, bundle,
}) => {
  const nestedRows = new NestedRowsUndoPage(page, theme, bundle);

  await nestedRows.goto();
  await nestedRows.insertRowAboveViaContextMenu(15);

  const insertedState = await nestedRows.state();

  expect(insertedState.error).toBeUndefined();
  expect(insertedState.countRows).toBe(EXPECTED_NAMES.length + 1);
  expect(insertedState.sourceData?.at(-1)).toEqual({ name: 'After 13' });
  expect(insertedState.sourceData?.at(-2)).toMatchObject({
    name: 'Parent 13',
    __children: [{
      name: 'Child 13',
      __children: [{ name: null }, { name: 'Grandchild 13' }],
    }],
  });

  await nestedRows.undoViaPlugin();

  const undoneState = await nestedRows.state();

  expect(undoneState.countRows).toBe(EXPECTED_NAMES.length);
  expect(undoneState.visibleNames).toEqual(EXPECTED_NAMES);
  expect(undoneState.sourceData?.at(-1)).toEqual({ name: 'After 13' });
  expect(nestedRows.pageErrors).toEqual([]);
});
