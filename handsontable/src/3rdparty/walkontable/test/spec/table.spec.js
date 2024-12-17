describe('WalkontableTable', () => {
  const debug = false;

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

  it('should use custom cell renderer if provided', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        const cellData = getData(row, column);

        if (cellData === undefined) {
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
    this.data.splice(8);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(8);

    this.data.splice(7);
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

  it('should render oversized columns correctly across the entire range of the horizontal table scrollbar', async() => {
    createDataArray(10, 10);
    spec().$wrapper.width(300);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnWidth: 2000, // the columns are wider than table viewport width
    });

    wt.draw();
    getTableMaster().find('.wtHolder').scrollLeft(100);

    const firstRow = getTableMaster().find('tbody tr:first');

    expect(firstRow.find('td').length).toBe(1);
    expect(firstRow.find('td:first').text()).toBe('0');
    expect(firstRow.find('td:last').text()).toBe('0');

    getTableMaster().find('.wtHolder').scrollLeft(1715); // 1px before the 2nd column is loaded

    wt.draw();
    await sleep(20);

    expect(firstRow.find('td').length).toBe(1);
    expect(firstRow.find('td:first').text()).toBe('0');
    expect(firstRow.find('td:last').text()).toBe('0');

    getTableMaster().find('.wtHolder').scrollLeft(1716); // the 2nd column is loaded

    wt.draw();
    await sleep(20);

    expect(firstRow.find('td').length).toBe(2);
    expect(firstRow.find('td:first').text()).toBe('0');
    expect(firstRow.find('td:last').text()).toBe('a');

    getTableMaster().find('.wtHolder').scrollLeft(2000);

    wt.draw();
    await sleep(20);

    expect(firstRow.find('td').length).toBe(1);
    expect(firstRow.find('td:first').text()).toBe('a');
    expect(firstRow.find('td:last').text()).toBe('a');

    getTableMaster().find('.wtHolder').scrollLeft(3500);

    wt.draw();
    await sleep(20);

    expect(firstRow.find('td').length).toBe(1);
    expect(firstRow.find('td:first').text()).toBe('a');
    expect(firstRow.find('td:last').text()).toBe('a');

    getTableMaster().find('.wtHolder').scrollLeft(4000);

    wt.draw();
    await sleep(20);

    expect(firstRow.find('td').length).toBe(1);
    expect(firstRow.find('td:first').text()).toBe('b');
    expect(firstRow.find('td:last').text()).toBe('b');
  });

  it('should render oversized rows correctly across the entire range of the vertical table scrollbar', async() => {
    createDataArray(10, 10);
    spec().$wrapper.width(300);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeight: 2000, // the rows are wider than table viewport height
      rowHeightByOverlayName: 2000, // the rows are wider than table viewport height
    });

    wt.draw();
    getTableMaster().find('.wtHolder').scrollTop(100);

    expect(getTableMaster().find('tbody tr').length).toBe(1);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('0');

    getTableMaster().find('.wtHolder').scrollTop(2000);

    wt.draw();
    await sleep(20);

    expect(getTableMaster().find('tbody tr').length).toBe(1);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('1');

    getTableMaster().find('.wtHolder').scrollTop(3814); // 1px before the 3rd row is loaded

    wt.draw();
    await sleep(20);

    expect(getTableMaster().find('tbody tr').length).toBe(1);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('1');

    getTableMaster().find('.wtHolder').scrollTop(3815); // the 3rd row is loaded

    wt.draw();
    await sleep(20);

    expect(getTableMaster().find('tbody tr').length).toBe(2);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('1');

    getTableMaster().find('.wtHolder').scrollTop(3500);

    wt.draw();
    await sleep(20);

    expect(getTableMaster().find('tbody tr').length).toBe(1);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('1');

    getTableMaster().find('.wtHolder').scrollTop(4000);

    wt.draw();
    await sleep(20);

    expect(getTableMaster().find('tbody tr').length).toBe(1);
    expect(getTableMaster().find('tbody tr:first td:first').text()).toBe('2');
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
    it('both left and right borders should be set on the first TH in the top overlay if `fixedColumns` is set but there are no `rowHeaders`', () => {
      createDataArray(50, 50);
      spec().$wrapper.width(500).height(400);

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        columnWidth: 70,
        fixedColumnsStart: 2,
        columnHeaders: [function() {}]
      });

      wt.draw();

      expect($('.ht_clone_top_inline_start_corner thead tr th').eq(0).css('border-left-width')).toBe('1px');
      expect($('.ht_clone_top_inline_start_corner thead tr th').eq(0).css('border-right-width')).toBe('1px');
      expect($('.ht_clone_top_inline_start_corner thead tr th').eq(1).css('border-left-width')).toBe('0px');
      expect($('.ht_clone_top_inline_start_corner thead tr th').eq(1).css('border-right-width')).toBe('1px');
    });
  });

  it('should render a table with overlays with corresponding backward compatible CSS classes', () => {
    const wt = walkontable({
      data: getData,
      fixedRowsTop: 2,
      fixedRowsBottom: 2,
      fixedColumnsStart: 2,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect($('.ht_clone_top_inline_start_corner')[0]).toHaveClass('ht_clone_top_left_corner');
    expect($('.ht_clone_inline_start')[0]).toHaveClass('ht_clone_left');
    expect($('.ht_clone_bottom_inline_start_corner')[0]).toHaveClass('ht_clone_bottom_left_corner');
  });

  it('should not re-render the full table when the table has `display: none` declared', () => {
    const cellRenderer = jasmine.createSpy('cellRenderer');
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer
    });

    wt.draw();

    expect(cellRenderer).toHaveBeenCalledTimes(18);

    spec().$wrapper.css('display', 'none');

    wt.draw();

    expect(cellRenderer).toHaveBeenCalledTimes(18);
  });
});
