describe('WalkontableTable', () => {
  const debug = false;

  beforeEach(function() {
    this.$wrapper = $('<div></div>').css({ overflow: 'hidden' });
    this.$wrapper.width(100).height(201);
    this.$container = $('<div></div>');
    this.$table = $('<table></table>'); // create a table that is not attached to document
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

  it('should create as many rows as fits in height', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(9);
  });

  it('should create as many rows as in `totalRows` if it is smaller than `height`', function() {
    this.data.splice(5, this.data.length - 5);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(5);
  });

  it('first row should have as many columns as in THEAD', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();
    expect(spec().$table.find('tbody tr:first td').length).toBe(spec().$table.find('thead th').length);
  });

  it('should put a blank cell in the corner if both rowHeaders and colHeaders are set', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnHeaders: [
        function(col, TH) {
          if (col > -1) {
            TH.innerHTML = 'Column';
          }
        }
      ],
      rowHeaders: [
        function(row, TH) {
          if (row > -1) {
            TH.innerHTML = 'Row';
          }
        }
      ]
    });
    wt.draw();
    expect(spec().$table.find('thead tr:first th').length).toBe(wt.wtTable.getRenderedColumnsCount() + 1); // 4 columns in THEAD + 1 empty cell in the corner
    expect(spec().$table.find('thead tr:first th:eq(0)')[0].innerHTML.replace(/&nbsp;/, '')).toBe(''); // corner row is empty (or contains only &nbsp;)
    expect(spec().$table.find('thead tr:first th:eq(1)')[0].innerHTML).toBe('Column');
    expect(spec().$table.find('tbody tr:first th:eq(0)')[0].innerHTML).toBe('Row');
  });

  it('getCell should only return cells from rendered rows and columns', function() {
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
    expect(results).toEqual([-3, -3, -3, -3, -3, HTMLElement, HTMLElement, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4]);

    results = [];
    for (let i = 0; i < 20; i++) {
      const result = wt.wtTable.getCell(new Walkontable.CellCoords(i, 6));
      results.push(result instanceof HTMLElement ? HTMLElement : result);
    }
    expect(results).toEqual([-1, -1, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement,
      HTMLElement, HTMLElement, -2, -2, -2, -2, -2, -2, -2, -2]);
  });

  it('getCell should only return cells from rendered rows and columns (with fixedRowsBottom)', () => {
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

  it('getCoords should return coords of TD', () => {
    const wt = walkontable({
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

  it('getCoords should return coords of TD (with fixedColumnsLeft)', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      fixedColumnsLeft: 2,
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }]
    });
    wt.draw();

    const $cloneLeft = $('.ht_clone_left');
    const $td2 = $cloneLeft.find('tbody tr:eq(1) td:eq(1)');
    expect(wt.wtTable.getCoords($td2[0])).toEqual(new Walkontable.CellCoords(1, 1));
  });

  it('getStretchedColumnWidth should return valid column width when stretchH is set as \'all\'', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      stretchH: 'all'
    });
    wt.draw();
    wt.wtViewport.columnsRenderCalculator.refreshStretching(502);

    expect(wt.wtTable.getStretchedColumnWidth(0, 50)).toBe(125);
    expect(wt.wtTable.getStretchedColumnWidth(1, 50)).toBe(125);
    expect(wt.wtTable.getStretchedColumnWidth(2, 50)).toBe(125);
    expect(wt.wtTable.getStretchedColumnWidth(3, 50)).toBe(127);
  });

  it('getStretchedColumnWidth should return valid column width when stretchH is set as \'last\'', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      stretchH: 'last'
    });
    wt.draw();
    wt.wtViewport.columnsRenderCalculator.refreshStretching(502);

    expect(wt.wtTable.getStretchedColumnWidth(0, 50)).toBe(50);
    expect(wt.wtTable.getStretchedColumnWidth(1, 50)).toBe(50);
    expect(wt.wtTable.getStretchedColumnWidth(2, 50)).toBe(50);
    expect(wt.wtTable.getStretchedColumnWidth(3, 50)).toBe(352);
  });

  it('should use custom cell renderer if provided', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        const cellData = getData(row, column);

        if (cellData === void 0) {
          TD.innerHTML = '';
        } else {
          TD.innerHTML = cellData;
        }
        TD.className = '';
        TD.style.backgroundColor = 'yellow';
      }
    });
    wt.draw();
    expect(spec().$table.find('td:first')[0].style.backgroundColor).toBe('yellow');
  });

  it('should remove rows if they were removed in data source', function() {
    this.data.splice(8, this.data.length - 8); // second param is required by IE8

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(8);

    this.data.splice(7, this.data.length - 7); // second param is required by IE8
    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(7);
  });

  it('should render as much columns as the container width allows, if width is null', () => {
    const wt = walkontable({
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

  it('should use column width function to get column width', () => {
    spec().$wrapper.width(600);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth(column) {
        return (column + 1) * 50;
      }
    });
    wt.draw();
    expect(spec().$table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(50);
    expect(spec().$table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect(spec().$table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(150);
    expect(spec().$table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(200);
  });

  it('should use column width array to get column width', () => {
    spec().$wrapper.width(600);

    const wt = walkontable({
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

  it('should use column width integer to get column width', () => {
    spec().$wrapper.width(600);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: 100
    });
    wt.draw();
    expect(spec().$table.find('tbody tr:first td:eq(0)').outerWidth()).toBe(100);
    expect(spec().$table.find('tbody tr:first td:eq(1)').outerWidth()).toBe(100);
    expect(spec().$table.find('tbody tr:first td:eq(2)').outerWidth()).toBe(100);
    expect(spec().$table.find('tbody tr:first td:eq(3)').outerWidth()).toBe(100);
  });

  it('should use column width also when there are no rows', function() {
    this.data.length = 0;

    spec().$wrapper.width(600);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: 4,
      rowHeaders: [function(row, TH) {
        TH.innerHTML = row + 1;
      }],
      columnHeaders: [function(col, TH) {
        TH.innerHTML = col + 1;
      }],
      columnWidth: 100
    });
    wt.draw();
    // start from eq(1) because eq(0) is corner header
    expect(spec().$table.find('thead tr:first th:eq(1)').outerWidth()).toBe(100);
    expect(spec().$table.find('thead tr:first th:eq(2)').outerWidth()).toBe(100);
    expect(spec().$table.find('thead tr:first th:eq(3)').outerWidth()).toBe(100);
    expect(spec().$table.find('thead tr:first th:eq(4)').outerWidth()).toBe(100);
  });

  it('should render a cell that is outside of the viewport horizontally', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });
    wt.draw();
    spec().$table.find('tbody td').html('');
    wt.draw();

    expect(spec().$table.find('tbody tr:first td').length).toBe(2);
  });

  it('should not render a cell when fastDraw == true', () => {
    let count = 0;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        count += 1;
        return wt.wtSettings.defaults.cellRenderer(row, column, TD);
      }
    });
    wt.draw();
    const oldCount = count;
    wt.draw(true);

    expect(count).toBe(oldCount);
  });

  it('should not ignore fastDraw == true when grid was scrolled by amount of rows that doesn\'t exceed endRow', () => {
    let count = 0;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        count += 1;
        wt.wtSettings.defaults.cellRenderer(row, column, TD);
      },
      viewportRowCalculatorOverride(calc) {
        calc.endRow += 10;
      }
    });
    wt.draw();

    const oldCount = count;

    wt.scrollViewportVertically(8);
    wt.draw(true);

    expect(count).not.toBeGreaterThan(oldCount);
  });

  it('should ignore fastDraw == true when grid was scrolled by amount of rows that exceeds endRow', () => {
    let count = 0;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        count += 1;
        wt.wtSettings.defaults.cellRenderer(row, column, TD);
      },
      viewportRowCalculatorOverride(calc) {
        calc.endRow += 10;
      }
    });
    wt.draw();

    const oldCount = count;

    wt.scrollViewportVertically(10);
    wt.draw(true);

    expect(count).not.toBeGreaterThan(oldCount);

    wt.scrollViewportVertically(getTotalRows() - 1);
    wt.draw(true);

    expect(count).toBeGreaterThan(oldCount);
  });

  it('should not ignore fastDraw == true when grid was scrolled by amount of columns that doesn\'t exceed endColumn', () => {
    createDataArray(50, 50);
    let count = 0;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        count += 1;
        wt.wtSettings.defaults.cellRenderer(row, column, TD);
      },
      viewportColumnCalculatorOverride(calc) {
        calc.endColumn += 10;
      }
    });
    wt.draw();
    const oldCount = count;

    wt.scrollViewportHorizontally(8);
    wt.draw(true);

    expect(count).not.toBeGreaterThan(oldCount);
  });

  it('should ignore fastDraw == true when grid was scrolled by amount of columns that exceeds endColumn', () => {
    createDataArray(50, 50);
    let count = 0;
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        count += 1;
        wt.wtSettings.defaults.cellRenderer(row, column, TD);
      },
      viewportColumnCalculatorOverride(calc) {
        calc.endColumn += 10;
      }
    });
    wt.draw();

    const oldCount = count;

    wt.scrollViewportHorizontally(10);
    wt.draw(true);

    expect(count).not.toBeGreaterThan(oldCount);

    wt.scrollViewportHorizontally(11);
    wt.draw(true);

    expect(count).toBeGreaterThan(oldCount);
  });

  describe('cell header border', () => {
    it('should be correct visible in fixedColumns and without row header', () => {
      createDataArray(50, 50);
      spec().$wrapper.width(500).height(400);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 70,
        fixedColumnsLeft: 2,
        columnHeaders: [function() {}]
      });
      wt.draw();

      expect($('.ht_clone_top_left_corner thead tr th').eq(0).css('border-left-width')).toBe('1px');
      expect($('.ht_clone_top_left_corner thead tr th').eq(0).css('border-right-width')).toBe('1px');
      expect($('.ht_clone_top_left_corner thead tr th').eq(1).css('border-left-width')).toBe('0px');
      expect($('.ht_clone_top_left_corner thead tr th').eq(1).css('border-right-width')).toBe('1px');
    });
  });

  describe('isLastRowFullyVisible', () => {
    it('should be false because it is only partially visible', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.isLastRowFullyVisible()).toBe(false);
    });

    it('should be true because it is fully visible', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportVertically(7);
      wt.draw();

      expect(wt.wtTable.isLastRowFullyVisible()).toBe(true);
    });
  });

  describe('isLastColumnFullyVisible', () => {
    it('should be false because it is only partially visible', () => {
      createDataArray(18, 4);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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

  describe('getFirstVisibleRow', () => {
    it('should return source index only for fully visible row (the first row is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getFirstVisibleRow()).toBe(0);
    });

    it('should return source index only for fully visible row (the first row is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getFirstVisibleRow()).toBe(4);
    });
  });

  describe('getLastVisibleRow', () => {
    it('should return source index only for fully visible row (the last row is partially visible)', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getLastVisibleRow()).toBe(5);
    });

    it('should return source index only for fully visible row (the last row is fully visible)', () => {
      createDataArray(8, 4);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportVertically(7);
      wt.draw();

      expect(wt.wtTable.getLastVisibleRow()).toBe(7);
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottomLeftCorner').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'bottom').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'left').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'topLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleRow(), 'top').toBe(1);
    });
  });

  describe('getFirstVisibleColumn', () => {
    it('should return source index only for fully visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getFirstVisibleColumn()).toBe(5);
    });
  });

  describe('getLastVisibleColumn', () => {
    it('should return source index only for fully visible column (the last column is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'master').toBe(4); // TODO I think this should be 3 not 4, because 4 is only partially visible, but for now I am only testing actual behavior
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'bottomLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'bottom').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'left').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'topLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastVisibleColumn(), 'top').toBe(4);
    });
  });

  describe('getFirstRenderedRow', () => {
    it('should return source index even for partially visible row (the first row is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(175);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(0);
    });

    it('should return source index even for partially visible row (the first row is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(3);
    });
  });

  describe('getLastRenderedRow', () => {
    it('should return source index even for partially visible row (the last row is partially visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getLastRenderedRow()).toBe(7);
    });

    it('should return source index even for partially visible row (the last row is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(185).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getLastRenderedRow()).toBe(11); // TODO I think this should be 10, investigate
    });

    it('should return source index that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'master').toBe(5);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottomLeftCorner').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'bottom').toBe(17);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'left').toBe(5);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'topLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedRow(), 'top').toBe(1);
    });
  });

  describe('getFirstRenderedColumn', () => {
    it('should return source index even for partially visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();
      wt.scrollViewportHorizontally(7);
      wt.draw();

      expect(wt.wtTable.getFirstRenderedColumn()).toBe(4);
    });
  });

  describe('getLastRenderedColumn', () => {
    it('should return source index even for partially visible column (the first column is fully visible)', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'bottomLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'bottom').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'left').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'topLeftCorner').toBe(1);
      expectWtTable(wt, wtTable => wtTable.getLastRenderedColumn(), 'top').toBe(4);
    });
  });

  describe('getVisibleRowsCount', () => {
    it('should return rows count only for fully visible rows', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getVisibleRowsCount()).toBe(7);

      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getVisibleRowsCount()).toBe(7);

      // Scroll the table in that way that the first and last row i partially visible
      wt.wtOverlays.topOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getVisibleRowsCount()).toBe(7);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottomLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'left').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'topLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleRowsCount(), 'top').toBe(2);
    });
  });

  describe('getVisibleColumnsCount', () => {
    it('should return columns count only for fully visible columns', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
      wt.wtOverlays.leftOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getVisibleColumnsCount()).toBe(3);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'bottomLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'bottom').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'left').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'topLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getVisibleColumnsCount(), 'top').toBe(3);
    });
  });

  describe('getRenderedRowsCount', () => {
    it('should return rows count only for fully visible rows', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns
      });
      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);

      wt.scrollViewportVertically(10);
      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);

      // Scroll the table in that way that the first and last row i partially visible
      wt.wtOverlays.topOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getRenderedRowsCount()).toBe(9);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'master').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottomLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'bottom').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'left').toBe(4);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'topLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedRowsCount(), 'top').toBe(2);
    });
  });

  describe('getRenderedColumnsCount', () => {
    it('should return columns count only for fully visible columns', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(209).height(185);

      const wt = walkontable({
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
      wt.wtOverlays.leftOverlay.setScrollPosition(20);
      wt.draw();

      expect(wt.wtTable.getRenderedColumnsCount()).toBe(5);
    });

    it('should return sum that is relevant to a given overlay', () => {
      createDataArray(18, 18);
      spec().$wrapper.width(250).height(170);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        fixedColumnsLeft: 2
      });
      wt.draw();

      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'master').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'bottomLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'bottom').toBe(3);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'left').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'topLeftCorner').toBe(2);
      expectWtTable(wt, wtTable => wtTable.getRenderedColumnsCount(), 'top').toBe(3);
    });
  });

  describe('isVisible', () => {
    it('should return `false` when holder element is hidden', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });
      wt.draw();

      expect(wt.wtTable.isVisible()).toBe(true);

      spec().$wrapper.css({ display: 'none' });
      wt.draw();

      expect(wt.wtTable.isVisible()).toBe(false);
    });
  });

  describe('hasDefinedSize', () => {
    it('should return `false` when the table is initialized in the container which the size doesn\'t set.', () => {
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
      });
      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(true);

      spec().$wrapper.css({ width: '', height: '' });
      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(false);

      spec().$wrapper.css({ width: '100px', height: '100px' });
      wt.draw();

      expect(wt.wtTable.hasDefinedSize()).toBe(true);
    });
  });
});
