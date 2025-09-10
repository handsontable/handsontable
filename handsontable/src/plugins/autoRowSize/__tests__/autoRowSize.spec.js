import { HyperFormula } from 'hyperformula';

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

  it('should apply auto size by default', async() => {
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

    handsontable({
      data: Handsontable.helper.createEmptySpreadsheetData(nrOfRows, 1),
      colWidths() {
        return columnWidth;
      },
      autoRowSize: true
    });

    const oldHeight = spec().$container[0].scrollHeight;

    await setDataAtCell(150, 0, 'This is very long text which will break this cell text into two lines');

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

      expect(newHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual((cellHeightInPx + 1) * nrOfRows);
        main.toEqual(cellHeightInPx * nrOfRows);
        horizon.toEqual(cellHeightInPx * nrOfRows);
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

      expect(newHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual((cellHeightInPx + 1) * nrOfRows);
        main.toEqual(cellHeightInPx * nrOfRows);
        horizon.toEqual(cellHeightInPx * nrOfRows);
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

      expect(newHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual((cellHeightInPx + 1) * nrOfRows);
        main.toEqual(cellHeightInPx * nrOfRows);
        horizon.toEqual(cellHeightInPx * nrOfRows);
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

      expect(newHeight).forThemes(({ classic, main, horizon }) => {
        classic.toEqual((cellHeightInPx + 1) * nrOfRows);
        main.toEqual(cellHeightInPx * nrOfRows);
        horizon.toEqual(cellHeightInPx * nrOfRows);
      });
    });
  });

  it('should correctly detect row height when table is hidden on init (display: none)', async() => {
    spec().$container.css('display', 'none');

    handsontable({
      data: arrayOfObjects(),
      rowHeaders: true,
      autoRowSize: true
    });

    await sleep(200);
    spec().$container.css('display', 'block');
    await render();

    expect(rowHeight(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(24);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(rowHeight(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(43);
      main.toBe(49);
      horizon.toBe(57);
    });

    expect(rowHeight(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(127);
      main.toBe(129);
      horizon.toBe(137);
    });
  });

  it('should be possible to disable plugin using updateSettings', async() => {
    handsontable({
      data: arrayOfObjects()
    });

    const height0 = rowHeight(spec().$container, 0);
    const height1 = rowHeight(spec().$container, 1);
    const height2 = rowHeight(spec().$container, 2);

    expect(height0).toBeLessThan(height1);
    expect(height1).toBeLessThan(height2);

    await updateSettings({
      autoRowSize: false
    });
    await setDataAtCell(0, 0, 'A\nB\nC');

    const height4 = rowHeight(spec().$container, 0);

    expect(height4).toBeGreaterThan(height0);
  });

  it('should be possible to enable plugin using updateSettings', async() => {
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

    await updateSettings({
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

    await selectCell(4, 0);
    await keyDownUp('enter');
    await sleep(100);
    await keyDownUp('enter');

    expect(getInlineStartClone().find('.wtHolder').scrollTop()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(216);
      horizon.toBe(264);
    });
    expect(getMaster().find('.wtHolder').scrollTop()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(90);
      main.toBe(216);
      horizon.toBe(264);
    });
  });

  it('should consider CSS style of each instance separately', async() => {
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

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', async() => {
    const $style = $('<style>.htCore.big-table td {font-size: 32px;line-height: 1.1}</style>').appendTo('head');

    handsontable({
      data: arrayOfObjects(),
      autoRowSize: true
    });
    const height = parseInt(getCell(2, 0).style.height, 10);

    spec().$container.find('table').addClass('big-table');
    getPlugin('autoRowSize').clearCache();

    await render();

    expect(parseInt(getCell(2, 0).style.height, 10)).toBeGreaterThan(height);

    $style.remove();
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoRowSize: true,
      rowHeights: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    await setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(69); // -1px of cell border
      main.toBe(70);
      horizon.toBe(70);
    });
  });

  // Currently columns.height is not supported
  xit('should not trigger autoRowSize when column height is defined (through columns.height)', async() => {
    handsontable({
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

    await setDataAtCell(0, 0, 'LongLongLongLong');

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(69); // -1px of cell border
  });

  it('should consider renderer that uses conditional formatting for specific row & column index', async() => {
    const data = arrayOfObjects();

    data.push({ id: '2', name: 'Rocket Man', lastName: 'In a tin can' });

    handsontable({
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

    expect(parseInt(getCell(1, 0).style.height || 0, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(242);
      main.toBe(241);
      horizon.toBe(241);
    });
  });

  it('should destroy temporary element', async() => {
    handsontable({
      autoRowSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should recalculate heights after column resize', async() => {
    handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualColumnResize: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    const manualColumnResizePlugin = getPlugin('manualColumnResize');

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(29);
      horizon.toBe(37);
    });

    await resizeColumn(1, 90);

    manualColumnResizePlugin.afterMouseDownTimeout(); // fix for misinterpretation of the double click event

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(42);
      main.toBe(49);
      horizon.toBe(57);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(63);
      main.toBe(89);
      horizon.toBe(97);
    });

    await resizeColumn(1, 50);

    manualColumnResizePlugin.afterMouseDownTimeout(); // fix for misinterpretation of the double click event

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(42);
      main.toBe(49);
      horizon.toBe(57);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(126);
      main.toBe(129);
      horizon.toBe(137);
    });

    await resizeColumn(1, 200);

    manualColumnResizePlugin.afterMouseDownTimeout();

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(49);
      horizon.toBe(57);
    });
  });

  it('should recalculate heights after column moved', async() => {
    handsontable({
      data: arrayOfObjects2(),
      colWidths: [250, 50],
      manualColumnMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    const plugin = getPlugin('manualColumnMove');

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(42); // -1px of cell border
      main.toBe(50);
      horizon.toBe(58);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(105); // -1px of cell border
      main.toBe(109);
      horizon.toBe(117);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
      horizon.toBeInArray([37, 63]);
    });

    plugin.moveColumn(0, 1);

    await render();

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(42);
      main.toBe(49);
      horizon.toBe(57);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(126);
      main.toBe(129);
      horizon.toBe(137);
    });
  });

  it('should recalculate heights with manualRowResize when changing text to multiline', async() => {
    handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49); // -1px of cell border
      main.toBe(50);
      horizon.toBe(50);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
      horizon.toBeInArray([37, 63]);
    });

    await setDataAtCell(1, 0, 'A\nB\nC\nD\nE');

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(105);
      main.toBe(109);
      horizon.toBe(117);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeInArray([22, 42]);
      main.toBeInArray([29, 49]);
      horizon.toBeInArray([37, 63]);
    });
  });

  it('should recalculate heights after moved row', async() => {
    handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualRowResize: [23, 50],
      manualRowMove: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22); // -1px of cell border
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49); // -1px of cell border
      main.toBe(50);
      horizon.toBe(50);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
      horizon.toBeInArray([37, 63]);
    });

    const plugin = getPlugin('manualRowMove');

    plugin.moveRow(1, 0);

    await render();

    expect(parseInt(getCell(0, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(49);
      main.toBe(50);
      horizon.toBe(50);
    });
    expect(parseInt(getCell(1, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(22);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(parseInt(getCell(2, -1).style.height, 10)).forThemes(({ classic, main, horizon }) => {
      classic.toBeInArray([22, 42]); // -1px of cell border
      main.toBeInArray([29, 49]);
      horizon.toBeInArray([37, 63]);
    });
  });

  it('should resize the column headers properly, according the their content sizes', async() => {
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

    expect(rowHeight(spec().$container, -1)).forThemes(({ classic, main, horizon }) => {
      classic.toBeAroundValue(65);
      main.toBeAroundValue(88);
      horizon.toBeAroundValue(96);
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

    expect(cloneLeft.height()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual(69);
      main.toEqual(79);
      horizon.toEqual(95);
    });
  });

  it('should not calculate any row heights, if there are no rows in the dataset', async() => {
    handsontable({
      data: [[1, 2]],
      colHeaders: true,
      autoRowSize: true,
    });

    spyOn(getPlugin('autoRowSize'), 'calculateRowsHeight').and.callThrough();
    const calculateColumnsWidth = getPlugin('autoRowSize').calculateRowsHeight;

    await loadData([]);

    expect(calculateColumnsWidth).not.toHaveBeenCalled();
  });

  it('should ignore calculate row heights for samples from hidden columns', async() => {
    const data = createSpreadsheetData(3, 5);

    data[0][2] = 'Very long text that causes the column to be wide';

    handsontable({
      data,
      colHeaders: true,
      autoRowSize: true,
    });

    const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);

    await render();

    expect(getRowHeight(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(30);
      horizon.toBe(38);
    });
    expect(getRowHeight(1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
    expect(getRowHeight(2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(29);
      horizon.toBe(37);
    });
  });

  it('should correctly apply the column widths to the measured row when the first column is hidden (#dev-569)', async() => {
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

    await render();

    expect(getRowHeight(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(23);
      main.toBe(30);
      horizon.toBe(38);
    });
  });

  it('should not throw error while traversing header\'s DOM elements', async() => {
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

  it('should not throw an error when `syncLimit` is smaller than total rows count (#dev-2318)', async() => {
    expect(() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        rowHeaders: true,
        colHeaders: true,
        autoRowSize: {
          syncLimit: 5
        },
      });
    }).not.toThrow();
  });

  it('should keep the viewport position unchanged after resetting all rows heights (#dev-1888)', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 400,
      height: 400,
      autoRowSize: true,
      rowHeaders: ['Longer <br> header <br> name'],
      colHeaders: true,
    });

    await scrollViewportTo(49, 0);

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(832);
      main.toBe(1135);
      horizon.toBe(1543);
    });

    await listen();
    await selectColumns(2, 2);
    await keyDownUp('delete');

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(832);
      main.toBe(1135);
      horizon.toBe(1543);
    });
  });

  it('should correctly calculate row heights for cell\'s content that produce ' +
     'heights with fractions (#dev-1926)', async() => {
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

    expect(getRowHeight(0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(35);
      horizon.toBe(43);
    });
    expect(getRowHeight(4)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(34);
      horizon.toBe(42);
    });
    expect(getRowHeight(9)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(34);
      horizon.toBe(42);
    });
    expect(getRowHeight(14)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(34);
      horizon.toBe(42);
    });
    expect(getRowHeight(19)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(26);
      main.toBe(34);
      horizon.toBe(42);
    });

    $(style).remove();
  });

  it('should not cause a misalignment between the first column and the first row header when scrolling horizontally (dev-2512)', async() => {
    const data = Array(1).fill().map(() => Array(20).fill('test'));

    for (let i = 5; i < 10; i++) {
      // The oversized entries have to fit exactly in the cells, so that adding a border to a cell will break the lines and make it higher.
      data[0][i] = '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';
    }

    handsontable({
      data,
      colHeaders: true,
      rowHeaders: true,
      autoRowSize: true,
      colWidths: 65,
      wordWrap: true,
      height: 500,
      width: 300,
    });

    await selectCell(0, 18);

    const rowHeaderHeight = getCell(0, -1, true).offsetHeight;
    const cellsHeight = getCell(0, 18, true).offsetHeight;

    expect(rowHeaderHeight).toBe(cellsHeight);
  });

  it.forTheme('main')('should not cause a misalignment between the first column and the first row ' +
    'header when scrolling horizontally (for the modern themes)', async() => {
    handsontable({
      data: [
        // 3rd cell content has to be exactly 83px
        ['test', 'test', 'xtv fvsxsvffkh', 'test', 'test', '', '', '', '', '', '', '', '', '', ''],
      ],
      colHeaders: true,
      rowHeaders: true,
      autoRowSize: true,
      colWidths: 100,
      wordWrap: true,
      height: 500,
      width: 300,
      fixedColumnsStart: 1,
      viewportColumnRenderingOffset: 0,
    });

    await scrollViewportTo(0, 2);

    expect(getCell(0, 0, true).offsetHeight).toBe(getCell(0, 3, true).offsetHeight);
  });

  it('should not cause a misalignment between the first column and the first row header when scrolling horizontally (with hidden columns) (dev-2512)', async() => {
    const data = Array(1).fill().map(() => Array(21).fill('test'));

    for (let i = 5; i < 10; i++) {
      // The oversized entries have to fit exactly in the cells, so that adding a border to a cell will break the lines and make it higher.
      data[0][i] = '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000';
    }

    handsontable({
      data,
      colHeaders: true,
      rowHeaders: true,
      autoRowSize: true,
      colWidths: 65,
      wordWrap: true,
      height: 500,
      width: 300,
      hiddenColumns: {
        columns: [0],
      },
    });

    await selectCell(0, 18);

    const rowHeaderHeight = getCell(0, -1, true).offsetHeight;
    const cellsHeight = getCell(0, 18, true).offsetHeight;

    expect(rowHeaderHeight).toBe(cellsHeight);
  });

  it.forTheme('classic')('should correctly render the fixed columns borders when ' +
    'scrolled horizontally (dev-2512)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 50),
      width: 500,
      height: 500,
      rowHeaders: true,
      colHeaders: true,
      autoRowSize: true,
      fixedColumnsStart: 1,
    });

    await scrollViewportHorizontally(500);

    expect(getComputedStyle(getCell(0, 0, true)).borderLeftWidth).toBe('1px');
  });

  describe('should work together with formulas plugin', () => {
    it('should calculate heights only once during the initialization of Handsontable with formulas plugin enabled', async() => {
      const beforeInit = function() {
        spyOn(this.getPlugin('autoRowSize').ghostTable, 'addRow').and.callThrough();
      };

      Handsontable.hooks.add('beforeInit', beforeInit);

      handsontable({
        data: [
          [42, '=A1'],
        ],
        autoRowSize: true,
        formulas: {
          engine: HyperFormula
        },
      });

      expect(getPlugin('autoRowSize').ghostTable.addRow).toHaveBeenCalledTimes(1);
      Handsontable.hooks.remove('beforeInit', beforeInit);
    });
  });
});
