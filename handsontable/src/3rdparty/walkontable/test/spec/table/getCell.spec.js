describe('WalkontableTable', () => {
  const debug = false;

  function hotParentName(TH) {
    const hotParent = TH.parentElement.parentElement.parentElement.parentElement.parentElement
      .parentElement.parentElement;
    const classes = hotParent.className.split(' ');

    return classes[0];
  }

  beforeEach(function() {
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
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$wrapper.remove();
    this.wotInstance.destroy();
  });

  describe('getCell()', () => {
    it('should only return cells from rendered rows and columns', function() {
      const scrollbarWidth = getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

      spec().$wrapper.width(100 + scrollbarWidth).height(201 + scrollbarWidth);

      createDataArray(20, 20);
      const wt = walkontable({
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

    it('should only return cells from rendered rows and columns (with fixedRowsBottom)', () => {
      createDataArray(20, 20);
      const wt = walkontable({
        data: getData,
        fixedRowsBottom: 2,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });

      wt.draw();

      const bottomTable = wt.wtOverlays.bottomOverlay.clone.wtTable;

      expect(bottomTable.getCell(new Walkontable.CellCoords(18, 0)) instanceof HTMLTableCellElement).toBe(true);
      expect(bottomTable.getCell(new Walkontable.CellCoords(19, 0)) instanceof HTMLTableCellElement).toBe(true);
    });

    it('should return headers when they exist on a given overlay (no frozen rows)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
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

    it('should return headers when they exist on a given overlay (frozen rows and columns)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
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
      expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 0 }).innerHTML, 'bottomInlineStartCorner')
        .toBe('16');
      expectWtTable(wt, wtTable => wtTable.getCell({ row: 16, col: 2 }), 'bottomInlineStartCorner').toBe(-4);
      expectWtTable(wt, wtTable => wtTable.getCell({ row: 17, col: 0 }).innerHTML, 'bottomInlineStartCorner')
        .toBe('17');
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
  });
});
