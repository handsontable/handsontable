import { test, expect, CROSS_BROWSER_TAG, THEMES_TAG } from '../fixtures/test';
import { ManualResizeUndoPage, type ResizeAxisName } from '../fixtures/pages/ManualResizeUndoPage';

/**
 * DEV-511. Ctrl+Z after a header drag restores the row or column, and the resize handle sits on
 * that header's far edge. The pointer is parked before the shortcut so a mouseover cannot move the
 * handle onto whatever the drag left under the cursor.
 */
test.describe('resize handle after undo', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  let grid: ManualResizeUndoPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualResizeUndoPage(page, theme, bundle);
    await grid.goto();
  });

  test('Ctrl+Z after a row header resize restores the row and the handle', async () => {
    await undoDrag(grid, 'row', false);
  });

  test('Ctrl+Z after a column header resize restores the column and the handle', async () => {
    await undoDrag(grid, 'column', false);
  });

  test('a row handle follows the header when Ctrl+Z undoes a resize after a cell click', async () => {
    await undoDrag(grid, 'row', true);
  });

  test('a column handle follows the header when Ctrl+Z undoes a resize after a cell click', async () => {
    await undoDrag(grid, 'column', true);
  });
});

async function undoDrag(
  grid: ManualResizeUndoPage, axis: ResizeAxisName, clickCellFirst: boolean
): Promise<void> {
  if (axis === 'row') {
    await grid.moveThirdRowBelowFifth();
  } else {
    await grid.moveThirdColumnBelowFifth();
  }

  if (clickCellFirst) {
    await grid.clickFirstCell();
  }

  const before = await grid.measureHandleEdge(axis, 3);

  if (axis === 'row') {
    await grid.dragRowHandle(3, 40);
  } else {
    await grid.dragColumnHandle(3, 40);
  }

  const dragged = await grid.measureHandleEdge(axis, 3);

  expect(dragged.size).toBeGreaterThan(before.size + 20);

  await grid.parkPointer();
  await grid.undoWithKeyboard();

  const after = await grid.measureHandleEdge(axis, 3);
  const measured = JSON.stringify({ before, dragged, after });

  expect(Math.abs(after.size - before.size), measured).toBeLessThanOrEqual(1);
  expect(after.gap, measured).not.toBeNull();
  expect(Math.abs(after.gap ?? 0), measured).toBeLessThanOrEqual(2);
}
