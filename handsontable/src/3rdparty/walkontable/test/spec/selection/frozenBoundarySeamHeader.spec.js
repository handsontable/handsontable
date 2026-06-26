/**
 * Regression coverage for the frozen-pane active-header seam classes tagged by `SelectionManager`
 * (`#markFrozenColumnSeamHeader` / `#markFrozenTopRowSeamHeader` / `#markFrozenBottomRowSeamHeader`).
 *
 * When an active header's highlighted column/row sits on the first/last NON-frozen track, its
 * inline-start / top / bottom accent falls on the frozen-pane seam, which is drawn by a separate
 * overlay table and is out of reach of the neighbour `:has()` CSS rule. The manager tags the adjacent
 * frozen header (last frozen on the freeze line) with a `-seam` / `-row-seam-top` / `-row-seam-bottom`
 * class so the theme can colour that seam to match. The contract verified here:
 *   - the class lands on the NEIGHBOUR frozen header, never on the active header itself,
 *   - only when the active track is flush with the freeze line (not deeper, not inside the pane),
 *   - never without the matching `fixed*` setting, and
 *   - it is cleaned up once the active header no longer sits on the line.
 */
describe('Frozen boundary seam header', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$wrapper.width(300).height(300);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(20, 8);
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  const COLUMN_SEAM = 'ht__active_highlight-seam';
  const TOP_ROW_SEAM = 'ht__active_highlight-row-seam-top';
  const BOTTOM_ROW_SEAM = 'ht__active_highlight-row-seam-bottom';

  const headerFactory =
    count => Array.from({ length: count }, () => (index, TH) => { TH.innerHTML = index + 1; });

  function build({
    rtl = false, fixedRowsTop = 0, fixedRowsBottom = 0, fixedColumnsStart = 0,
    rowHeaderLevels = 1, columnHeaderLevels = 1,
  } = {}) {
    if (rtl) {
      $('html').attr('dir', 'rtl');
    }

    const selections = createSelectionController();
    const wt = walkontable({
      rtlMode: rtl,
      data: getData,
      totalRows: 8,
      totalColumns: 8,
      rowHeaders: headerFactory(rowHeaderLevels),
      columnHeaders: headerFactory(columnHeaderLevels),
      fixedRowsTop,
      fixedRowsBottom,
      fixedColumnsStart,
      selections,
    });

    wt.draw();

    return { wt, selections };
  }

  // Every header carrying the seam class anywhere in the grid.
  const seamHeaders = cls => spec().$wrapper.find(`.${cls}`).toArray();

  describe('column seam (fixedColumnsStart)', () => {
    it('LTR: tags the last frozen column header when the first non-frozen column header is active', async() => {
      const { wt, selections } = build({ fixedColumnsStart: 2 });

      // Active column header on the first non-frozen column; its inline-start edge is the freeze seam.
      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 2));
      wt.draw();

      const tagged = seamHeaders(COLUMN_SEAM);

      expect(tagged.length).toBeGreaterThan(0);
      tagged.forEach((th) => {
        expect(th.nodeName).toBe('TH');
        // The seam class rides the neighbour (last frozen) header, never the active one.
        expect(th.classList.contains('ht__active_highlight')).toBe(false);
      });

      // It is exactly the last frozen column header (column fixedColumnsStart - 1) in the inline_start overlay.
      const lastFrozen = wt.wtOverlays.inlineStartOverlay.clone.wtTable.getColumnHeader(1);

      expect(lastFrozen.classList.contains(COLUMN_SEAM)).toBe(true);
    });

    it('RTL: tags the same last frozen column header (the rule is index-based, direction-agnostic)', async() => {
      const { wt, selections } = build({ rtl: true, fixedColumnsStart: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 2));
      wt.draw();

      const lastFrozen = wt.wtOverlays.inlineStartOverlay.clone.wtTable.getColumnHeader(1);

      expect(lastFrozen.classList.contains(COLUMN_SEAM)).toBe(true);
    });

    it('tags every column-header level of the last frozen column', async() => {
      const { wt, selections } = build({ fixedColumnsStart: 2, columnHeaderLevels: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 2));
      wt.draw();

      const cloneTable = wt.wtOverlays.inlineStartOverlay.clone.wtTable;

      expect(cloneTable.getColumnHeader(1, 0).classList.contains(COLUMN_SEAM)).toBe(true);
      expect(cloneTable.getColumnHeader(1, 1).classList.contains(COLUMN_SEAM)).toBe(true);
    });

    it('does NOT tag when the active column header is inside the frozen pane', async() => {
      const { wt, selections } = build({ fixedColumnsStart: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 1)); // a frozen column
      wt.draw();

      expect(seamHeaders(COLUMN_SEAM).length).toBe(0);
    });

    it('does NOT tag when the active column header is past the freeze line', async() => {
      const { wt, selections } = build({ fixedColumnsStart: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 4)); // not flush with the seam
      wt.draw();

      expect(seamHeaders(COLUMN_SEAM).length).toBe(0);
    });

    it('never tags a column seam without fixedColumnsStart', async() => {
      const { wt, selections } = build({});

      selections.getActiveHeader().add(new Walkontable.CellCoords(-1, 2));
      wt.draw();

      expect(seamHeaders(COLUMN_SEAM).length).toBe(0);
    });
  });

  describe('top row seam (fixedRowsTop)', () => {
    it('tags the last top-frozen row header when the first non-frozen row header is active', async() => {
      const { wt, selections } = build({ fixedRowsTop: 2 });

      // Active row header on the first non-frozen row; its top edge is the top-freeze seam.
      selections.getActiveHeader().add(new Walkontable.CellCoords(2, -1));
      wt.draw();

      const tagged = seamHeaders(TOP_ROW_SEAM);

      expect(tagged.length).toBeGreaterThan(0);
      tagged.forEach((th) => {
        expect(th.nodeName).toBe('TH');
        expect(th.classList.contains('ht__active_highlight')).toBe(false);
      });

      // The row headers of the top-frozen rows live in the top-inline-start corner overlay.
      const lastFrozenRowHeader = wt.wtOverlays.topInlineStartCornerOverlay.clone.wtTable.getRowHeader(1);

      expect(lastFrozenRowHeader.classList.contains(TOP_ROW_SEAM)).toBe(true);
    });

    it('does NOT tag when the active row header is inside the top-frozen pane', async() => {
      const { wt, selections } = build({ fixedRowsTop: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(1, -1)); // a frozen row
      wt.draw();

      expect(seamHeaders(TOP_ROW_SEAM).length).toBe(0);
    });

    it('never tags a top row seam without fixedRowsTop', async() => {
      const { wt, selections } = build({});

      selections.getActiveHeader().add(new Walkontable.CellCoords(2, -1));
      wt.draw();

      expect(seamHeaders(TOP_ROW_SEAM).length).toBe(0);
    });
  });

  describe('bottom row seam (fixedRowsBottom)', () => {
    it('tags the first bottom-frozen row header when the last non-frozen row header is active', async() => {
      const { wt, selections } = build({ fixedRowsBottom: 2 });

      // firstFrozenRow = totalRows - fixedRowsBottom = 6; the last non-frozen row is 5.
      selections.getActiveHeader().add(new Walkontable.CellCoords(5, -1));
      wt.draw();

      const tagged = seamHeaders(BOTTOM_ROW_SEAM);

      expect(tagged.length).toBeGreaterThan(0);
      tagged.forEach((th) => {
        expect(th.nodeName).toBe('TH');
        expect(th.classList.contains('ht__active_highlight')).toBe(false);
      });

      // The row headers of the bottom-frozen rows live in the bottom-inline-start corner overlay.
      const firstFrozenRowHeader = wt.wtOverlays.bottomInlineStartCornerOverlay.clone.wtTable.getRowHeader(6);

      expect(firstFrozenRowHeader.classList.contains(BOTTOM_ROW_SEAM)).toBe(true);
    });

    it('does NOT tag when the active row header is inside the bottom-frozen pane', async() => {
      const { wt, selections } = build({ fixedRowsBottom: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(6, -1)); // a frozen row
      wt.draw();

      expect(seamHeaders(BOTTOM_ROW_SEAM).length).toBe(0);
    });

    it('does NOT tag when the active row header is above the last non-frozen row', async() => {
      const { wt, selections } = build({ fixedRowsBottom: 2 });

      selections.getActiveHeader().add(new Walkontable.CellCoords(4, -1)); // not flush with the seam
      wt.draw();

      expect(seamHeaders(BOTTOM_ROW_SEAM).length).toBe(0);
    });

    it('never tags a bottom row seam without fixedRowsBottom', async() => {
      const { wt, selections } = build({});

      selections.getActiveHeader().add(new Walkontable.CellCoords(5, -1));
      wt.draw();

      expect(seamHeaders(BOTTOM_ROW_SEAM).length).toBe(0);
    });
  });
});
