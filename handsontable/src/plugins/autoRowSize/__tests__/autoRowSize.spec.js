describe('AutoRowSize', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  /**
   *
   */
  function arrayOfObjects() {
    return [
      { id: 'Short' },
      { id: 'Somewhat\nlong' },
      { id: 'The\nvery\nvery\nvery\nlongest one' }
    ];
  }
  /**
   *
   */
  function arrayOfObjects2() {
    return [
      { id: 'Short', name: 'Somewhat long' },
      { id: 'Somewhat long', name: 'The very very longest one' },
      { id: 'The very very very longest one', name: 'Short' }
    ];
  }

  it('should apply auto size by default', () => {
    handsontable({
      data: arrayOfObjects()
    });

    const height0 = rowHeight(spec().$container, 0);
    const height1 = rowHeight(spec().$container, 1);
    const height2 = rowHeight(spec().$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should draw scrollbar correctly (proper height) after calculation when autoRowSize option is set (long text in row) #4000', async() => {
    const row = ['This is very long text which will break this cell text into two lines'];
    const data = [];
    const nrOfRows = 200;
    const columnWidth = 100;

    for (let i = 0; i < nrOfRows; i += 1) {
      data.push(row);
    }

    handsontable({
      data,
      colWidths() {
        return columnWidth;
      },
      autoRowSize: true
    });

    const oldHeight = spec().$container[0].scrollHeight;

    await sleep(200);

    const newHeight = spec().$container[0].scrollHeight;

    expect(oldHeight).toBeLessThanOrEqual(newHeight);
  });

  it('should draw scrollbar correctly (proper height) after calculation when autoRowSize option is set ' +
    '(value of an empty cell outside the viewport is changed to a longer text)', async() => {
    const nrOfRows = 200;
    const columnWidth = 100;

    const hot = handsontable({
      data: Handsontable.helper.createEmptySpreadsheetData(nrOfRows, 1),
      colWidths() {
        return columnWidth;
      },
      autoRowSize: true
    });

    const oldHeight = spec().$container[0].scrollHeight;

    hot.setDataAtCell(150, 0, 'This is very long text which will break this cell text into two lines');

    await sleep(200);

    const newHeight = spec().$container[0].scrollHeight;

    expect(oldHeight).toBeLessThan(newHeight);
  });

  describe('should draw scrollbar correctly (proper height) after calculation when autoRowSize option ' +
           'is set (`table td` element height set by CSS) #4000', () => {
    const cellHeightInPx = 100;
    const nrOfColumns = 200;
    let style;

    const SYNC_CALCULATION_LIMIT = Handsontable.plugins.AutoRowSize.SYNC_CALCULATION_LIMIT;
    const CALCULATION_STEP = Handsontable.plugins.AutoRowSize.CALCULATION_STEP;

    beforeEach(function() {
      if (!this.$container) {
        this.$container = $(`<div id="${id}"></div>`).appendTo('body');
      }

      const css = `.handsontable table td { height: ${cellHeightInPx}px !important }`;
      const head = document.head;

      style = document.createElement('style');
      style.type = 'text/css';

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }

      $(head).append(style);
    });

    afterEach(function() {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }

      if (style) {
        $(style).remove();
      }
    });

    it('(SYNC_CALCULATION_LIMIT - 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT - 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await sleep(200);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).forThemes(({ classic, main }) => {
        classic.toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        main.toEqual(((cellHeightInPx * nrOfRows) + 1));
      });
    });

    it('(SYNC_CALCULATION_LIMIT + 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await sleep(200);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).forThemes(({ classic, main }) => {
        classic.toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        main.toEqual(((cellHeightInPx * nrOfRows) + 1));
      });
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await sleep(200);

      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).forThemes(({ classic, main }) => {
        classic.toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        main.toEqual(((cellHeightInPx * nrOfRows) + 1));
      });
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await sleep(200);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).forThemes(({ classic, main }) => {
        classic.toEqual((((cellHeightInPx + 1) * nrOfRows) + 1));
        main.toEqual(((cellHeightInPx * nrOfRows) + 1));
      });
    });
  });

  it('should correctly detect row height when table is hidden on init (display: none)', async() => {
    spec().$container.css('display', 'none');
    const hot = handsontable({
      data: arrayOfObjects(),
      rowHeaders: true,
      autoRowSize: true
    });

    await sleep(200);
    spec().$container.css('display', 'block');
    hot.render();

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main }) => {
      classic.toBe(24);
      main.toBe(30);
    });
    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main }) => {
      classic.toBe(43);
      main.toBe(49);
    });

    expect(rowHeight(spec().$container, 2)).forThemes(({ classic, main }) => {
      classic.toBe(127);
      main.toBe(129);
    });
  });

  it('should be possible to disable plugin using updateSettings', () => {
    const hot = handsontable({
      data: arrayOfObjects()
    });

    const height0 = rowHeight(spec().$container, 0);
    const height1 = rowHeight(spec().$container, 1);
    const height2 = rowHeight(spec().$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);

    updateSettings({
      autoRowSize: false
    });
    hot.setDataAtCell(0, 0, 'A\nB\nC');

    const height4 = rowHeight(spec().$container, 0);

    expect(height4).toBeGreaterThan(height0);
  });

  it('should be possible to enable plugin using updateSettings', () => {
    handsontable({
      data: arrayOfObjects(),
      autoRowSize: false
    });

    let height0 = parseInt(getCell(0, 0).style.height, 10);
    let height1 = parseInt(getCell(1, 0).style.height, 10);
    let height2 = parseInt(getCell(2, 0).style.height, 10);

    expect(height0).toEqual(height1);
    expect(height0).toEqual(height2);
    expect(height1).toEqual(height2);

    updateSettings({
      autoRowSize: true
    });

    height0 = parseInt(getCell(0, 0).style.height, 10);
    height1 = parseInt(getCell(1, 0).style.height, 10);
    height2 = parseInt(getCell(2, 0).style.height, 10);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);
  });

  it('should sync inline start overlay with the main table after updating the last cell with new value (#7102)', async() => {
    handsontable({
      data: [
        ['A long text'],
        ['A very long text'],
        ['A very very long text'],
        ['A very very long text'],
        ['A very very long text'],
      ],
      rowHeaders: true,
      colHeaders: true,
      colWidths: 50,
      height: 300,
      autoRowSize: true
    });

    selectCell(4, 0);
    keyDownUp('enter');

    await sleep(100);

    keyDownUp('enter');

    expect(getInlineStartClone().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
      classic.toBe(90);
      main.toBe(216);
    });
    expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main }) => {
      classic.toBe(90);
      main.toBe(216);
    });
  });

  it('should consider CSS style of each instance separately', () => {
    const $style = $('<style>.big .htCore td {font-size: 40px;line-height: 1.1}</style>').appendTo('head');
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    const hot1 = $container1.handsontable('getInstance');
    const hot2 = $container2.handsontable('getInstance');

    expect(parseInt(hot1.getCell(0, 0).style.height, 10))
      .toEqual(parseInt(hot2.getCell(0, 0).style.height, 10));

    $container1.addClass('big');
    hot1.render();
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height, 10))
      .toBeGreaterThan(parseInt(hot2.getCell(2, 0).style.height, 10));

    $container1.removeClass('big');
    hot1.render();
    $container2.addClass('big');
    hot2.render();

    expect(parseInt(hot1.getCell(2, 0).style.height, 10))
      .toBeLessThan(parseInt(hot2.getCell(2, 0).style.height, 10));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', () => {
    const $style = $('<style>.htCore.big-table td {font-size: 32px;line-height: 1.1}</style>').appendTo('head');

    const hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    const height = parseInt(hot.getCell(2, 0).style.height, 10);

    spec().$container.find('table').addClass('big-table');
    hot.getPlugin('autoRowSize').clearCache();
    render();
    expect(parseInt(hot.getCell(2, 0).style.height, 10)).toBeGreaterThan(height);

    $style.remove();
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', () => {
    const hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(69); // -1px of cell border
      main.toBe(70);
    });
  });

  // Currently columns.height is not supported
  xit('should not trigger autoRowSize when column height is defined (through columns.height)', () => {
    const hot = handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: 77,
      columns: [
        { height: 70 },
        { height: 70 },
        { height: 70 }
      ],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).toBe(69); // -1px of cell border
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', () => {
    const data = arrayOfObjects();

    data.push({ id: '2', name: 'Rocket Man', lastName: 'In a tin can' });

    const hot = handsontable({
      data,
      columns: [
        { data: 'id' },
        { data: 'name' }
      ],
      autoRowSize: true,
      renderer(instance, td, row, col, ...args) {
        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, ...args]);

        if (row === 1 && col === 0) {
          td.style.padding = '100px';
        }
      }
    });

    expect(parseInt(hot.getCell(1, 0).style.height || 0, 10)).forThemes(({ classic, main }) => {
      classic.toBe(242);
      main.toBe(241);
    });
  });

  it('should destroy temporary element', () => {
    handsontable({
      autoRowSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should recalculate heights after column resize', function() {
    const hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualColumnResize: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
    });

    resizeColumn.call(this, 1, 90);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(42);
      main.toBe(49);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(63);
      main.toBe(89);
    });

    resizeColumn.call(this, 1, 50);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(42);
      main.toBe(49);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(126);
      main.toBe(129);
    });

    resizeColumn.call(this, 1, 200);

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(49);
    });
  });

  it('should recalculate heights after column moved', () => {
    const hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: [250, 50],
      manualColumnMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    const plugin = hot.getPlugin('manualColumnMove');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(42); // -1px of cell border
      main.toBe(49);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(105); // -1px of cell border
      main.toBe(109);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
    });

    plugin.moveColumn(0, 1);
    hot.render();

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(42);
      main.toBe(49);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(126);
      main.toBe(129);
    });
  });

  it('should recalculate heights with manualRowResize when changing text to multiline', () => {
    const hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(49); // -1px of cell border
      main.toBe(50);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
    });

    hot.setDataAtCell(1, 0, 'A\nB\nC\nD\nE');

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(105);
      main.toBe(109);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBeInArray([22, 42]);
      main.toBeInArray([29, 49]);
    });
  });

  it('should recalculate heights after moved row', () => {
    const hot = handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      manualRowMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(49); // -1px of cell border
      main.toBe(50);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
    });

    const plugin = hot.getPlugin('manualRowMove');

    plugin.moveRow(1, 0);
    hot.render();

    expect(parseInt(hot.getCell(0, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(49);
      main.toBe(50);
    });
    expect(parseInt(hot.getCell(1, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBe(22);
      main.toBe(29);
    });
    expect(parseInt(hot.getCell(2, -1).style.height, 10)).forThemes(({ classic, main }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
    });
  });

  it('should resize the column headers properly, according the their content sizes', () => {
    handsontable({
      data: createSpreadsheetData(30, 30),
      colHeaders(index) {
        if (index === 22) {
          return 'a<br>much<br>longer<br>label';
        }

        return 'test';
      },
      autoRowSize: true,
      rowHeaders: true,
      width: 300,
      height: 300
    });

    expect(rowHeight(spec().$container, -1)).forThemes(({ classic, main }) => {
      classic.toBeAroundValue(65);
      main.toBeAroundValue(88);
    });
  });

  it('should properly count height', async() => {
    handsontable({
      data: [['Tomek', 'Tomek\nTomek', 'Romek\nRomek']],
      rowHeaders: true,
      colHeaders: true,
      autoRowSize: true,
    });

    await sleep(300);

    const cloneLeft = spec().$container.find('.handsontable.ht_clone_inline_start .wtHider');

    expect(cloneLeft.height()).forThemes(({ classic, main }) => {
      classic.toEqual(70);
      main.toEqual(79);
    });
  });

  it('should not calculate any row heights, if there are no rows in the dataset', () => {
    handsontable({
      data: [[1, 2]],
      colHeaders: true,
      autoRowSize: true,
    });

    spyOn(getPlugin('autoRowSize'), 'calculateRowsHeight').and.callThrough();
    const calculateColumnsWidth = getPlugin('autoRowSize').calculateRowsHeight;

    loadData([]);

    expect(calculateColumnsWidth).not.toHaveBeenCalled();
  });

  it('should ignore calculate row heights for samples from hidden columns', () => {
    const data = createSpreadsheetData(3, 5);

    data[0][2] = 'Very long text that causes the column to be wide';

    handsontable({
      data,
      colHeaders: true,
      autoRowSize: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);
    render();

    expect(getRowHeight(0)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
    expect(getRowHeight(1)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
    expect(getRowHeight(2)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
  });

  it('should correctly apply the column widths to the measured row when the first column is hidden (#dev-569)', () => {
    const data = createSpreadsheetData(1, 6);

    data[0][2] = 'Some text';
    data[0][4] = 'Some longer text';
    data[0][5] = 'Very long text that causes the column to be wide';

    handsontable({
      data,
      colHeaders: true,
      autoRowSize: true,
      autoColumnSize: true, // this is required to replicate the issue
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    render();

    expect(getRowHeight(0)).forThemes(({ classic, main }) => {
      classic.toBe(23);
      main.toBe(29);
    });
  });

  it('should not throw error while traversing header\'s DOM elements', () => {
    const onErrorSpy = spyOn(window, 'onerror');

    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: true,
      autoRowSize: true,
      afterGetColHeader(column, TH) {
        const TR = TH.parentNode;

        return TR.parentNode; // TH element hadn't parent until fix introduction within #7424.
      }
    });

    expect(onErrorSpy).not.toHaveBeenCalled();
  });

  it('should keep the viewport position unchanged after resetting all rows heights (#dev-1888)', () => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 400,
      height: 400,
      autoRowSize: true,
      rowHeaders: ['Longer <br> header <br> name'],
      colHeaders: true,
    });

    scrollViewportTo(49, 0);

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(833);
      main.toBe(1135);
    });

    selectColumns(2, 2);
    listen();
    keyDownUp('delete');

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
      classic.toBe(833);
      main.toBe(1135);
    });
  });

  it('should correctly calculate row heights for cell\'s content that produce ' +
     'heights with fractions (#dev-1926)', () => {
    const css = '.handsontable .htCheckboxRendererLabel { height: 24.5px !important }'; // creates cell height with
    // fraction
    const head = document.head;
    const style = document.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    $(head).append(style);

    handsontable({
      data: createSpreadsheetObjectData(20, 1).map((row) => {
        row.prop0 = false;

        return row;
      }),
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true,
      columns: [
        {
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'prop0',
          }
        }
      ],
    });

    expect(getRowHeight(0)).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(34);
    });
    expect(getRowHeight(4)).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(34);
    });
    expect(getRowHeight(9)).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(34);
    });
    expect(getRowHeight(14)).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(34);
    });
    expect(getRowHeight(19)).forThemes(({ classic, main }) => {
      classic.toBe(26);
      main.toBe(34);
    });

    $(style).remove();
  });
});
