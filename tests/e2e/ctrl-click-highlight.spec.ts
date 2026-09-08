import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * Ctrl/Cmd+click on a cell that is already part of a `multiple` selection.
 *
 * Two intents share the gesture, and telling them apart is the whole point:
 *
 *   - the clicked cell does NOT hold the highlight -> move the highlight onto it, keep it selected;
 *   - the clicked cell DOES hold the highlight     -> deselect it (the feature from #9594).
 *
 * Handsontable used to remove every copy of the clicked cell's layer in both cases. The cell the
 * user just clicked therefore stopped being selected, and the highlight fell back to whichever
 * layer happened to remain - reading, to the user, as the highlight jumping to a cell they clicked
 * one step earlier (DEV-2761, reported against 16.0.0 through 18.1.0).
 *
 * Every test asserts BOTH halves: where the highlight ended up AND how many layers survived. The
 * highlight alone passes while a layer is silently dropped, and the layer count alone passes while
 * the highlight sits on the wrong cell - neither pins the defect on its own.
 *
 * `moveCells` and `selectionHandles` are off: both put grab bands on the selection border, and a
 * click near a selected cell's edge would land on those instead of the cell.
 */
test.describe('Ctrl+click inside a multiple selection', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
    // The client's configuration. `disableVisualSelection: 'area'` hides the area highlight, which
    // is what made the focus the only visible marker in the original report.
    await grid.initGrid({
      selectionMode: 'multiple',
      disableVisualSelection: 'area',
      moveCells: false,
      selectionHandles: false,
    });
  });

  test('keeps the highlight on a selected cell the user re-clicks, instead of jumping back', async() => {
    // The reported sequence: build three layers, then click back onto the second one.
    await grid.cell(0, 0).click();
    await grid.ctrlClickCell(1, 0);
    await grid.ctrlClickCell(1, 1);

    expect(await grid.focusCell()).toEqual({ row: 1, col: 1 });

    await grid.ctrlClickCell(1, 0);

    // The cell just clicked keeps the highlight, and nothing else was dropped. Three layers, not
    // four: the stale copy of (1,0) goes, so re-clicking never piles up duplicates.
    expect(await grid.focusCell()).toEqual({ row: 1, col: 0 });
    expect(await grid.selectedLayerCount()).toBe(3);
    expect(await grid.allSelectedBounds()).toEqual([
      { top: 0, start: 0, bottom: 0, end: 0 },
      { top: 1, start: 1, bottom: 1, end: 1 },
      { top: 1, start: 0, bottom: 1, end: 0 },
    ]);
  });

  test('follows every click when the user alternates between two adjacent cells', async() => {
    await grid.cell(1, 0).click();
    await grid.ctrlClickCell(1, 1);

    // Alternating used to strand the highlight and then wipe the selection outright on the fourth
    // click. Each click here must simply move the highlight, forever.
    for (const col of [0, 1, 0, 1]) {
      await grid.ctrlClickCell(1, col);

      expect(await grid.focusCell()).toEqual({ row: 1, col });
      expect(await grid.selectedLayerCount()).toBe(2);
    }
  });

  test('moves the highlight inside a row selection without breaking the selected rows', async() => {
    // The workflow from the report: pick whole rows, then move the highlight around inside them.
    await grid.ctrlClickRowHeader(1);
    await grid.ctrlClickRowHeader(3);
    await grid.ctrlClickCell(1, 0);
    await grid.ctrlClickCell(1, 1);
    await grid.ctrlClickCell(1, 0);

    expect(await grid.focusCell()).toEqual({ row: 1, col: 0 });

    // Both row layers are untouched. They are ranges, so they never match the single-cell test.
    const bounds = await grid.allSelectedBounds();

    expect(bounds[0]).toEqual({ top: 1, start: 0, bottom: 1, end: 9 });
    expect(bounds[1]).toEqual({ top: 3, start: 0, bottom: 3, end: 9 });
    expect(bounds).toHaveLength(4);
  });

  test('still deselects a cell that already holds the highlight', async() => {
    await grid.cell(0, 0).click();
    await grid.ctrlClickCell(1, 0);

    expect(await grid.focusCell()).toEqual({ row: 1, col: 0 });

    // (1,0) holds the highlight, so clicking it again takes it out of the selection.
    await grid.ctrlClickCell(1, 0);

    expect(await grid.selectedLayerCount()).toBe(1);
    expect(await grid.allSelectedBounds()).toEqual([{ top: 0, start: 0, bottom: 0, end: 0 }]);
    expect(await grid.focusCell()).toEqual({ row: 0, col: 0 });
  });

  test('two ctrl+clicks on the same unfocused cell still deselect it', async() => {
    await grid.cell(0, 0).click();
    await grid.ctrlClickCell(1, 1);
    await grid.ctrlClickCell(2, 2);

    // (1,1) does not hold the highlight, so the first click only moves it there. The second click
    // then lands on the highlighted cell and removes it - the deselect still takes two clicks.
    await grid.ctrlClickCell(1, 1);

    expect(await grid.focusCell()).toEqual({ row: 1, col: 1 });
    expect(await grid.selectedLayerCount()).toBe(3);

    await grid.ctrlClickCell(1, 1);

    expect(await grid.selectedLayerCount()).toBe(2);
    expect(await grid.allSelectedBounds()).toEqual([
      { top: 0, start: 0, bottom: 0, end: 0 },
      { top: 2, start: 2, bottom: 2, end: 2 },
    ]);
  });

  test('treats a ctrl+double-click as the two ctrl+clicks it is', async() => {
    await grid.cell(0, 0).click();
    await grid.ctrlClickCell(1, 0);

    // (0,0) does not hold the highlight, so the first click of the pair moves it there and the
    // second lands on the highlighted cell and removes it — the same two steps a user would get
    // clicking slowly. The rule must not read the gap between the clicks.
    await grid.ctrlDoubleClickCell(0, 0);

    expect(await grid.selectedLayerCount()).toBe(1);
    expect(await grid.allSelectedBounds()).toEqual([{ top: 1, start: 0, bottom: 1, end: 0 }]);
    expect(await grid.focusCell()).toEqual({ row: 1, col: 0 });
  });

  test('reads the focus from the active layer, not the last one', async({ page }) => {
    // `setRangeFocus` records an active layer index without reordering the layers, and keyboard
    // wrapping rotates it, so the focused layer need not be the top one. Reading `current()` here
    // instead of the active range would see (1,1) and treat this click as a focus move, leaving
    // the cell selected.
    await grid.initGrid({
      selectionMode: 'multiple',
      disableVisualSelection: 'area',
      moveCells: false,
      selectionHandles: false,
      autoWrapRow: true,
    });

    await grid.selectLayers([[0, 0, 0, 0], [1, 1, 1, 1]]);

    expect(await grid.focusCell()).toEqual({ row: 1, col: 1 });

    // Each layer is one cell, so the next step wraps out of the last layer onto the first one.
    await page.keyboard.press('Enter');

    expect(await grid.focusCell()).toEqual({ row: 0, col: 0 });

    // (0,0) now holds the focus while still sitting on the layer below the top one.
    await grid.ctrlClickCell(0, 0);

    expect(await grid.selectedLayerCount()).toBe(1);
    expect(await grid.allSelectedBounds()).toEqual([{ top: 1, start: 1, bottom: 1, end: 1 }]);
  });

  test('deselects the only selected cell whether the two clicks are fast or slow', async() => {
    // Keying the rule on `event.detail` made this depend on the OS double-click threshold: the
    // fast pair reported `detail: 2`, skipped the toggle, and left the cell selected while the
    // slow pair cleared it. Both cadences must land in the same place.
    await grid.cell(2, 2).click();
    await grid.ctrlClickCell(2, 2);

    expect(await grid.selectedLayerCount()).toBe(0);

    await grid.ctrlClickTwiceFast(3, 3);

    expect(await grid.selectedLayerCount()).toBe(0);
  });
});
