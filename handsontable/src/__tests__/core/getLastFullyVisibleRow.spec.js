describe('Core.getLastFullyVisibleRow', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return last fully visible row index', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    expect(getLastFullyVisibleRow()).toBe(expectedLastFullyVisibleRow(250, 0));
  });

  it('should return last fully visible and not hidden row index', async() => {
    const hiddenCount = 2;

    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    const rowMapper = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    rowMapper.setValueAtIndex(0, true);
    rowMapper.setValueAtIndex(1, true);
    await render();

    expect(getLastFullyVisibleRow()).toBe(expectedLastFullyVisibleRow(250, 0) + hiddenCount);
  });

  it('should return last fully visible row index (scrolled viewport)', async() => {
    handsontable({
      data: createSpreadsheetData(100, 10),
      width: 200,
      height: 250,
    });

    // scroll so that row 15 is at the top of the viewport
    await scrollViewportTo({ row: 15, col: 0, verticalSnap: 'top', horizontalSnap: 'start' });
    await render();

    // last fully visible = start row + number of fully visible rows minus 1
    expect(getLastFullyVisibleRow()).toBe(15 + expectedLastFullyVisibleRow(250, 0));
  });

  /**
   * The columns fit in the grid, so no horizontal scrollbar is part of the height.
   *
   * @param {number} rowHeight The uniform data-row height.
   * @param {number} headerBand The column-header band the grid should have rendered.
   * @returns {number} `getLastFullyVisibleRow()` right after init.
   */
  function lastRowOnFirstDraw(rowHeight, headerBand) {
    const holder = spec().$container.find('.ht_master .wtHolder')[0];
    const thead = spec().$container.find('.ht_master table.htCore thead')[0];

    expect(holder.offsetHeight - holder.clientHeight).toBe(0);
    expect(thead.offsetHeight).toBe(headerBand);

    const geometric = Math.floor((holder.clientHeight - thead.offsetHeight) / rowHeight) - 1;
    const afterInit = getLastFullyVisibleRow();

    expect(afterInit).toBe(geometric);

    return afterInit;
  }

  it('should count the column header in the last fully visible row on the first draw', async() => {
    const theme = getThemeLayout();
    const rowHeight = theme.defaultDataRowHeight;
    const headerBand = theme.columnHeaderBandHeight(1);
    // The data area lands one pixel short of the next row. A header total that drops the
    // top gridline then reports one row too many, and a total of 0 does too.
    const height = headerBand + (6 * rowHeight) - 1;

    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 600,
      height,
      colHeaders: true,
      // A number keeps every column one width and leaves AutoColumnSize off. That hook is
      // what keeps a default grid off the layout-snapshot path.
      colWidths: 80,
    });

    const afterInit = lastRowOnFirstDraw(rowHeight, headerBand);

    await render();

    expect(getLastFullyVisibleRow()).toBe(afterInit);
  });

  it('should count a taller column header in the last fully visible row on the first draw', async() => {
    const rowHeight = getThemeLayout().defaultDataRowHeight;
    const headerBand = 50;
    // Exactly six data rows fit. A header total of 0 reports a later row. A total that
    // adds a gridline the inline height already contains reports one row too few.
    const height = headerBand + (6 * rowHeight);

    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 600,
      height,
      colHeaders: true,
      colWidths: 80,
      columnHeaderHeight: headerBand,
    });

    const afterInit = lastRowOnFirstDraw(rowHeight, headerBand);

    await render();

    expect(getLastFullyVisibleRow()).toBe(afterInit);
  });

  it('should count two column header levels in the last fully visible row on the first draw', async() => {
    const rowHeight = getThemeLayout().defaultDataRowHeight;
    const headerLevels = [45, 60];
    const headerBand = headerLevels[0] + headerLevels[1];
    // Exactly six data rows fit, same boundary as the single taller header.
    const height = headerBand + (6 * rowHeight);

    handsontable({
      data: createSpreadsheetData(40, 5),
      width: 600,
      height,
      colHeaders: true,
      colWidths: 80,
      columnHeaderHeight: headerLevels,
      afterGetColumnHeaderRenderers(array) {
        array.push((index, TH) => {
          TH.textContent = `${index}`;
        });

        return array;
      },
    });

    const afterInit = lastRowOnFirstDraw(rowHeight, headerBand);

    await render();

    expect(getLastFullyVisibleRow()).toBe(afterInit);
  });

  /**
   * Values a caller can read after the grid has drawn.
   *
   * @param {boolean} autoRowSize `true` when the AutoRowSize plugin measured the header.
   * @returns {object}
   */
  function contentHeaderSnapshot(autoRowSize) {
    const holder = spec().$container.find('.ht_master .wtHolder')[0];
    const thead = spec().$container.find('.ht_master table.htCore thead')[0];
    const snapshot = {
      lastFullyVisibleRow: getLastFullyVisibleRow(),
      visibleRows: countVisibleRows(),
      renderedRows: countRenderedRows(),
      columnHeaderHeight: hot().view.getColumnHeaderHeight(),
      theadHeight: thead.offsetHeight,
      horizontalScrollbar: holder.offsetHeight - holder.clientHeight,
      verticalScrollbar: holder.offsetWidth - holder.clientWidth,
    };

    if (autoRowSize) {
      snapshot.measuredHeaderHeight = getPlugin('autoRowSize').getColumnHeaderHeight();
    }

    return snapshot;
  }

  it('should match a later render for a content-sized column header on the first draw', async() => {
    // A header that is one pixel off changes the last fully visible row only at some heights.
    const columns = 4;
    const colHeaders = Array.from({ length: columns }, () => 'A<br>B');
    const mismatches = [];

    for (const autoRowSize of [false, true]) {
      for (let height = 250; height <= 320; height += 1) {
        handsontable({
          data: createSpreadsheetData(40, columns),
          width: 600,
          height,
          colHeaders,
          colWidths: 80,
          autoRowSize,
        });

        const init = contentHeaderSnapshot(autoRowSize);

        await render();

        const afterRender = contentHeaderSnapshot(autoRowSize);

        if (JSON.stringify(init) !== JSON.stringify(afterRender)) {
          mismatches.push({ autoRowSize, height, init, afterRender });
        }

        destroy();
      }
    }

    expect(mismatches).toEqual([]);
  }, 180000);

  it('should keep nested header level heights and the first-draw row when auto row size is on', async() => {
    const theme = getThemeLayout();
    const levelHeight = theme.defaultDataRowHeight;
    const painted = [
      levelHeight + theme.cellBorderWidth,
      levelHeight,
      levelHeight,
    ];
    const nestedHeaders = [
      [{ label: 'A', colspan: 2 }, { label: 'B', colspan: 2 }],
      ['A1', 'A2', 'B1', 'B2'],
      ['a', 'b', 'c', 'd'],
    ];

    handsontable({
      data: createSpreadsheetData(40, 4),
      width: 600,
      height: 300,
      colWidths: 80,
      autoRowSize: true,
      nestedHeaders,
    });

    const rows = spec().$container.find('.ht_master table.htCore thead tr');

    expect(getPlugin('autoRowSize').getColumnHeaderHeight()).toBe(levelHeight);
    expect([rows[0].offsetHeight, rows[1].offsetHeight, rows[2].offsetHeight]).toEqual(painted);
    expect(hot().view.getColumnHeaderHeight()).toBe(painted[0] + painted[1] + painted[2]);

    destroy();

    const mismatches = [];

    for (let height = 250; height <= 320; height += 1) {
      handsontable({
        data: createSpreadsheetData(40, 4),
        width: 600,
        height,
        colWidths: 80,
        autoRowSize: true,
        nestedHeaders,
      });

      const init = contentHeaderSnapshot(true);

      await render();

      const afterRender = contentHeaderSnapshot(true);

      if (JSON.stringify(init) !== JSON.stringify(afterRender)) {
        mismatches.push({ height, init, afterRender });
      }

      destroy();
    }

    expect(mismatches).toEqual([]);
  }, 180000);

  /**
   * Heights where the first draw disagrees with a later `render()`.
   *
   * Same reading as the content-sized sweep above. A header that is one pixel off moves the
   * last fully visible row only at some heights, so the range is wider than one data row.
   *
   * @param {object} settings Handsontable settings, without `height`.
   * @returns {Promise<object[]>}
   */
  async function firstDrawMismatches(settings) {
    const mismatches = [];

    for (let height = 250; height <= 320; height += 1) {
      handsontable({
        ...settings,
        height,
      });

      const init = contentHeaderSnapshot(false);

      await render();

      const afterRender = contentHeaderSnapshot(false);

      if (JSON.stringify(init) !== JSON.stringify(afterRender)) {
        mismatches.push({ height, init, afterRender });
      }

      destroy();
    }

    return mismatches;
  }

  it('should match a later render when only the frozen start column header is two lines tall', async() => {
    const columns = 20;
    const colHeaders = [];

    for (let column = 0; column < columns; column++) {
      colHeaders.push(column === 0 ? 'A<br>B' : 'A');
    }

    // The rendered band walks backward until the viewport is full, and one column of render
    // offset reaches a single frozen column. More columns than the viewport holds, and a
    // render offset of 0, leave column 0 to the frozen-start range.
    const mismatches = await firstDrawMismatches({
      data: createSpreadsheetData(40, columns),
      width: 600,
      colWidths: 80,
      colHeaders,
      fixedColumnsStart: 1,
      viewportColumnRenderingOffset: 0,
    });

    expect(mismatches).toEqual([]);
  }, 180000);

  it('should match a later render when a hidden column shifts the tall column header', async() => {
    // One renderable column, so the index the probe walks is 0. That is visual column 1.
    const mismatches = await firstDrawMismatches({
      data: createSpreadsheetData(40, 2),
      width: 600,
      colWidths: 80,
      colHeaders: ['A', 'A<br>B'],
      hiddenColumns: { columns: [0] },
    });

    expect(mismatches).toEqual([]);
  }, 180000);

  it('should match a later render when only the frozen end column header is two lines tall', async() => {
    const columns = 20;
    const colHeaders = [];

    for (let column = 0; column < columns; column++) {
      colHeaders.push(column === columns - 1 ? 'A<br>B' : 'A');
    }

    // The scroll band and its one-column reach stop short of the last column. The frozen-end
    // range is what measures it.
    const mismatches = await firstDrawMismatches({
      data: createSpreadsheetData(40, columns),
      width: 600,
      colWidths: 80,
      colHeaders,
      fixedColumnsEnd: 1,
    });

    expect(mismatches).toEqual([]);
  }, 180000);

  it('should match a later render when a modifyColumnHeaderHeight listener returns 50', async() => {
    // A listener's number is the height the header row is given. The first draw used to add
    // one gridline on top of it, so the band was 51 while the THEAD rendered 50.
    const mismatches = await firstDrawMismatches({
      data: createSpreadsheetData(40, 5),
      width: 600,
      colHeaders: true,
      colWidths: 80,
      modifyColumnHeaderHeight() {
        return 50;
      },
    });

    expect(mismatches).toEqual([]);
  }, 180000);
});
