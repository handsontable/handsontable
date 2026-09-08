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

  test('clears the selection when the last highlighted cell is ctrl+clicked', async() => {
    await grid.cell(2, 2).click();
    await grid.ctrlClickCell(2, 2);

    expect(await grid.selectedLayerCount()).toBe(0);
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

  test('keeps a selected cell when it is ctrl+double-clicked', async() => {
    await grid.cell(0, 0).click();
    await grid.ctrlClickCell(1, 0);

    // Both mousedowns of a double-click add a layer, so the closing mouseup sees the highlight
    // already sitting on the clicked cell. Read as a genuine second click it would deselect the
    // cell the user was reaching for.
    await grid.ctrlDoubleClickCell(0, 0);

    expect(await grid.focusCell()).toEqual({ row: 0, col: 0 });
    expect(await grid.selectedLayerCount()).toBe(2);
    expect(await grid.allSelectedBounds()).toEqual([
      { top: 1, start: 0, bottom: 1, end: 0 },
      { top: 0, start: 0, bottom: 0, end: 0 },
    ]);
  });
});
