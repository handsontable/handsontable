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

  /**
   * Third data row header height: auto-row-size may measure single-line or double-line
   * depending on column width and font metrics. Both are valid for any theme.
   *
   * @param {number} heightPx Measured row height.
   */
  function expectThirdRowHeaderHeightAmbiguous(heightPx) {
    const layout = getThemeLayout();
    const singleLine = layout.defaultDataRowHeight;
    const doubleLine = singleLine + layout.lineHeight;

    expect(heightPx).toBeInArray([singleLine, doubleLine]);
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

    await waitForNextAnimationFrames(2);

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

    await waitForNextAnimationFrames(2);

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

      await waitForNextAnimationFrames(2);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).toEqual((cellHeightInPx * nrOfRows) + 1);
    });

    it('(SYNC_CALCULATION_LIMIT + 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await waitForNextAnimationFrames(2);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).toEqual((cellHeightInPx * nrOfRows) + 1);
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP - 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await waitForNextAnimationFrames(2);

      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).toEqual((cellHeightInPx * nrOfRows) + 1);
    });

    it('(SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1 rows)', async() => {
      const nrOfRows = SYNC_CALCULATION_LIMIT + CALCULATION_STEP + 1;

      handsontable({
        data: createSpreadsheetData(nrOfRows, nrOfColumns),
        autoRowSize: true
      });

      await waitForNextAnimationFrames(2);
      const newHeight = spec().$container[0].scrollHeight;

      expect(newHeight).toEqual((cellHeightInPx * nrOfRows) + 1);
    });
  });

  it('should correctly detect row height when table is hidden on init (display: none)', async() => {
    spec().$container.css('display', 'none');

    handsontable({
      data: arrayOfObjects(),
      rowHeaders: true,
      autoRowSize: true
    });

    await waitForNextAnimationFrames(2);
    spec().$container.css('display', 'block');
    await render();

    expect(rowHeight(spec().$container, 0)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(rowHeight(spec().$container, 1)).toBe(getThemeLayout().e2eDensity_ed183d57c9());

    expect(rowHeight(spec().$container, 2)).toBe(getThemeLayout().e2eDensity_5e8f2219da());
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
    // TODO(theme-agnostic): row heights and scroll positions depend on font metrics
    if (getLoadedTheme() !== 'main') {
      return;
    }

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
      autoRowSize: true,
      viewportColumnRenderingOffset: 10,
      viewportRowRenderingOffset: 10,
    });

    await selectCell(4, 0);
    await keyDownUp('enter');
    await waitForNextAnimationFrames(2);
    await keyDownUp('enter');

    expect(getInlineStartClone().find('.wtHolder').scrollTop()).toBe(216);
    expect(getMaster().find('.wtHolder').scrollTop()).toBe(216);
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

    expect(hot1.getCell(0, 0).offsetHeight)
      .toEqual(hot2.getCell(0, 0).offsetHeight);

    $container1.addClass('big');
    hot1.render();
    hot2.render();

    expect(hot1.getCell(2, 0).offsetHeight)
      .toBeGreaterThan(hot2.getCell(2, 0).offsetHeight);

    $container1.removeClass('big');
    hot1.render();
    $container2.addClass('big');
    hot2.render();

    expect(hot1.getCell(2, 0).offsetHeight)
      .toBeLessThan(hot2.getCell(2, 0).offsetHeight);

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

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(70);
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

    expect(parseInt(getCell(1, 0).style.height || 0, 10)).toBe(getThemeLayout().e2eDensity_9d03a9eba0());
  });

  it('should destroy temporary element', async() => {
    handsontable({
      autoRowSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should recalculate heights after column resize', async() => {
    // TODO(theme-agnostic): row heights and scroll positions depend on font metrics
    if (getLoadedTheme() !== 'main') {
      return;
    }

    handsontable({
      data: arrayOfObjects2(),
      colWidths: 250,
      manualColumnResize: true,
      autoRowSize: true,
      rowHeaders: true,
      colHeaders: true
    });

    const manualColumnResizePlugin = getPlugin('manualColumnResize');

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(parseInt(getCell(2, -1).style.height, 10)).toBe(getThemeLayout().defaultDataRowHeight);

    await resizeColumn(1, 90);

    manualColumnResizePlugin.afterMouseDownTimeout(); // fix for misinterpretation of the double click event

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_ed183d57c9());
    expect(parseInt(getCell(2, -1).style.height, 10)).toBe(89);

    await resizeColumn(1, 50);

    manualColumnResizePlugin.afterMouseDownTimeout(); // fix for misinterpretation of the double click event

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_ed183d57c9());
    expect(parseInt(getCell(2, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_5e8f2219da());

    await resizeColumn(1, 200);

    manualColumnResizePlugin.afterMouseDownTimeout();

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(parseInt(getCell(2, -1).style.height, 10)).toBe(49);
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

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_682da48dd2());
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_1369f821b5());
    expectThirdRowHeaderHeightAmbiguous(parseInt(getCell(2, -1).style.height, 10));

    plugin.moveColumn(0, 1);

    await render();

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_ed183d57c9());
    expect(parseInt(getCell(2, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_5e8f2219da());
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

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(50);
    expectThirdRowHeaderHeightAmbiguous(parseInt(getCell(2, -1).style.height, 10));

    await setDataAtCell(1, 0, 'A\nB\nC\nD\nE');

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().e2eDensity_1369f821b5());
    expectThirdRowHeaderHeightAmbiguous(parseInt(getCell(2, -1).style.height, 10));
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

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(50);
    expectThirdRowHeaderHeightAmbiguous(parseInt(getCell(2, -1).style.height, 10));

    const plugin = getPlugin('manualRowMove');

    plugin.moveRow(1, 0);

    await render();

    expect(parseInt(getCell(0, -1).style.height, 10)).toBe(50);
    expect(parseInt(getCell(1, -1).style.height, 10)).toBe(getThemeLayout().defaultDataRowHeight);
    expectThirdRowHeaderHeightAmbiguous(parseInt(getCell(2, -1).style.height, 10));
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

    expect(rowHeight(spec().$container, -1)).toBeAroundValue(getThemeLayout().e2eDensity_9b92431d49());
  });

  it('should properly count height', async() => {
    handsontable({
      data: [['Tomek', 'Tomek\nTomek', 'Romek\nRomek']],
      rowHeaders: true,
      colHeaders: true,
      autoRowSize: true,
    });

    await waitForNextAnimationFrames(2);

    const cloneLeft = spec().$container.find('.handsontable.ht_clone_inline_start .wtHider');

    expect(cloneLeft.height()).toEqual(getThemeLayout().e2eDensity_a24230f0bc());
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

    expect(getRowHeight(0)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(getRowHeight(1)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(getRowHeight(2)).toBe(getThemeLayout().defaultDataRowHeight);
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

    expect(getRowHeight(0)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
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
    // TODO(theme-agnostic): row heights and scroll positions depend on font metrics
    if (getLoadedTheme() !== 'main') {
      return;
    }

    handsontable({
      data: createSpreadsheetData(50, 10),
      width: 400,
      height: 400,
      autoRowSize: true,
      rowHeaders: ['Longer <br> header <br> name'],
      colHeaders: true,
    });

    await scrollViewportTo(49, 0);

    expect(topOverlay().getScrollPosition()).toBe(1135);

    await listen();
    await selectColumns(2, 2);
    await keyDownUp('delete');

    expect(topOverlay().getScrollPosition()).toBe(1135);
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

    const layout = getThemeLayout();
    // The 24.5px label is forced via CSS. The row height is whichever is taller:
    // the label-derived height or the default row height from tokens.
    // When autoRowSize drives the height, the first-row border compensation does not
    // apply separately -- the measured height already includes the border.
    const labelDerivedRow = Math.ceil(24.5) + (2 * layout.cellVerticalPadding) + layout.cellBorderWidth;
    const expectedRow = Math.max(labelDerivedRow, layout.defaultDataRowHeight);

    expect(getRowHeight(0)).toBeAroundValue(expectedRow, 1);
    expect(getRowHeight(4)).toBe(expectedRow);
    expect(getRowHeight(9)).toBe(expectedRow);
    expect(getRowHeight(14)).toBe(expectedRow);
    expect(getRowHeight(19)).toBe(expectedRow);

    $(style).remove();
  });

  it('should not cause a misalignment between the first column and the first row header when scrolling horizontally (dev-2512)', async() => {
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

    expect(getCell(0, 0, true).offsetHeight).toBe(getCell(0, 2, true).offsetHeight);
  });

  it('should not cause a misalignment between the first column and the first row header when scrolling horizontally (with hidden columns) (dev-2512)', async() => {
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
      fixedColumnsStart: 2,
      hiddenColumns: {
        columns: [0],
      },
      viewportColumnRenderingOffset: 0,
    });

    await scrollViewportTo(0, 2);

    expect(getCell(0, 1, true).offsetHeight).toBe(getCell(0, 2, true).offsetHeight);
  });

  it('should correctly render the fixed columns borders when ' +
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

  it('should add css class to the .ht-wrapper when plugin is enabled', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoRowSize: true,
    });

    expect(spec().$container.find('.ht-wrapper').hasClass('htAutoRowSize')).toBe(true);
  });

  it('should remove css class from the .ht-wrapper when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      autoRowSize: true,
    });

    expect(spec().$container.find('.ht-wrapper').hasClass('htAutoRowSize')).toBe(true);

    await updateSettings({
      autoRowSize: false,
    });

    expect(spec().$container.find('.ht-wrapper').hasClass('htAutoRowSize')).toBe(false);
  });

  it('should calculate row heights correctly when `valueFormatter` is used', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      autoRowSize: true,
      valueFormatter: () => 'new \nformatted\n value',
    });

    expect(getRowHeight(1)).toBeGreaterThan(getDefaultRowHeight());
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
