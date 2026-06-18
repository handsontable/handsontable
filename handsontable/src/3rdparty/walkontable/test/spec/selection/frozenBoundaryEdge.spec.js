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
    };
  }

  const topShown = b => !!b && !!b.topStyle && b.topStyle.display === 'block';
  const startShown = b => !!b && !!b.startStyle && b.startStyle.display === 'block';

  function build({ rtl = false, fixedRowsTop = 0, fixedColumnsStart = 0, borderWidth = 1 } = {}) {
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
});
