/**
 * Regression coverage for `Border#drawFrozenBoundaryEdge`.
 *
 * A selection edge that lands exactly on a frozen-pane boundary is rendered by the master overlay
 * right on the freeze line, where the frozen overlay (stacked above) occludes it. The master hides
 * that edge and the frozen overlay re-draws it, so the edge must be visible in EXACTLY ONE overlay:
 * drawn on the frozen overlay (`top` / `inline_start`), hidden on the master — never zero (missing),
 * never two (doubled). This must hold in both LTR and RTL.
 */
describe('Frozen boundary edge', () => {
  beforeEach(function() {
    this.$wrapper = $('<div></div>').addClass('handsontable');
    this.$container = $('<div></div>');
    this.$wrapper.width(100).height(200);
    this.$table = $('<table></table>').addClass('htCore');
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 8);
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');
    $('.wtHolder').remove();
    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  function overlayBorders(wt, selection) {
    const borders = wt.selectionManager.getBorderInstances(selection);

    return {
      master: borders.find(b => b.wot.wtTable.isMaster),
      top: borders.find(b => b.wot.wtTable.name === 'top'),
      inlineStart: borders.find(b => b.wot.wtTable.name === 'inline_start'),
      corner: borders.find(b => b.wot.wtTable.name === 'top_inline_start_corner'),
      bottom: borders.find(b => b.wot.wtTable.name === 'bottom'),
      bottomCorner: borders.find(b => b.wot.wtTable.name === 'bottom_inline_start_corner'),
    };
  }

  const topShown = b => !!b && !!b.topStyle && b.topStyle.display === 'block';
  const startShown = b => !!b && !!b.startStyle && b.startStyle.display === 'block';
  const bottomShown = b => !!b && !!b.bottomStyle && b.bottomStyle.display === 'block';

  function build({
    rtl = false, fixedRowsTop = 0, fixedRowsBottom = 0, fixedColumnsStart = 0, borderWidth = 1
  } = {}) {
    if (rtl) {
      $('html').attr('dir', 'rtl');
    }
    const selections = createSelectionController({ border: { width: borderWidth, color: 'red' } });
    const wt = walkontable({
      rtlMode: rtl,
      data: getData,
      totalRows: 8,
      totalColumns: 8,
      fixedRowsTop,
      fixedRowsBottom,
      fixedColumnsStart,
      selections,
      onCellMouseDown(event, coords) {
        selections.getFocus().clear().add(coords);
        wt.draw();
      }
    });

    wt.draw();

    return { wt, selections };
  }

  it('LTR / fixedRowsTop: top edge is drawn on the top overlay and hidden on the master', async() => {
    const { wt, selections } = build({ fixedRowsTop: 2 });

    // cell flush with the row freeze line: row === fixedRowsTop
    spec().$table.find('tbody tr:eq(2) td:eq(1)').simulate('mousedown');

    const { master, top } = overlayBorders(wt, selections.getFocus());

    expect([master, top].filter(topShown).length).toBe(1);
    expect(topShown(top)).toBe(true);
    expect(topShown(master)).toBe(false);
  });

  it('RTL / fixedRowsTop: top edge is drawn on the top overlay and hidden on the master', async() => {
    const { wt, selections } = build({ rtl: true, fixedRowsTop: 2 });

    spec().$table.find('tbody tr:eq(2) td:eq(1)').simulate('mousedown');

    const { master, top } = overlayBorders(wt, selections.getFocus());

    expect([master, top].filter(topShown).length).toBe(1);
    expect(topShown(top)).toBe(true);
    expect(topShown(master)).toBe(false);
  });

  it('LTR / fixedColumnsStart: start edge is drawn on the inline_start overlay and hidden on the master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedColumnsStart: 2 });

    // cell flush with the column freeze line: column === fixedColumnsStart
    spec().$table.find('tbody tr:eq(1) td:eq(2)').simulate('mousedown');

    const { master, inlineStart } = overlayBorders(wt, selections.getFocus());

    expect([master, inlineStart].filter(startShown).length).toBe(1);
    expect(startShown(inlineStart)).toBe(true);
    expect(startShown(master)).toBe(false);
  });

  it('RTL / fixedColumnsStart: start edge is drawn on the inline_start overlay and hidden on the master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ rtl: true, fixedColumnsStart: 2 });

    spec().$table.find('tbody tr:eq(1) td:eq(2)').simulate('mousedown');

    const { master, inlineStart } = overlayBorders(wt, selections.getFocus());

    expect([master, inlineStart].filter(startShown).length).toBe(1);
    expect(startShown(inlineStart)).toBe(true);
    expect(startShown(master)).toBe(false);
  });

  // Geometry: the boundary edge must reach the side edges drawn by the master, so — like `appear` —
  // its length is the spanned cell dimension plus the half-border delta (`ceil(borderWidth / 2)`).
  // Without that delta a gap opens at the corner for borders thicker than 1px. The thin dimension
  // stays equal to the configured border width. `outerWidth`/`outerHeight` map to `offsetWidth`/
  // `offsetHeight`, so the assertions read the boundary cell's offset size directly.
  it('LTR / fixedRowsTop: top edge length = spanned cell width + ceil(borderWidth / 2)', async() => {
    const { wt, selections } = build({ fixedRowsTop: 2, borderWidth: 4 });

    spec().$table.find('tbody tr:eq(2) td:eq(1)').simulate('mousedown');

    const { top } = overlayBorders(wt, selections.getFocus());
    // boundary cell = last frozen row (fixedRowsTop - 1) in the selected (single) column
    const boundaryCellWidth = spec().$table.find('tbody tr:eq(1) td:eq(1)')[0].offsetWidth;

    expect(parseInt(top.topStyle.width, 10)).toBe(boundaryCellWidth + Math.ceil(4 / 2));
    expect(parseInt(top.topStyle.height, 10)).toBe(4);
  });

  it('RTL / fixedRowsTop: top edge length = spanned cell width + ceil(borderWidth / 2)', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ rtl: true, fixedRowsTop: 2, borderWidth: 4 });

    spec().$table.find('tbody tr:eq(2) td:eq(1)').simulate('mousedown');

    const { top } = overlayBorders(wt, selections.getFocus());
    const boundaryCellWidth = spec().$table.find('tbody tr:eq(1) td:eq(1)')[0].offsetWidth;

    expect(parseInt(top.topStyle.width, 10)).toBe(boundaryCellWidth + Math.ceil(4 / 2));
    expect(parseInt(top.topStyle.height, 10)).toBe(4);
  });

  it('LTR / fixedColumnsStart: start edge length = spanned cell height + ceil(borderWidth / 2)', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedColumnsStart: 2, borderWidth: 4 });

    spec().$table.find('tbody tr:eq(1) td:eq(2)').simulate('mousedown');

    const { inlineStart } = overlayBorders(wt, selections.getFocus());
    // boundary cell = last frozen column (fixedColumnsStart - 1) in the selected (single) row
    const boundaryCellHeight = spec().$table.find('tbody tr:eq(1) td:eq(1)')[0].offsetHeight;

    expect(parseInt(inlineStart.startStyle.height, 10)).toBe(boundaryCellHeight + Math.ceil(4 / 2));
    expect(parseInt(inlineStart.startStyle.width, 10)).toBe(4);
  });

  it('combined fixedRowsTop + fixedColumnsStart: each boundary edge is drawn on its own overlay only', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // corner cell flush with BOTH freeze lines: row === fixedRowsTop && column === fixedColumnsStart
    spec().$table.find('tbody tr:eq(2) td:eq(2)').simulate('mousedown');

    const { master, top, inlineStart } = overlayBorders(wt, selections.getFocus());

    // row edge owned by the top overlay
    expect([master, top].filter(topShown).length).toBe(1);
    expect(topShown(top)).toBe(true);
    expect(topShown(master)).toBe(false);

    // column edge owned by the inline_start overlay
    expect([master, inlineStart].filter(startShown).length).toBe(1);
    expect(startShown(inlineStart)).toBe(true);
    expect(startShown(master)).toBe(false);
  });

  // Cross-seam: a boundary edge that also crosses the PERPENDICULAR freeze line is split between two
  // frozen overlays. The `inline_start` overlay renders only the non-frozen (scrolled) rows, so the
  // slice of the column-freeze edge that reaches up into the frozen rows must come from the corner
  // overlay — otherwise the master hides the whole edge and the frozen-row part disappears.
  it('column edge crossing the row freeze line is drawn by inline_start + corner and hidden on master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // Selection flush against the column freeze line (column === fixedColumnsStart) reaching from the
    // first non-frozen row (row 2) up into a frozen row (row 1).
    selections.getFocus()
      .clear()
      .add(new Walkontable.CellCoords(2, 2))
      .add(new Walkontable.CellCoords(1, 2));
    wt.draw();

    const { master, inlineStart, corner } = overlayBorders(wt, selections.getFocus());

    expect(startShown(master)).toBe(false);
    expect(startShown(inlineStart)).toBe(true); // non-frozen row slice (C3)
    expect(startShown(corner)).toBe(true); // frozen row slice (C2)
  });

  it('row edge crossing the column freeze line is drawn by top + corner and hidden on master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // Selection flush against the row freeze line (row === fixedRowsTop) reaching from the first
    // non-frozen column (column 2) left into a frozen column (column 1).
    selections.getFocus()
      .clear()
      .add(new Walkontable.CellCoords(2, 2))
      .add(new Walkontable.CellCoords(2, 1));
    wt.draw();

    const { master, top, corner } = overlayBorders(wt, selections.getFocus());

    expect(topShown(master)).toBe(false);
    expect(topShown(top)).toBe(true); // non-frozen column slice
    expect(topShown(corner)).toBe(true); // frozen column slice
  });

  // No-doubling: a cell inside the frozen ROWS but flush with the COLUMN freeze line is rendered by
  // the `top` overlay, which would draw its own start edge in the regular flow — doubling the freeze
  // edge the corner overlay owns. The `top` overlay (and the master) must hide that start edge.
  it('frozen-row cell on the column freeze line: start edge only on corner, hidden on top + master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // row 0 = frozen row, column 2 = column freeze line.
    selections.getFocus().clear().add(new Walkontable.CellCoords(0, 2));
    wt.draw();

    const { master, top, corner } = overlayBorders(wt, selections.getFocus());

    expect([master, top, corner].filter(startShown).length).toBe(1);
    expect(startShown(corner)).toBe(true);
    expect(startShown(top)).toBe(false);
    expect(startShown(master)).toBe(false);
  });

  // Symmetric no-doubling: a cell inside the frozen COLUMNS but flush with the ROW freeze line is
  // rendered in the visible frozen-column area by the `inline_start` overlay, which must hide its top
  // edge (owned by the corner). The `top` overlay also renders that frozen column, but it sits behind
  // the corner overlay, so its (occluded) duplicate edge is harmless — the same way the cross-seam
  // cases let `top` and `corner` overlap. The count therefore covers the visible-area overlays only.
  it('frozen-column cell on the row freeze line: visible top edge only on corner, hidden on inline_start + master', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // row 2 = row freeze line, column 0 = frozen column.
    selections.getFocus().clear().add(new Walkontable.CellCoords(2, 0));
    wt.draw();

    const { master, inlineStart, corner } = overlayBorders(wt, selections.getFocus());

    expect([master, inlineStart, corner].filter(topShown).length).toBe(1);
    expect(topShown(corner)).toBe(true);
    expect(topShown(inlineStart)).toBe(false);
    expect(topShown(master)).toBe(false);
  });

  // The single cell flush with BOTH freeze lines: the top edge (top overlay) and the start edge
  // (inline_start overlay) meet inside the frozen×frozen region owned by the corner overlay, which
  // draws a connecting square there so the two lines join instead of leaving a gap.
  it('single cell on both freeze lines: corner overlay draws the connecting square', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    selections.getFocus().clear().add(new Walkontable.CellCoords(2, 2));
    wt.draw();

    const { top, inlineStart, corner } = overlayBorders(wt, selections.getFocus());

    expect(topShown(top)).toBe(true); // row-freeze edge
    expect(startShown(inlineStart)).toBe(true); // column-freeze edge
    expect(topShown(corner)).toBe(true); // connecting square (reuses the top border element)
  });

  // The freeze edge must not protrude above the grid: at row 0 there is no row above to overlap, so
  // the line's top must stay within the pane (the `-1` overlap is dropped). Catches the regression
  // where the column-freeze edge poked one pixel above the top-left corner.
  it('column freeze edge at row 0 does not protrude above the pane', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    selections.getFocus().clear().add(new Walkontable.CellCoords(0, 2));
    wt.draw();

    const { corner } = overlayBorders(wt, selections.getFocus());

    expect(startShown(corner)).toBe(true);
    expect(parseInt(corner.startStyle.top, 10)).toBeGreaterThanOrEqual(0);
  });

  // The freeze edge is anchored a fixed pixel inside the freeze line, independent of the border
  // width, so borders of different widths (e.g. focus 2px vs area/fill 1px) share the same edge
  // instead of the thicker one bleeding further out. A 4px border must still sit ~1px inside the
  // line — not 4px — keeping its inline-start edge aligned with a 1px border's.
  it('column freeze edge anchors a constant pixel inside the line regardless of border width', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedColumnsStart: 2, borderWidth: 4 });

    selections.getFocus().clear().add(new Walkontable.CellCoords(1, 2));
    wt.draw();

    const { inlineStart } = overlayBorders(wt, selections.getFocus());
    // Freeze line = right edge of the last frozen column (column 1) in the inline_start overlay.
    const boundaryCell = inlineStart.wot.wtTable.getCell(new Walkontable.CellCoords(1, 1));
    const freezeLineRight = boundaryCell.getBoundingClientRect().right;
    const edgeLeft = inlineStart.start.getBoundingClientRect().left;

    // The drawn edge's inline-start sits one pixel inside the freeze line (constant), not 4px.
    expect(Math.round(freezeLineRight - edgeLeft)).toBe(1);
  });

  // Scroll-out: the frozen overlay renders the frozen block whatever the scroll, so without consulting
  // the master it would keep the column-freeze edge pinned to the seam even after the selected
  // boundary column scrolls behind the pane — a line stuck at the freeze line. Once the boundary
  // column is no longer visible in the master viewport, the edge must disappear. Built standalone with
  // many narrow-viewport columns so the horizontal scroll genuinely pushes the boundary column out.
  it('column freeze edge disappears once the boundary column scrolls behind the pane', async() => {
    createDataArray(100, 30);
    spec().$wrapper.width(200).height(200);
    const selections = createSelectionController({ border: { width: 1, color: 'red' } });
    const wt = walkontable({
      data: getData,
      totalRows: 100,
      totalColumns: 30,
      fixedColumnsStart: 2,
      selections,
    });

    wt.draw();

    // Cell flush with the column freeze line (column === fixedColumnsStart).
    selections.getFocus().clear().add(new Walkontable.CellCoords(1, 2));
    wt.draw();

    expect(startShown(overlayBorders(wt, selections.getFocus()).inlineStart)).toBe(true);

    // Scroll far right so column 2 slides behind the frozen pane and leaves the master viewport.
    wt.scrollViewport(new Walkontable.CellCoords(1, 25));
    wt.draw();

    expect(wt.wtTable.getFirstVisibleColumn()).toBeGreaterThan(2); // precondition: boundary column is out
    expect(startShown(overlayBorders(wt, selections.getFocus()).inlineStart)).toBe(false);
  });

  // Symmetric to the row-0 protrusion guard: at column 0 there is no column before the boundary cell,
  // so the row-freeze edge's `-1` inline-start overlap must be dropped to avoid poking one pixel past
  // the pane's inline-start edge.
  it('row freeze edge at column 0 does not protrude past the inline-start of the pane', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    // row 2 = row freeze line, column 0 = first (frozen) column.
    selections.getFocus().clear().add(new Walkontable.CellCoords(2, 0));
    wt.draw();

    const { corner } = overlayBorders(wt, selections.getFocus());

    expect(topShown(corner)).toBe(true);
    expect(parseInt(corner.topStyle.left, 10)).toBeGreaterThanOrEqual(0);
  });

  // Bottom-freeze mirror of the `fixedRowsTop` case: a selection whose bottom edge lands on the
  // `fixedRowsBottom` line is rendered by the master under the bottom overlay, so the bottom overlay
  // re-draws it and the master hides it — exactly one bottom edge, never zero, never doubled.
  it('LTR / fixedRowsBottom: bottom edge is drawn on the bottom overlay and hidden on the master', async() => {
    const { wt, selections } = build({ fixedRowsBottom: 2 });

    // cell flush with the bottom freeze line: row === totalRows - fixedRowsBottom - 1 (8 - 2 - 1 = 5)
    spec().$table.find('tbody tr:eq(5) td:eq(1)').simulate('mousedown');

    const { master, bottom } = overlayBorders(wt, selections.getFocus());

    expect([master, bottom].filter(bottomShown).length).toBe(1);
    expect(bottomShown(bottom)).toBe(true);
    expect(bottomShown(master)).toBe(false);
  });

  it('RTL / fixedRowsBottom: bottom edge is drawn on the bottom overlay and hidden on the master', async() => {
    const { wt, selections } = build({ rtl: true, fixedRowsBottom: 2 });

    spec().$table.find('tbody tr:eq(5) td:eq(1)').simulate('mousedown');

    const { master, bottom } = overlayBorders(wt, selections.getFocus());

    expect([master, bottom].filter(bottomShown).length).toBe(1);
    expect(bottomShown(bottom)).toBe(true);
    expect(bottomShown(master)).toBe(false);
  });

  // Regression for the reported bug: a selection flush with the COLUMN freeze line whose span reaches
  // DOWN into the bottom-frozen rows. The `inline_start` overlay renders only the non-frozen rows, so
  // the slice of the column-freeze edge inside the bottom-frozen rows must come from the bottom corner
  // overlay — otherwise the master hides the whole edge, the bottom overlay's copy is occluded by the
  // corner, and the bottom rows lose their start edge (the "D48/D49 missing left edge" symptom).
  it('column edge crossing the bottom freeze line is drawn by inline_start + bottom corner, hidden on master + bottom', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsBottom: 2, fixedColumnsStart: 2 });

    // Column flush with the freeze line (column === fixedColumnsStart) from the last non-frozen row
    // (row 5) down into the bottom-frozen rows (rows 6, 7).
    selections.getFocus()
      .clear()
      .add(new Walkontable.CellCoords(5, 2))
      .add(new Walkontable.CellCoords(7, 2));
    wt.draw();

    const { master, inlineStart, bottom, bottomCorner } = overlayBorders(wt, selections.getFocus());

    expect(startShown(master)).toBe(false);
    expect(startShown(bottom)).toBe(false); // occluded duplicate hidden
    expect(startShown(inlineStart)).toBe(true); // non-frozen row slice (row 5)
    expect(startShown(bottomCorner)).toBe(true); // bottom-frozen row slice (rows 6, 7)
  });

  // Bottom mirror of the "single cell on both freeze lines" case: the bottom edge (bottom overlay) and
  // the start edge (inline_start overlay) meet inside the bottom corner overlay's frozen×frozen region,
  // which draws a connecting square (reusing the bottom border element) so the lines join.
  it('single cell on bottom + column freeze lines: bottom corner draws the connecting square', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsBottom: 2, fixedColumnsStart: 2 });

    // row 5 = bottom freeze line, column 2 = column freeze line.
    selections.getFocus().clear().add(new Walkontable.CellCoords(5, 2));
    wt.draw();

    const { inlineStart, bottom, bottomCorner } = overlayBorders(wt, selections.getFocus());

    expect(bottomShown(bottom)).toBe(true); // bottom-freeze edge
    expect(startShown(inlineStart)).toBe(true); // column-freeze edge
    expect(bottomShown(bottomCorner)).toBe(true); // connecting square (reuses the bottom border element)
  });

  // RTL counterpart of the reported-bug regression: the column-freeze edge crossing down into the
  // bottom-frozen rows must still be split between `inline_start` and the bottom corner, hidden on the
  // master and the (occluded) `bottom` overlay.
  it('RTL / column edge crossing the bottom freeze line is drawn by inline_start + bottom corner', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ rtl: true, fixedRowsBottom: 2, fixedColumnsStart: 2 });

    selections.getFocus()
      .clear()
      .add(new Walkontable.CellCoords(5, 2))
      .add(new Walkontable.CellCoords(7, 2));
    wt.draw();

    const { master, inlineStart, bottom, bottomCorner } = overlayBorders(wt, selections.getFocus());

    expect(startShown(master)).toBe(false);
    expect(startShown(bottom)).toBe(false); // occluded duplicate hidden
    expect(startShown(inlineStart)).toBe(true); // non-frozen row slice (row 5)
    expect(startShown(bottomCorner)).toBe(true); // bottom-frozen row slice (rows 6, 7)
  });

  // Bottom mirror of "row edge crossing the column freeze line is drawn by top + corner": a bottom
  // edge that also reaches left into the frozen columns is split between the `bottom` overlay (non-
  // frozen columns) and the bottom corner overlay (frozen columns). The `inline_start` overlay renders
  // the boundary cell too, so it must hide its duplicate bottom edge.
  it('bottom edge crossing the column freeze line is drawn by bottom + bottom corner, hidden on master + inline_start', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ fixedRowsBottom: 2, fixedColumnsStart: 2 });

    // Selection flush against the bottom freeze line (row === totalRows - fixedRowsBottom - 1 = 5)
    // reaching from the first non-frozen column (column 2) left into a frozen column (column 1).
    selections.getFocus()
      .clear()
      .add(new Walkontable.CellCoords(5, 2))
      .add(new Walkontable.CellCoords(5, 1));
    wt.draw();

    const { master, inlineStart, bottom, bottomCorner } = overlayBorders(wt, selections.getFocus());

    expect(bottomShown(master)).toBe(false);
    expect(bottomShown(inlineStart)).toBe(false); // occluded duplicate hidden
    expect(bottomShown(bottom)).toBe(true); // non-frozen column slice (column 2)
    expect(bottomShown(bottomCorner)).toBe(true); // frozen column slice (column 1)
  });

  // Scroll-out mirror: the bottom overlay renders the bottom-frozen block whatever the scroll, so
  // without consulting the master it would keep the bottom-freeze edge pinned to the seam even after
  // the selected boundary row scrolls above the pane. Once the boundary row drops out of the master
  // viewport (scrolled up to the top), the edge must disappear.
  it('bottom freeze edge disappears once the boundary row scrolls above the pane', async() => {
    createDataArray(100, 8);
    spec().$wrapper.width(300).height(200);
    const selections = createSelectionController({ border: { width: 1, color: 'red' } });
    const wt = walkontable({
      data: getData,
      totalRows: 100,
      totalColumns: 8,
      fixedRowsBottom: 2,
      selections,
    });

    wt.draw();

    // Cell flush with the bottom freeze line (row === totalRows - fixedRowsBottom - 1 = 97).
    selections.getFocus().clear().add(new Walkontable.CellCoords(97, 1));
    wt.draw();

    // Scroll to the bottom so the boundary row is visible and the edge is drawn.
    wt.scrollViewport(new Walkontable.CellCoords(97, 1));
    wt.draw();

    expect(bottomShown(overlayBorders(wt, selections.getFocus()).bottom)).toBe(true);

    // Scroll up to the top so row 97 leaves the master viewport (only the frozen rows 98/99 stay).
    wt.scrollViewport(new Walkontable.CellCoords(0, 1));
    wt.draw();

    expect(wt.wtTable.getLastVisibleRow()).toBeLessThan(97); // precondition: boundary row is out
    expect(bottomShown(overlayBorders(wt, selections.getFocus()).bottom)).toBe(false);
  });

  // Geometry mirror of the top-edge length tests: the bottom edge must reach the side edges the master
  // draws, so its length is the spanned (boundary) cell width plus the half-border delta
  // (`ceil(borderWidth / 2)`); the thin dimension equals the configured border width.
  it('LTR / fixedRowsBottom: bottom edge length = spanned cell width + ceil(borderWidth / 2)', async() => {
    const { wt, selections } = build({ fixedRowsBottom: 2, borderWidth: 4 });

    spec().$table.find('tbody tr:eq(5) td:eq(1)').simulate('mousedown');

    const { bottom } = overlayBorders(wt, selections.getFocus());
    // boundary cell = first bottom-frozen row (totalRows - fixedRowsBottom = 6) in the selected column
    const boundaryCellWidth = spec().$table.find('tbody tr:eq(6) td:eq(1)')[0].offsetWidth;

    expect(parseInt(bottom.bottomStyle.width, 10)).toBe(boundaryCellWidth + Math.ceil(4 / 2));
    expect(parseInt(bottom.bottomStyle.height, 10)).toBe(4);
  });

  it('RTL / fixedRowsBottom: bottom edge length = spanned cell width + ceil(borderWidth / 2)', async() => {
    spec().$wrapper.width(300);
    const { wt, selections } = build({ rtl: true, fixedRowsBottom: 2, borderWidth: 4 });

    spec().$table.find('tbody tr:eq(5) td:eq(1)').simulate('mousedown');

    const { bottom } = overlayBorders(wt, selections.getFocus());
    const boundaryCellWidth = spec().$table.find('tbody tr:eq(6) td:eq(1)')[0].offsetWidth;

    expect(parseInt(bottom.bottomStyle.width, 10)).toBe(boundaryCellWidth + Math.ceil(4 / 2));
    expect(parseInt(bottom.bottomStyle.height, 10)).toBe(4);
  });
});
