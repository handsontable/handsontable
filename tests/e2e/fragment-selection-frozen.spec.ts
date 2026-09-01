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
   * Every frozen area `getParentOverlay` can resolve, plus the master as the control that proves the
   * drag gesture works at all. Each cell is one the grid's 620px box actually shows: with two frozen
   * columns of 200px the master only has room for column 2, and a clipped cell would put the drag
   * somewhere else entirely. The fixture holds 6 rows, so row 5 is the last.
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
    { label: 'frozen bottom rows', overlay: 'bottom', settings: { fixedRowsBottom: 2 }, row: 5, col: 0 },
    {
      label: 'bottom-start corner',
      overlay: 'bottomCorner',
      settings: { fixedRowsBottom: 2, fixedColumnsStart: 2 },
      row: 5,
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

  test('clears the selection when a drag leaves the area it started in', async () => {
    // The overlays sit next to each other in the DOM in an order that does not follow the visual
    // layout, so a native range spanning two of them sweeps up unrelated columns — a leftward drag
    // would collect the columns to the RIGHT. The selection is dropped instead. Asserting the exact
    // empty string, not "at most one cell": that upper bound also passes when the selection is
    // destroyed, so it could not tell the documented behavior from a silent failure.
    await grid.initGrid({ fixedColumnsStart: 2, fragmentSelection: true });
    await grid.clearTextSelection();

    await grid.dragBetweenOverlays(
      { overlay: 'master', row: 1, col: 2 },
      { overlay: 'inlineStart', row: 1, col: 0 },
    );

    expect(await grid.selectedText()).toEqual('');
  });

  test('keeps a selection that stops short of the frozen boundary', async () => {
    // The companion to the test above: it pins that the clearing is caused by crossing the seam, not
    // by dragging leftward, and that exactly one cell's text comes back when the drag stays put.
    await grid.initGrid({ fixedColumnsStart: 2, fragmentSelection: true });
    await grid.clearTextSelection();

    await grid.dragAcrossTextIn('master', 1, 2);

    const selected = await grid.selectedText();
    // Every cell opens with its own `R<row>C<col>` marker, so counting markers counts the cells the
    // selection reaches. Exactly one, and it has to be the cell that was dragged.
    const markers = selected.match(/R\d+C\d+/g) ?? [];

    expect(selected.length).toBeGreaterThan(0);
    expect(markers).toEqual([]);
    expect(await grid.cellText('master', 1, 2)).toContain(selected);
  });

  test('selects across two cells in the master table', async () => {
    // `fragmentSelection: true` means "text selection in multiple cells at a time", so this covers
    // the option's headline behavior, which every other test here only exercises inside one cell.
    //
    // It does NOT cover the related trap: a drag over a cell boundary can land a mousemove on the
    // selection border between the cells, and a containment test narrow enough to reject that
    // element cancels the whole gesture. Whether the border ends up under the pointer depends on
    // timing, so it could not be pinned deterministically here — it is checked by hand instead.
    await grid.initGrid({ fragmentSelection: true });
    await grid.clearTextSelection();

    await grid.dragAcrossCells('master', 1, 0, 2);

    expect(await grid.selectedText()).toContain('R1C1');
  });

  test('selects across two cells inside the frozen columns', async () => {
    await grid.initGrid({ fixedColumnsStart: 2, fragmentSelection: true });
    await grid.clearTextSelection();

    await grid.dragAcrossCells('inlineStart', 1, 0, 1);

    // A range spanning more than one cell carries a tab between them, so the tab proves the drag
    // crossed the boundary instead of being cancelled at it.
    expect(await grid.selectedText()).toContain('\t');
  });

  test('does not make header text selectable, frozen or not', async () => {
    // Guards the containment test against widening back to the spreader, which holds the THEAD too.
    // Every grid with headers renders them into a clone, so matching the spreader made header labels
    // selectable on any grid with headers at all — no frozen rows or columns needed.
    // A plain array, not a function: settings cross into the page through `evaluate` and have to be
    // serializable. Long labels so a drag has text to sweep across.
    await grid.initGrid({
      colHeaders: Array.from({ length: 8 }, (unused, index) =>
        `Header ${index} with a good deal of text in it`),
      rowHeaders: true,
      fragmentSelection: true,
    });
    await grid.clearTextSelection();

    await grid.dragAcrossColumnHeaderIn('top', 1);

    expect(await grid.selectedText()).toEqual('');
  });
});
