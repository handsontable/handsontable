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

  it('should create as many rows as fits in height', async() => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(9);
  });

  it('should create as many rows as in `totalRows` if it is smaller than `height`', async() => {
    spec().data.splice(5, spec().data.length - 5);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect(spec().$table.find('tbody tr').length).toBe(5);
  });

  it('first row should have as many columns as in THEAD', async() => {
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

  it('should put a blank cell in the corner if both rowHeaders and colHeaders are set', async() => {
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

  it('should use custom cell renderer if provided', async() => {
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

  it('should remove rows if they were removed in data source', async() => {
    spec().data.splice(8);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();
    expect(spec().$table.find('tbody tr').length).toBe(8);

    spec().data.splice(7);
    wt.draw();

    expect(spec().$table.find('tbody tr').length).toBe(7);
  });

  it('should render as much columns as the container width allows, if width is null', async() => {
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

  it('should render as much columns as the container width allows, if width is null (with row header)', async() => {
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

  it('should not trigger the "fastDraw" for oversized rows if none of the partially visible rows are rendered', async() => {
    const cellRenderer = jasmine.createSpy('cellRenderer');

    createDataArray(10, 5);
    spec().$wrapper.width(600).height(600);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      rowHeight: (row) => {
        return [40000, 30, 30, 40000, 30, 30, 30, 40000, 30, 30][row];
      },
      rowHeightByOverlayName: (row) => {
        return [40000, 30, 30, 40000, 30, 30, 30, 40000, 30, 30][row];
      },
      cellRenderer
    });

    wt.draw();

    cellRenderer.calls.reset();

    getTableMaster().find('.wtHolder').scrollTop(54615);

    await sleep(50);

    expect(cellRenderer).toHaveBeenCalledTimes(5); // one row of 5 cells
    expect(wt.getCell({ row: 3, col: 0 })).not.toBe(-2);
  });

  it('should not trigger the "fastDraw" for oversized columns if none of the partially visible columns are rendered', async() => {
    const cellRenderer = jasmine.createSpy('cellRenderer');

    createDataArray(5, 10);
    spec().$wrapper.width(600).height(600);

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      columnWidth: [40000, 30, 30, 40000, 30, 30, 30, 40000, 30, 30],
      cellRenderer
    });

    wt.draw();

    cellRenderer.calls.reset();

    getTableMaster().find('.wtHolder').scrollLeft(54615);

    await sleep(50);

    expect(cellRenderer).toHaveBeenCalledTimes(5); // one row of 5 cells
    expect(wt.getCell({ row: 0, col: 3 })).not.toBe(-2);
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

  it('should render enough rows to fill the viewport when the rows shrink between two draws (#6452)', async() => {
    // Rows 1-3 render 200px tall on the first draw (walkontable measures them as "oversized"),
    // and at the default height on the second one. The second draw must not keep the band
    // computed from the stale 200px records - it has to refill the 300px viewport.
    createDataArray(100, 4);
    spec().$wrapper.width(300).height(300);

    let tallRows = true;

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns,
      cellRenderer(row, column, TD) {
        TD.innerHTML = tallRows && row >= 1 && row <= 3
          ? `<div style="height: 200px">${getData(row, column)}</div>`
          : getData(row, column);
      },
    });

    wt.draw();

    // Sanity: the first draw measured the tall rows, so a full redraw with the same content
    // keeps a short band (23px + 3 * 200px already exceeds the 300px viewport).
    wt.draw();

    const renderedTallRowsCount = getTableMaster().find('tbody tr').length;

    expect(renderedTallRowsCount).toBeLessThanOrEqual(3);

    tallRows = false;
    wt.draw();

    const $rows = getTableMaster().find('tbody tr');
    const lastRowBottom = $rows.last()[0].getBoundingClientRect().bottom;
    const holderBottom = getTableMaster().find('.wtHolder')[0].getBoundingClientRect().bottom;

    // 300px / 23px default row height -> at least 13 rows are needed to fill the viewport.
    expect($rows.length).toBeGreaterThanOrEqual(13);
    expect(lastRowBottom).toBeGreaterThanOrEqual(holderBottom - 1);
  });

  it('should use column width function to get column width', async() => {
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

  it('should use column width array to get column width', async() => {
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

  it('should use column width integer to get column width', async() => {
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

  it('should use column width also when there are no rows', async() => {
    spec().data.length = 0;
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

  it('should render a cell that is outside of the viewport horizontally', async() => {
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

  it('should not render a cell when fastDraw == true', async() => {
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

  it('should not ignore fastDraw == true when grid was scrolled by amount of rows that doesn\'t exceed endRow', async() => {
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

  it('should ignore fastDraw == true when grid was scrolled by amount of rows that exceeds endRow', async() => {
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

  it('should not ignore fastDraw == true when grid was scrolled by amount of columns that doesn\'t exceed endColumn', async() => {
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

  it('should ignore fastDraw == true when grid was scrolled by amount of columns that exceeds endColumn', async() => {
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
    it('both left and right borders should be set on the first TH in the top overlay if `fixedColumns` is set but there are no `rowHeaders`', async() => {
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

  it('should render a table with overlays with corresponding backward compatible CSS classes', async() => {
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

  it('should not re-render the full table when the table has `display: none` declared', async() => {
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
  describe('post-render visible calculators when the rendered rows grow (DEV-406)', () => {
    // On the single-pass calculator path (uniform sizes, own-element scroll) the fully-visible row
    // band is computed BEFORE the cells render. When the rendered rows then measure TALLER than the
    // heights that band was built from, only the post-render `createVisibleCalculators()` pass can
    // correct it. Anything that rebuilds the row-height cache before that pass decides whether to
    // run makes the cache look current again, and the frame then reports a visible band measured
    // against the pre-render heights.
    function makeGrowingRowsWot(state) {
      const cellRenderer = jasmine.createSpy('cellRenderer').and.callFake((row, col, TD) => {
        if (state.tall && row < 3) {
          TD.innerHTML = '<div style="height: 200px"></div>';
        } else {
          TD.innerHTML = `r${row}c${col}`;
        }
      });
      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeightsUniform: () => true,
        columnWidthsUniform: () => true,
        cellRenderer,
      });

      return { wt, cellRenderer };
    }

    it('should report the grown rows in the visible row band on the same draw', async() => {
      spec().$wrapper.width(300).height(300);

      const state = { tall: false };
      const { wt } = makeGrowingRowsWot(state);

      wt.draw();

      // The scenario only exercises the post-render pass on the single-pass path.
      expect(wt.wtViewport.usesLayoutSnapshotForCalculators()).toBe(true);

      const beforeGrowDraw = wt.wtTable.getLastVisibleRow();

      state.tall = true;
      wt.draw();

      const afterGrowDraw = wt.wtTable.getLastVisibleRow();

      // The third draw is the oracle: the grown heights are recorded by then, so its very first
      // calculator pass is already built from them.
      wt.draw();

      expect(afterGrowDraw).not.toBe(beforeGrowDraw);
      expect(afterGrowDraw).toBe(wt.wtTable.getLastVisibleRow());
    });

    it('should render every cell of the grown band exactly once', async() => {
      spec().$wrapper.width(300).height(300);

      const state = { tall: false };
      const { wt, cellRenderer } = makeGrowingRowsWot(state);

      wt.draw();

      state.tall = true;
      cellRenderer.calls.reset();

      wt.draw();

      const renderedCoords = cellRenderer.calls.allArgs().map(([row, col]) => `${row},${col}`);

      // A refill pass would re-render the whole band, so a repeated coordinate is the signal that
      // the draw spent more than one cell-band render.
      expect(renderedCoords.length).toBeGreaterThan(0);
      expect(new Set(renderedCoords).size).toBe(renderedCoords.length);
    });
  });

  describe('refilled rendered row band (DEV-406)', () => {
    // The refill in `table/drawCycle.ts` takes a pass only when the proposed band grows the BOTTOM
    // edge - #6452 is an under-filled bottom. A proposal that only reaches HIGHER while its bottom
    // edge comes in must be declined: that is what a grid whose heights depend on the band being
    // rendered proposes on every scroll draw (virtualized merged cells), and the band it already
    // rendered is correct. A declined pass must leave the rendered band exactly as it was.
    it('should not refill when the proposal only moves the bottom edge inwards', async() => {
      createDataArray(100, 4);
      spec().$wrapper.width(300).height(300);

      const providedHeights = new Map();
      const state = { tallCells: false };

      const wt = walkontable({
        data: getData,
        totalRows: getTotalRows,
        totalColumns: getTotalColumns,
        rowHeight: row => providedHeights.get(row),
        rowHeightByOverlayName: row => providedHeights.get(row),
        cellRenderer(row, column, TD) {
          TD.innerHTML = state.tallCells && row >= 20
            ? `<div style="height: 100px">${getData(row, column)}</div>`
            : getData(row, column);
        },
      });

      wt.draw();

      getTableMaster().find('.wtHolder').scrollTop(460);

      await sleep(20);

      wt.draw();

      const firstRenderedRow = wt.wtTable.getFirstRenderedRow();
      const lastRenderedRow = wt.wtTable.getLastRenderedRow();
      const renderedRowsCount = getTableMaster().find('tbody tr').length;

      // The band has to start mid-table for the scenario to say anything.
      expect(firstRenderedRow).toBeGreaterThan(0);

      // The rows ABOVE the band grow, so the same scroll offset now proposes a band that starts
      // EARLIER, and the rows INSIDE the band grow, so that band ends EARLIER. The provided heights
      // change without invalidating the row-height cache, so this draw still computes its band from
      // the old heights and only the post-render measurement notices.
      for (let row = 0; row < 20; row++) {
        providedHeights.set(row, 60);
      }

      state.tallCells = true;

      wt.draw();

      expect(wt.wtTable.getFirstRenderedRow()).toBe(firstRenderedRow);
      expect(wt.wtTable.getLastRenderedRow()).toBe(lastRenderedRow);

      const $rows = getTableMaster().find('tbody tr');

      expect($rows.length).toBe(renderedRowsCount);
      expect($rows.first().find('td:first').text()).toBe(`${getData(firstRenderedRow, 0)}`);
      expect($rows.last().find('td:first').text()).toBe(`${getData(lastRenderedRow, 0)}`);
    });
  });
});
