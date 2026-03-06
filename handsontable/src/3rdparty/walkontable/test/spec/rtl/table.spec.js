describe('WalkontableTable (RTL mode)', () => {
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

  it('getCoords should return coords of TD', async() => {
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

  it('getCoords should return coords of TD (with row header)', async() => {
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

  it('getCoords should return coords of TH', async() => {
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

  it('getCoords should return coords of TD (with fixedColumnsStart)', async() => {
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
    it('should return valid column header', async() => {
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

    it('should return valid column header when the viewport is scrolled', async() => {
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
    it('should return valid column headers', async() => {
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

    it('should return valid column headers when the viewport is scrolled', async() => {
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

  it('should render as much columns as the container width allows, if width is null', async() => {
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

  it('should render as much columns as the container width allows, if width is null (with row header)', async() => {
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

  it('should use column width array to get column width', async() => {
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
    it('should be false because it is only partially visible', async() => {
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

    it('should be true because it is fully visible', async() => {
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
    it('should return source index only for fully visible column (the first column is fully visible)', async() => {
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

    it('should return source index only for fully visible column (the first column is partially visible)', async() => {
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

    it('should return source index that is relevant to a given overlay', async() => {
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
    it('should return source index only for fully visible column (the last column is partially visible)', async() => {
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

    it('should return source index only for fully visible column (the last column is fully visible)', async() => {
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

    it('should return source index that is relevant to a given overlay', async() => {
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
    it('should return source index even for partially visible column (the first column is fully visible)', async() => {
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

    it('should return source index even for partially visible column (the first column is partially visible)', async() => {
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

    it('should return source index that is relevant to a given overlay', async() => {
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
    it('should return source index even for partially visible column (the first column is fully visible)', async() => {
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

    it('should return source index even for partially visible column (the first column is partially visible)', async() => {
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

    it('should return source index that is relevant to a given overlay', async() => {
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
    it('should return columns count only for fully visible columns', async() => {
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

    it('should return sum that is relevant to a given overlay', async() => {
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
    it('should return columns count only for fully visible columns', async() => {
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

    it('should return sum that is relevant to a given overlay', async() => {
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
