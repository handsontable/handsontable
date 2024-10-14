describe('WalkontableTable (RTL mode)', () => {
  function hotParentName(TH) {
    const hotParent = TH.parentElement.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement;
    const classes = hotParent.className.split(' ');

    return classes[0];
  }

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$wrapper = $('<div></div>').addClass('handsontable').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);
    this.$wrapper.appendTo('body');
    createDataArray(100, 4);
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');
    $('.wtHolder').remove();

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  it('getCell should only return cells from rendered rows and columns', function() {
    const scrollbarWidth = getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

    spec().$wrapper.width(100 + scrollbarWidth).height(201 + scrollbarWidth);

    createDataArray(20, 20);
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(wt.wtTable.getCell(new Walkontable.CellCoords(7, 0)) instanceof HTMLElement).toBe(true);
    expect(spec().$table.find('tr:eq(8) td:first-child').text()).toEqual(this.data[8][0].toString());
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(20, 0))).toBe(-2); // exit code
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(25, 0))).toBe(-2); // exit code
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(7, 5))).toBe(-4); // exit code - after rendered column

    wt.scrollViewportHorizontally(6);
    wt.scrollViewportVertically(10);
    wt.draw();
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(7, 0))).toBe(-3); // exit code - before rendered column
    expect(wt.wtTable.getCell(new Walkontable.CellCoords(7, 21))).toBe(-4); // exit code - after rendered column

    let results = [];

    for (let i = 0; i < 20; i++) {
      const result = wt.wtTable.getCell(new Walkontable.CellCoords(10, i));

      results.push(result instanceof HTMLElement ? HTMLElement : result);
    }
    expect(results)
      .toEqual([-3, -3, -3, -3, -3, HTMLElement, HTMLElement, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4]);

    results = [];

    for (let i = 0; i < 20; i++) {
      const result = wt.wtTable.getCell(new Walkontable.CellCoords(i, 6));

      results.push(result instanceof HTMLElement ? HTMLElement : result);
    }

    const expectedGetCellOutputForRowsInFirstColumn = [-1, -1, HTMLElement, HTMLElement, HTMLElement,
      HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement,
      HTMLElement, HTMLElement, -2, -2, -2, -2, -2, -2, -2, -2];

    expect(results).toEqual(expectedGetCellOutputForRowsInFirstColumn);

  });

  it('getCell with a negative parameter should return headers when they exist on a given overlay (no frozen rows)', () => {
    createDataArray(18, 18);
    spec().$wrapper.width(250).height(170);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
      }],
      rowHeaders: [function(row, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
      }]
    });

    wt.draw();

    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }).innerHTML, 'master')
      .toBe('ht_master-header-of-col--1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }).innerHTML, 'master')
      .toBe('ht_master-header-of-col-0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }).innerHTML, 'master')
      .toBe('ht_master-header-of-col-1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }).innerHTML, 'master')
      .toBe('ht_master-header-of-col-2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }).innerHTML, 'master')
      .toBe('ht_master-header-of-row-0'); // TODO this should be -3, because it is rendered on left overlay
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }).innerHTML, 'master')
      .toBe('ht_master-header-of-row-1'); // TODO this should be -3, because it is rendered on left overlay
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }).innerHTML, 'master')
      .toBe('ht_master-header-of-row-2'); // TODO this should be -3, because it is rendered on left overlay
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }).innerHTML, 'master').toBe('0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }).innerHTML, 'master').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }).innerHTML, 'master').toBe('2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }).innerHTML, 'master').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'master').toBe(-2);

    expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);

    expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined); // TODO it should be undefined

    expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }).innerHTML, 'inlineStart')
      .toBe('ht_clone_inline_start-header-of-col--1'); // TODO this should be negative, because it is rendered on top-left overlay
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }).innerHTML, 'inlineStart')
      .toBe('ht_clone_inline_start-header-of-row-0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }).innerHTML, 'inlineStart')
      .toBe('ht_clone_inline_start-header-of-row-1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }).innerHTML, 'inlineStart')
      .toBe('ht_clone_inline_start-header-of-row-2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'inlineStart').toBe(-2);

    expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-col--1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'topInlineStartCorner').toBe(-2);

    expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }).innerHTML, 'top')
      .toBe('ht_clone_top-header-of-col--1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }).innerHTML, 'top')
      .toBe('ht_clone_top-header-of-col-0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }).innerHTML, 'top')
      .toBe('ht_clone_top-header-of-col-1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }).innerHTML, 'top')
      .toBe('ht_clone_top-header-of-col-2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'top').toBe(-2);
  });

  it('getCell with a negative parameter should return headers when they exist on a given overlay (frozen rows and columns)', () => {
    createDataArray(18, 18);
    spec().$wrapper.width(250).height(170);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
      fixedColumnsStart: 2,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
      }],
      rowHeaders: [function(row, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
      }]
    });

    wt.draw();

    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'master').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'master').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }).innerHTML, 'master').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'master').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'master').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'master').toBe(-2);

    expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }).innerHTML, 'bottomInlineStartCorner')
      .toBe('ht_clone_bottom_inline_start_corner-header-of-row-16');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }).innerHTML, 'bottomInlineStartCorner')
      .toBe('ht_clone_bottom_inline_start_corner-header-of-row-17');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'bottomInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: 0 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: 2 }), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }).innerHTML, 'bottomInlineStartCorner').toBe('16');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'bottomInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }).innerHTML, 'bottomInlineStartCorner').toBe('17');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'bottomInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'bottomInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'bottomInlineStartCorner').toBe(-2);

    expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'bottom').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'bottom').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'bottom').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: 0 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: 2 }), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'bottom').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }).innerHTML, 'bottom').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'bottom').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }).innerHTML, 'bottom').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'bottom').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'bottom').toBe(-2);

    expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }).innerHTML, 'inlineStart')
      .toBe('ht_clone_inline_start-header-of-row-2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }).innerHTML, 'inlineStart').toBe('2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'inlineStart').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'inlineStart').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'inlineStart').toBe(-2);

    expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-col--1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-col-0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-col-1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-row-0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }).innerHTML, 'topInlineStartCorner')
      .toBe('ht_clone_top_inline_start_corner-header-of-row-1');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }).innerHTML, 'topInlineStartCorner').toBe('0');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'topInlineStartCorner').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'topInlineStartCorner').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'topInlineStartCorner').toBe(-2);

    expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: -1 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 0 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 1 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 2 }).innerHTML, 'top')
      .toBe('ht_clone_top-header-of-col-2');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 15 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 16 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 17 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: -1, col: 18 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: -1 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 1, col: -1 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 15, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: -1 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 0 }), 'top').toBe(-3);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 2 }).innerHTML, 'top').toBe('b');
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 16 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 17 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 0, col: 18 }), 'top').toBe(-4);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 16 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 17 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 2, col: 18 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 2 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 0 }), 'top').toBe(-2);
    expectWtTable(wt, wtTable => wtTable.getCell({ row: 18, col: 2 }), 'top').toBe(-2);
  });

  it('helper methods should return -1 error code if there are no rendered rows or columns', () => {
    createDataArray(0, 0);
    spec().$wrapper.width(250).height(170);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
      fixedColumnsStart: 2,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
      }],
      rowHeaders: [function(row, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
      }]
    });

    wt.draw();

    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'master').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'master').toBe(0);

    expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottomInlineStartCorner').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottomInlineStartCorner').toBe(0);

    expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottom').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottom').toBe(0);

    expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'inlineStart').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'inlineStart').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'inlineStart').toBe(0);

    expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'topInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'topInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'topInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topInlineStartCorner').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'topInlineStartCorner').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'topInlineStartCorner').toBe(0);

    expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'top').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'top').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'top').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(-1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'top').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'top').toBe(0);
  });

  it('helper methods should return relevant value for rows and columns', () => {
    createDataArray(18, 18);
    spec().$wrapper.width(250).height(170);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
      fixedColumnsStart: 2,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-col-${col}`;
      }],
      rowHeaders: [function(row, TH) {
        TH.innerHTML = `${hotParentName(TH)}-header-of-row-${row}`;
      }]
    });

    wt.draw();

    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'master').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'master').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'master').toBe(5);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(3);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'master').toBe(4);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'master').toBe(2);

    expect(wt.wtOverlays.bottomInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottomInlineStartCorner').toBe(16);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'bottomInlineStartCorner').toBe(16);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottomInlineStartCorner').toBe(17);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomInlineStartCorner').toBe(17);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottomInlineStartCorner').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottomInlineStartCorner').toBe(2);

    expect(wt.wtOverlays.bottomOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'bottom').toBe(16);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'bottom').toBe(16);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottom').toBe(17);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(17);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottom').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottom').toBe(2);

    expect(wt.wtOverlays.inlineStartOverlay.clone).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'inlineStart').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'inlineStart').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'inlineStart').toBe(5);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'inlineStart').toBe(3);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'inlineStart').toBe(4);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'inlineStart').toBe(2);

    expect(wt.wtOverlays.topInlineStartCornerOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'topInlineStartCorner').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'topInlineStartCorner').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'topInlineStartCorner').toBe(1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topInlineStartCorner').toBe(1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'topInlineStartCorner').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'topInlineStartCorner').toBe(2);

    expect(wt.wtOverlays.topOverlay).not.toBe(undefined);
    expectWtTable(wt, wtTable => wtTable.getFirstRenderedRow(), 'top').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getFirstVisibleRow(), 'top').toBe(0);
    expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'top').toBe(1);
    expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(1);
    expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'top').toBe(2);
    expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'top').toBe(2);
  });

  it('getCoords should return coords of TD', () => {
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    const $td2 = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
  });

  it('getCoords should return coords of TD (with row header)', () => {
    spec().$wrapper.width(300);

    function plusOne(i) {
      return i + 1;
    }

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = plusOne(row);
      }]
    });

    wt.draw();

    const $td2 = spec().$table.find('tbody tr:eq(1) td:eq(1)');

    expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
  });

  it('getCoords should return coords of TH', () => {
    spec().$wrapper.width(300);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();

    const $th2 = spec().$table.find('thead tr:first th:eq(1)');

    expect(wt.wtTable.getCoords($th2[0])).toEqual(new Walkontable.CellCoords(-1, 1));
  });

  it('getCoords should return coords of TD (with fixedColumnsStart)', () => {
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsStart: 2,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();

    const $cloneLeft = $('.ht_clone_inline_start');
    const $td2 = $cloneLeft.find('tbody tr:eq(1) td:eq(1)');

    expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
  });

  describe('getColumnHeader', () => {
    it('should return valid column header', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();

      expect(wt.wtTable.getColumnHeader(0)).toBe(spec().$table.find('thead tr:nth(0) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(0, 1)).toBe(spec().$table.find('thead tr:nth(1) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(0, 2)).toBe(spec().$table.find('thead tr:nth(2) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(0, 3)).toBeUndefined();
    });

    it('should return valid column header when the viewport is scrolled', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();
      wt.scrollViewportHorizontally(3);
      wt.draw();

      expect(wt.wtTable.getColumnHeader(1)).toBeUndefined();
      expect(wt.wtTable.getColumnHeader(2)).toBe(spec().$table.find('thead tr:nth(0) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(2, 1)).toBe(spec().$table.find('thead tr:nth(1) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(2, 2)).toBe(spec().$table.find('thead tr:nth(2) th:nth(0)').get(0));
      expect(wt.wtTable.getColumnHeader(3, 0)).toBe(spec().$table.find('thead tr:nth(0) th:nth(1)').get(0));
    });
  });

  describe('getColumnHeaders', () => {
    it('should return valid column headers', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();

      expect(wt.wtTable.getColumnHeaders(0)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(0)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(1)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(1)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(2)).toEqual([]);
    });

    it('should return valid column headers when the viewport is scrolled', () => {
      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnHeaders: [
          (col, TH) => {
            TH.innerHTML = `L1: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L2: ${col + 1}`;
          },
          (col, TH) => {
            TH.innerHTML = `L3: ${col + 1}`;
          },
        ],
      });

      wt.draw();
      wt.scrollViewportHorizontally(3);
      wt.draw();

      expect(wt.wtTable.getColumnHeaders(1)).toEqual([]);
      expect(wt.wtTable.getColumnHeaders(2)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(0)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(0)').get(0),
      ]);
      expect(wt.wtTable.getColumnHeaders(3)).toEqual([
        spec().$table.find('thead tr:nth(0) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(1) th:nth(1)').get(0),
        spec().$table.find('thead tr:nth(2) th:nth(1)').get(0),
      ]);
    });
  });

  it('should render as much columns as the container width allows, if width is null', () => {
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();
    expect(spec().$table.find('thead tr:first').children().length).toBe(2);
    expect(spec().$table.find('tbody tr:first').children().length).toBe(2);

    spec().$wrapper.width(200);
    wt.draw();
    expect(spec().$table.find('thead tr:first').children().length).toBe(4);
    expect(spec().$table.find('tbody tr:first').children().length).toBe(4);
  });

  it('should render as much columns as the container width allows, if width is null (with row header)', () => {
    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });

    wt.draw();
    expect(spec().$table.find('thead tr:first').children().length).toBe(2);
    expect(spec().$table.find('tbody tr:first').children().length).toBe(2);

    spec().$wrapper.width(200);
    wt.draw();
    expect(spec().$table.find('thead tr:first').children().length).toBe(4);
    expect(spec().$table.find('tbody tr:first').children().length).toBe(4);
  });

  it('should use column width array to get column width', () => {
    spec().$wrapper.width(600);

    const wt = walkontable({
      rtlMode: true,
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: [50, 100, 150, 201]
    });

    wt.draw();
    expect(spec().$table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(50);
    expect(spec().$table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect(spec().$table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(150);
    expect(spec().$table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(201);
  });

  describe('isLastColumnFullyVisible', () => {
    it('should be false because it is only partially visible', () => {
      createDataArray(18, 4);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toBe(false);
    });

    it('should be true because it is fully visible', () => {
      createDataArray(18, 4);
      spec().$wrapper.width(180).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(3);
      wt.draw();

      expect(wt.wtTable.isLastColumnFullyVisible()).toBe(true);
    });
  });

  describe('getFirstVisibleColumn', () => {
    it('should return source index only for fully visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getFirstVisibleColumn()).toBe(0);
    });

    it('should return source index only for fully visible column (the first column is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getFirstVisibleColumn()).toBe(5);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'master').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'bottomInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'inlineStart').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'topInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstVisibleColumn(), 'top').toBe(2);
    });
  });

  describe('getLastVisibleColumn', () => {
    it('should return source index only for fully visible column (the last column is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getLastVisibleColumn()).toBe(2);
    });

    it('should return source index only for fully visible column (the last column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getLastVisibleColumn()).toBe(7);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'master').toBe(4); // TODO I think this should be 3 not 4, because 4 is only partially visible, but for now I am only testing actual behavior
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'bottomInlineStartCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'bottom').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'inlineStart').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'topInlineStartCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'top').toBe(4);
    });
  });

  describe('getFirstRenderedColumn', () => {
    it('should return source index even for partially visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getFirstRenderedColumn()).toBe(0);
    });

    it('should return source index even for partially visible column (the first column is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getFirstRenderedColumn()).toBe(4);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'master').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'bottomInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'inlineStart').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'topInlineStartCorner').toBe(0);
      expectWtTable(wt, wtTable => wtTable.getFirstRenderedColumn(), 'top').toBe(2);
    });
  });

  describe('getLastRenderedColumn', () => {
    it('should return source index even for partially visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getLastRenderedColumn()).toBe(4);
    });

    it('should return source index even for partially visible column (the first column is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getLastRenderedColumn()).toBe(7);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'bottomInlineStartCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'bottom').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'inlineStart').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'topInlineStartCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'top').toBe(4);
    });
  });

  describe('getVisibleColumnsCount', () => {
    it('should return columns count only for fully visible columns', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getVisibleColumnsCount()).toBe(3);

      wt.scrollViewportHorizontally(10);
      wt.draw();

      expect(wt.wtTable.getVisibleColumnsCount()).toBe(3);

      // Scroll the table in that way that the first and last row i partially visible
      wt.wtOverlays.inlineStartOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getVisibleColumnsCount()).toBe(3);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'bottomInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'bottom').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'inlineStart').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'topInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'top').toBe(3);
    });
  });

  describe('getRenderedColumnsCount', () => {
    it('should return columns count only for fully visible columns', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      expect(wt.wtTable.getRenderedColumnsCount()).toBe(5);

      wt.scrollViewportHorizontally(10);
      wt.draw();

      expect(wt.wtTable.getRenderedColumnsCount()).toBe(4);

      // Scroll the table in that way that the first and last row i partially visible
      wt.wtOverlays.inlineStartOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getRenderedColumnsCount()).toBe(5);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        rtlMode: true,
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsStart: 2
      });

      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'bottomInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'bottom').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'inlineStart').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'topInlineStartCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'top').toBe(3);
    });
  });
});
