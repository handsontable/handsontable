import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * Undo-stack bookkeeping for ManualRowMove and ManualColumnMove.
 *
 * The undo listener used to record from `beforeRowMove` / `beforeColumnMove`. `Hooks.run` threads a
 * listener's return value into the next listener's first argument, so a veto raised by a listener
 * registered later — which is where a settings hook lands — was invisible there. A cancelled move
 * still reached the undo stack, and the user's next Ctrl+Z was spent undoing nothing.
 *
 * The fixture's data is `R<row+1>C<col+1>` over a 10x10 grid, so cell (0, 0) reads `R1C1`.
 */
const IDENTITY = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

test.describe('row and column move undo bookkeeping', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    await grid.initGrid({ manualRowMove: true, manualColumnMove: true, undo: true });
  });

  test('a vetoed row move records no undo action', async () => {
    expect(await grid.doneActionsCount()).toBe(0);

    await grid.setBeforeRowMoveVeto(true);
    await grid.moveRows([0], 3);

    // The veto really did block the move — without this the stack assertion below proves nothing.
    expect(await grid.rowOrder()).toEqual(IDENTITY);

    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('a vetoed column move records no undo action', async () => {
    expect(await grid.doneActionsCount()).toBe(0);

    await grid.setBeforeColumnMoveVeto(true);
    await grid.moveColumns([0], 3);

    expect(await grid.columnOrder()).toEqual(IDENTITY);

    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('a vetoed row move does not swallow the previous action', async () => {
    await grid.setCellValue(0, 0, 'edited');

    expect(await grid.doneActionsCount()).toBe(1);

    await grid.setBeforeRowMoveVeto(true);
    await grid.moveRows([0], 3);

    // The user-visible symptom: one Ctrl+Z must reach the edit, not a phantom move action.
    await grid.undo();

    expect(await grid.cellValue(0, 0)).toBe('R1C1');
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('a real row move still records one undo action, and undo reverses it', async () => {
    await grid.moveRows([0], 3);

    expect(await grid.rowOrder()).toEqual([1, 2, 3, 0, 4, 5, 6, 7, 8, 9]);
    expect(await grid.doneActionsCount()).toBe(1);

    await grid.undo();

    expect(await grid.rowOrder()).toEqual(IDENTITY);
  });

  test('a real column move still records one undo action, and undo reverses it', async () => {
    await grid.moveColumns([0], 3);

    expect(await grid.columnOrder()).toEqual([1, 2, 3, 0, 4, 5, 6, 7, 8, 9]);
    expect(await grid.doneActionsCount()).toBe(1);

    await grid.undo();

    expect(await grid.columnOrder()).toEqual(IDENTITY);
  });

  test('a row move that leaves the order unchanged records no undo action', async () => {
    await grid.moveRows([0], 0);

    expect(await grid.rowOrder()).toEqual(IDENTITY);
    expect(await grid.doneActionsCount()).toBe(0);
  });

  test('a column move that leaves the order unchanged records no undo action', async () => {
    await grid.moveColumns([0], 0);

    expect(await grid.columnOrder()).toEqual(IDENTITY);
    expect(await grid.doneActionsCount()).toBe(0);
  });

  test('an impossible row move records no undo action', async () => {
    // 10 rows, so a destination of 20 fails `isMovePossible` and nothing is reordered.
    await grid.moveRows([0], 20);

    expect(await grid.rowOrder()).toEqual(IDENTITY);
    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });

  test('a move vetoed by manualColumnFreeze records no undo action', async () => {
    await grid.initGrid({ manualColumnMove: true, manualColumnFreeze: true, undo: true });

    // manualColumnFreeze only guards moves after its own first use. Freezing reorders through the
    // index mapper directly rather than through moveColumns, so it registers no undo action itself.
    await grid.freezeColumn(3);

    const afterFreeze = await grid.columnOrder();

    expect(await grid.doneActionsCount()).toBe(0);

    // Visual column 0 now sits inside the frozen area, so the plugin vetoes moving it. This is a
    // real shipped veto path, not the fixture's test-only toggle.
    await grid.moveColumns([0], 5);

    expect(await grid.columnOrder()).toEqual(afterFreeze);
    expect(await grid.doneActionsCount()).toBe(0);
    expect(await grid.isUndoAvailable()).toBe(false);
  });
});
