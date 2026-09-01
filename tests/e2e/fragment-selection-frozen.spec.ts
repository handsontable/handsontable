import { test, expect } from '../fixtures/test';
import { FragmentSelectionPage, type OverlayName } from '../fixtures/pages/FragmentSelectionPage';

/**
 * `fragmentSelection` against frozen rows and columns (#4980).
 *
 * A frozen cell the user sees and clicks is not in the master table — it is rendered in an overlay
 * clone that sits beside the master in the DOM. Deciding whether text selection is allowed by
 * testing membership of the master table alone therefore rejects every cell in a frozen row, a
 * frozen column, or the corner, and the mousedown handler then cancels the gesture.
 */
test.describe('fragmentSelection in frozen areas', () => {
  let grid: FragmentSelectionPage;

  /**
   * Every frozen area, plus the master as the control that proves the drag gesture works at all.
   * Each cell is one the grid's 620px actually shows: with two frozen columns of 200px the master
   * only has room for column 2, and a clipped cell would put the drag somewhere else entirely.
   */
  const AREAS: { label: string, overlay: OverlayName, settings: Record<string, unknown>, row: number, col: number }[] = [
    { label: 'master table', overlay: 'master', settings: { fixedColumnsStart: 2 }, row: 1, col: 2 },
    { label: 'frozen columns', overlay: 'inlineStart', settings: { fixedColumnsStart: 2 }, row: 1, col: 0 },
    { label: 'frozen top rows', overlay: 'top', settings: { fixedRowsTop: 2 }, row: 0, col: 0 },
    {
      label: 'top-start corner',
      overlay: 'corner',
      settings: { fixedRowsTop: 2, fixedColumnsStart: 2 },
      row: 0,
      col: 0,
    },
  ];

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new FragmentSelectionPage(page, theme, bundle);
    await grid.goto();
  });

  for (const area of AREAS) {
    test(`selects a fragment of a cell's text in the ${area.label}`, async () => {
      await grid.initGrid({ ...area.settings, fragmentSelection: true });
      await grid.clearTextSelection();

      await grid.dragAcrossTextIn(area.overlay, area.row, area.col);

      const cellText = await grid.cellText(area.overlay, area.row, area.col);
      const selected = await grid.selectedText();

      // A fragment, not the whole cell and not nothing: the drag covers the middle of the text, so
      // what comes back has to be a real substring of that one cell.
      expect(selected.length).toBeGreaterThan(0);
      expect(cellText).toContain(selected);
      expect(selected).not.toEqual(cellText);
    });
  }

  test("selects a fragment inside a frozen column when fragmentSelection is 'cell'", async () => {
    await grid.initGrid({ fixedColumnsStart: 2, fragmentSelection: 'cell' });
    await grid.clearTextSelection();

    await grid.dragAcrossTextIn('inlineStart', 1, 0);

    const cellText = await grid.cellText('inlineStart', 1, 0);
    const selected = await grid.selectedText();

    expect(selected.length).toBeGreaterThan(0);
    expect(cellText).toContain(selected);
  });

  test('selects nothing in a frozen column when fragmentSelection is off', async () => {
    // The default. Dragging inside a cell must extend the grid's own cell selection, never a text
    // selection — so enabling frozen cells for fragmentSelection must not leak into this case.
    await grid.initGrid({ fixedColumnsStart: 2 });
    await grid.clearTextSelection();

    await grid.dragAcrossTextIn('inlineStart', 1, 0);

    expect(await grid.selectedText()).toEqual('');
  });

  test('does not select cells the pointer never crossed when a drag leaves the frozen area', async () => {
    // The overlays sit next to each other in the DOM in an order that does not follow the visual
    // layout, so a native range spanning two of them sweeps up unrelated columns. Dragging left out
    // of the master and into the frozen columns must not collect the columns to the RIGHT.
    await grid.initGrid({ fixedColumnsStart: 2, fragmentSelection: true });
    await grid.clearTextSelection();

    await grid.dragBetweenOverlays(
      { overlay: 'master', row: 1, col: 2 },
      { overlay: 'inlineStart', row: 1, col: 0 },
    );

    // Every cell opens with its own `R<row>C<col>` marker, so counting the markers in the selected
    // text counts the cells it reaches — regardless of whether the drag ends up clamped or dropped.
    const markers = (await grid.selectedText()).match(/R\d+C\d+/g) ?? [];

    expect(markers.length).toBeLessThanOrEqual(1);
  });
});
