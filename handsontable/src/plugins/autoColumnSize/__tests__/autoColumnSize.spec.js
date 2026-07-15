import { HyperFormula } from 'hyperformula';

describe('AutoColumnSize', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    if (this.$container2) {
      try {
        if (this.$container2.handsontable('getInstance')) {
          this.$container2.handsontable('getInstance').destroy();
        }
      } catch (e) {
        if (!e.message.includes('instance has been destroyed')) {
          throw e;
        }
      }
      this.$container2.remove();
    }
  });

  const arrayOfObjects = function() {
    return [
      { id: 'Short', name: 'Somewhat long', lastName: 'The very very very longest one', nestedData: [{ id: 1000 }] }
    ];
  };

  /**
   * Measures the rendered text width of a cell's contents using a Range so the measurement
   * excludes the cell's padding and border. Use together with `getThemeLayout()` to derive a
   * theme-agnostic expected column width range.
   *
   * @param {HTMLElement} cell A TD or TH element (or any element with child nodes).
   * @returns {number} Text content width in CSS pixels.
   */
  function measureCellTextWidth(cell) {
    if (!cell) {
      return 0;
    }
    const range = document.createRange();

    range.selectNodeContents(cell);

    return range.getBoundingClientRect().width;
  }

  /**
   * Returns per-row `{ row, scrollWidth, clientWidth }` for every rendered data cell in a column.
   * Callers use it with an inline `expect(...).withContext(`row ${row}`).toBeLessThanOrEqual(...)`
   * so failure stacks point at the spec and the comparison is visible at the call site.
   *
   * @param {number} col Visual column index.
   * @param {number} rows Number of data rows to scan.
   * @returns {Array<{ row: number, scrollWidth: number, clientWidth: number }>}
   */
  function getCellOverflowMetrics(col, rows) {
    const metrics = [];

    for (let row = 0; row < rows; row++) {
      const cell = getCell(row, col);

      if (cell) {
        metrics.push({ row, scrollWidth: cell.scrollWidth, clientWidth: cell.clientWidth });
      }
    }

    return metrics;
  }

  /**
   * Computes the upper bound the column width must not exceed: widest rendered cell text plus
   * cell padding and border, plus a small slack. Use this only for tests where no header
   * decoration contributes to the computed width (e.g. no colHeaders, no hidden-column
   * indicator, no sort indicator). Callers assert inline so the threshold is visible at the
   * call site and failure stacks point at the spec.
   *
   * @param {number} col Visual column index.
   * @param {number} rows Number of data rows to scan.
   * @param {number} [slackPx=12] Extra tolerance above widest text + paddingAndBorder.
   * @returns {number} Upper bound in CSS pixels.
   */
  function measureColumnUpperBound(col, rows, slackPx = 12) {
    const layout = getThemeLayout();
    const paddingAndBorder = (2 * layout.cellHorizontalPadding) + layout.cellBorderWidth;
    let widestText = 0;

    for (let row = 0; row < rows; row++) {
      const cell = getCell(row, col);

      if (cell) {
        widestText = Math.max(widestText, measureCellTextWidth(cell));
      }
    }

    return Math.ceil(widestText + paddingAndBorder) + slackPx;
  }

  it('should apply auto size by default', async() => {
    handsontable({
      data: arrayOfObjects()
    });

    const width0 = colWidth(spec().$container, 0);
    const width1 = colWidth(spec().$container, 1);
    const width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it('should update column width after update value in cell (array of objects)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'lastName' },
      ]
    });

    const acs = getPlugin('autoColumnSize');

    expect(colWidth(spec().$container, 0)).toBe(acs.getColumnWidth(0));
    expect(colWidth(spec().$container, 1)).toBe(acs.getColumnWidth(1));
    expect(colWidth(spec().$container, 2)).toBe(acs.getColumnWidth(2));

    // Content-based check: each column must fit the widest rendered data cell before the edit.
    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(1, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(2, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }

    const widthBefore0 = colWidth(spec().$container, 0);
    const widthBefore2 = colWidth(spec().$container, 2);

    await setDataAtRowProp(0, 'id', 'foo bar foo bar foo bar');
    await setDataAtRowProp(0, 'name', 'foo');
    await waitForNextAnimationFrames(2);

    // Column 0 should be wider (longer text), column 1 should shrink, column 2 unchanged.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(widthBefore0);
    expect(colWidth(spec().$container, 1)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 2)).toBe(widthBefore2);

    // Content-based check: column 0 must fit the new wider text post-edit.
    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  it('should correctly detect column widths with colHeaders', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier Longer text'],
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    // The header text is wider than "Short", so the column should be wider than default.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 0)).toBe(getPlugin('autoColumnSize').getColumnWidth(0));

    // Content-based check: the header text and the data cell must both fit in the column.
    const headerCell = spec().$container.find('thead th')[0];

    expect(headerCell.scrollWidth).toBeLessThanOrEqual(headerCell.clientWidth);

    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as an array', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    const widthBefore = colWidth(spec().$container, 0);

    await updateSettings({ colHeaders: ['Identifier Longer text', 'Identifier Longer and longer text'] });

    // Both columns should be wider after setting longer headers.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(widthBefore);
    expect(colWidth(spec().$container, 1)).toBeGreaterThan(widthBefore);
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a string', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    const widthBefore = colWidth(spec().$container, 0);

    await updateSettings({ colHeaders: 'Identifier Longer text' });

    // Both columns should now have the same width (same header text) and be wider than before.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(widthBefore);
    expect(colWidth(spec().$container, 0)).toBe(colWidth(spec().$container, 1));
  });

  it('should correctly detect column widths after update colHeaders when headers were passed as a function', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ]
    });

    const widthBefore = colWidth(spec().$container, 0);

    await updateSettings({
      colHeaders(index) {
        return index === 0 ? 'Identifier Longer text' : 'Identifier Longer and longer text';
      },
    });

    // Both columns should be wider after setting longer headers, and col 1 wider than col 0.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(widthBefore);
    expect(colWidth(spec().$container, 1)).toBeGreaterThan(colWidth(spec().$container, 0));
  });

  it('should correctly detect column width with colHeaders and the useHeaders option set to false (not taking the header widths into calculation)', async() => {
    handsontable({
      data: [
        { id: 'ab' }
      ],
      autoColumnSize: {
        useHeaders: false
      },
      colHeaders: ['Identifier'],
      columns: [
        { data: 'id' }
      ]
    });

    expect(colWidth(spec().$container, 0)).toBe(50);
  });

  it('should correctly detect column width with columns.title', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    // "Identifier" header is wider than "Short" data, so column should be wider than default.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 0)).toBe(getPlugin('autoColumnSize').getColumnWidth(0));

    // Content-based check: both the header text and the data cell must fit in the column.
    const headerCell = spec().$container.find('thead th')[0];

    expect(headerCell.scrollWidth).toBeLessThanOrEqual(headerCell.clientWidth);

    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  it('should correctly detect column widths after update columns.title', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'id', title: 'Identifier' }
      ]
    });

    const widthBefore = colWidth(spec().$container, 0);

    await updateSettings({
      columns: [
        { data: 'id', title: 'Identifier with longer text' },
      ],
    });

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(widthBefore);
  });

  it('should correctly detect column width when table is hidden on init (display: none) #2684', async() => {
    spec().$container.css('display', 'none');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colHeaders: ['Identifier', 'First Name']
    });

    await waitForNextAnimationFrames(2);

    spec().$container.css('display', 'block');
    await render();

    await waitForNextAnimationFrames(2);

    // After becoming visible, the column width should be auto-sized wider than default.
    expect(colWidth(spec().$container, 0)).toBeGreaterThan(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 0)).toBe(getPlugin('autoColumnSize').getColumnWidth(0));

    // Content-based check: both the header text and the data cell must fit in the column.
    const headerCell = spec().$container.find('thead th')[0];

    expect(headerCell.scrollWidth).toBeLessThanOrEqual(headerCell.clientWidth);

    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 1)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
  });

  it('should not change the column width after toggling the state of the checkbox cell type', async() => {
    handsontable({
      data: [
        {
          car: 'Mercedes A 160',
          available: true,
        },
        {
          car: 'Citroen C4 Coupe',
          available: false,
        },
      ],
      autoColumnSize: true,
      columns: [
        {
          data: 'available',
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'car',
          },
        },
      ]
    });

    const widthBefore = colWidth(spec().$container, 0);

    await setDataAtCell(0, 0, false);

    expect(colWidth(spec().$container, 0)).toBe(widthBefore);
  });

  it('should not wrap the cell values when the whole column has values with the same length', async() => {
    handsontable({
      data: [
        {
          units: 'EUR / USD'
        },
        {
          units: 'JPY / USD'
        },
        {
          units: 'GBP / USD'
        },
        {
          units: 'MXN / USD'
        },
        {
          units: 'ARS / USD'
        }
      ],
      autoColumnSize: {
        samplingRatio: 5,
      },
      columns: [
        { data: 'units' },
      ]
    });

    expect(colWidth(spec().$container, 0)).toBe(getPlugin('autoColumnSize').getColumnWidth(0));

    // Content-based check: all rows have identically-wide text; the column must fit it on one
    // line. This also guards against wrapping regressions that the row-height checks below
    // cover from the vertical direction.
    for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 5)) {
      expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
    }
    expect(rowHeight(spec().$container, 0)).toBe(getThemeLayout().firstRenderedRowDefaultHeight);
    expect(rowHeight(spec().$container, 1)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(rowHeight(spec().$container, 2)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(rowHeight(spec().$container, 3)).toBe(getThemeLayout().defaultDataRowHeight);
    expect(rowHeight(spec().$container, 4)).toBe(getThemeLayout().defaultDataRowHeight);
  });

  it('should be possible to disable plugin using updateSettings', async() => {
    handsontable({
      data: arrayOfObjects()
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);

    await updateSettings({
      autoColumnSize: false
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);
  });

  it('should apply disabling/enabling plugin using updateSettings, only to a particular HOT instance', async() => {
    spec().$container2 = $(`<div id="${id}-2"></div>`).appendTo('body');

    handsontable({
      data: arrayOfObjects()
    });

    spec().$container2.handsontable({
      data: arrayOfObjects()
    });

    const widths = {
      1: [],
      2: []
    };

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toBeLessThan(widths[1][1]);
    expect(widths[1][1]).toBeLessThan(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    await updateSettings({
      autoColumnSize: false
    });

    widths[1][0] = colWidth(spec().$container, 0);
    widths[1][1] = colWidth(spec().$container, 1);
    widths[1][2] = colWidth(spec().$container, 2);

    widths[2][0] = colWidth(spec().$container2, 0);
    widths[2][1] = colWidth(spec().$container2, 1);
    widths[2][2] = colWidth(spec().$container2, 2);

    expect(widths[1][0]).toEqual(widths[1][1]);
    expect(widths[1][0]).toEqual(widths[1][2]);
    expect(widths[1][1]).toEqual(widths[1][2]);

    expect(widths[2][0]).toBeLessThan(widths[2][1]);
    expect(widths[2][1]).toBeLessThan(widths[2][2]);

    spec().$container2.handsontable('destroy');
    spec().$container2.remove();
  });

  it('should be possible to enable plugin using updateSettings', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: false
    });

    let width0 = colWidth(spec().$container, 0);
    let width1 = colWidth(spec().$container, 1);
    let width2 = colWidth(spec().$container, 2);

    expect(width0).toEqual(width1);
    expect(width0).toEqual(width2);
    expect(width1).toEqual(width2);

    await updateSettings({
      autoColumnSize: true
    });

    width0 = colWidth(spec().$container, 0);
    width1 = colWidth(spec().$container, 1);
    width2 = colWidth(spec().$container, 2);

    expect(width0).toBeLessThan(width1);
    expect(width1).toBeLessThan(width2);
  });

  it(`should keep proper topOverlay size after render() -> adjustElementSize() -> updateSettings
      with a different set of colHeaders`, async() => {
    const getHeaders = () => [
      'A_longer',
      'B_longer',
      'C_longer',
      'D_longer',
      'E_longer',
    ];

    handsontable({
      data: createSpreadsheetData(5, 5),
      colHeaders: getHeaders(),
      rowHeaders: true,
    });

    const topOverlay = spec().$container.find('.ht_clone_top .wtHider');
    const topOverlayWidthBefore = topOverlay.width();

    // Simulates a sequence of methods used in contextMenu commands for plugins like Hidden*, Freeze*
    // or internal plugins' methods like Filters, Manual*Move, Manual*Resize.
    await render();

    tableView().adjustElementsSize();

    await updateSettings({
      colHeaders: getHeaders().reverse(),
    });

    expect(topOverlayWidthBefore).toEqual(topOverlay.width());
  });

  it('should consider CSS style of each instance separately', async() => {
    const $style = $('<style>.big .htCore td {font-size: 40px; line-height: 1.1;}</style>').appendTo('head');
    const $container1 = $('<div id="hot1"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    const $container2 = $('<div id="hot2"></div>').appendTo('body').handsontable({
      data: arrayOfObjects()
    });
    const hot1 = $container1.handsontable('getInstance');
    const hot2 = $container2.handsontable('getInstance');

    expect(colWidth($container1, 0)).toEqual(colWidth($container2, 0));

    $container1.addClass('big');
    hot1.render();
    hot2.render();
    expect(colWidth($container1, 0)).toBeGreaterThan(colWidth($container2, 0));

    $container1.removeClass('big').handsontable('render');
    $container2.addClass('big').handsontable('render');
    expect(colWidth($container1, 0)).toBeLessThan(colWidth($container2, 0));

    $style.remove();
    $container1.handsontable('destroy');
    $container1.remove();
    $container2.handsontable('destroy');
    $container2.remove();
  });

  it('should consider CSS class of the <table> element (e.g. when used with Bootstrap)', async() => {
    const $style = $('<style>.htCore.big-table td {font-size: 32px}</style>').appendTo('head');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true
    });

    const width = colWidth(spec().$container, 0);

    spec().$container.find('table').addClass('big-table');

    await render();

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(width);

    $style.remove();
  });

  it('should destroy temporary element', async() => {
    handsontable({
      autoColumnSize: true
    });

    expect(document.querySelector('.htAutoSize')).toBe(null);
  });

  it('should not trigger autoColumnSize when column width is defined (through colWidths)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidths: [70, 70, 70],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    await setDataAtCell(0, 0, 'LongLongLongLong');
    await waitForNextAnimationFrames(2);

    expect(colWidth(spec().$container, 0)).toBe(70);
  });

  it('should not trigger autoColumnSize when column width is defined (through columns.width)', async() => {
    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      colWidth: 77,
      columns: [
        { width: 70 },
        { width: 70 },
        { width: 70 }
      ],
      width: 500,
      height: 100,
      rowHeaders: true
    });

    await setDataAtCell(0, 0, 'LongLongLongLong');
    await waitForNextAnimationFrames(2);

    expect(colWidth(spec().$container, 0)).toBe(70);
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
      autoColumnSize: true,
      renderer(instance, td, row, col, ...args) {
        // taken from demo/renderers.html
        Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, ...args]);

        if (row === 1 && col === 0) {
          td.style.padding = '100px';
        }
      }
    });

    expect(colWidth(spec().$container, 0)).toBeGreaterThan(colWidth(spec().$container, 1));
  });

  it('should\'t serialize value if it is array (nested data sources)', async() => {
    const spy = jasmine.createSpy('renderer');

    handsontable({
      data: arrayOfObjects(),
      autoColumnSize: true,
      columns: [
        { data: 'nestedData' }
      ],
      renderer: spy
    });

    expect(spy.calls.mostRecent().args[5]).toEqual([{ id: 1000 }]);
  });

  it('should not change width after select/click cell', async() => {
    handsontable({
      data: [
        ['Canceled'],
        ['Processing'],
        ['Processing'],
        ['Created'],
        ['Processing'],
        ['Completed']
      ],
      colHeaders: true,
      rowHeaders: true,
    });

    await waitForNextAnimationFrames(2);

    const cloneTopHider = spec().$container.find('.ht_clone_top .wtHider');
    const widthBefore = cloneTopHider.width();

    await selectCell(0, 0);
    await waitForNextAnimationFrames(2);

    expect(cloneTopHider.width()).toBe(widthBefore);
  });

  it('should not calculate any column widths, if there are no columns in the dataset', async() => {
    handsontable({
      data: [[1, 2]],
      colHeaders: true,
    });

    spyOn(getPlugin('autoColumnSize'), 'calculateColumnsWidth').and.callThrough();
    const calculateColumnsWidth = getPlugin('autoColumnSize').calculateColumnsWidth;

    await loadData([[]]);

    expect(calculateColumnsWidth).not.toHaveBeenCalled();
  });

  it('should ignore calculate row heights for samples from hidden columns', async() => {
    const data = createSpreadsheetData(5, 3);

    data[2][0] = 'Very long text that causes the column to be wide';

    handsontable({
      data,
      rowHeaders: true,
      autoColumnSize: true,
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(2, true);

    await render();

    expect(getColWidth(0)).toBe(50);
    expect(getColWidth(1)).toBe(50);
    expect(getColWidth(2)).toBe(50);
  });

  it('should keep proper column widths after inserting column', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    const shortW = colWidth(spec().$container, 0);
    const longerW = colWidth(spec().$container, 1);
    const longestW = colWidth(spec().$container, 2);

    expect(shortW).toBeLessThan(longerW);
    expect(longerW).toBeLessThan(longestW);

    // Content-based check: each header TH must fit its text without overflow.
    const headerCells = spec().$container.find('thead th');

    for (let col = 0; col < 3; col++) {
      expect(headerCells[col].scrollWidth).toBeLessThanOrEqual(headerCells[col].clientWidth);
    }

    await alter('insert_col_start', 0);

    expect(colWidth(spec().$container, 0)).toBe(getDefaultColumnWidth()); // New empty column.
    expect(colWidth(spec().$container, 1)).toBe(shortW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);
    expect(colWidth(spec().$container, 3)).toBe(longestW);

    await alter('insert_col_start', 3);

    expect(colWidth(spec().$container, 0)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 1)).toBe(shortW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);
    expect(colWidth(spec().$container, 3)).toBe(getDefaultColumnWidth()); // New empty column.
    expect(colWidth(spec().$container, 4)).toBe(longestW);

    await alter('insert_col_start', 5);

    expect(colWidth(spec().$container, 0)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 1)).toBe(shortW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);
    expect(colWidth(spec().$container, 3)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 4)).toBe(longestW);
    expect(colWidth(spec().$container, 5)).toBe(getDefaultColumnWidth()); // New empty column.
  });

  it('should keep proper column widths after removing column', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    const longerW = colWidth(spec().$container, 1);
    const longestW = colWidth(spec().$container, 2);

    await alter('remove_col', 0);

    expect(colWidth(spec().$container, 0)).toBe(longerW);
    expect(colWidth(spec().$container, 1)).toBe(longestW);
  });

  it('should keep appropriate column size when columns order is changed', async() => {
    handsontable({
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    const longerW = colWidth(spec().$container, 1);
    const longestW = colWidth(spec().$container, 2);

    columnIndexMapper().moveIndexes(2, 1);
    await render();

    expect(colWidth(spec().$container, 1)).toBe(longestW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);

    columnIndexMapper().moveIndexes(1, 2);
    await render();

    expect(colWidth(spec().$container, 1)).toBe(longerW);
    expect(colWidth(spec().$container, 2)).toBe(longestW);
  });

  it('should keep appropriate column size when columns order is changed and some column is cleared', async() => {
    handsontable({
      data: createSpreadsheetData(5, 3),
      autoColumnSize: true,
      colHeaders: ['Short', 'Longer', 'The longest header']
    });

    const longerW = colWidth(spec().$container, 1);
    const longestW = colWidth(spec().$container, 2);

    columnIndexMapper().moveIndexes(2, 1);
    await render();

    expect(colWidth(spec().$container, 1)).toBe(longestW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);

    await populateFromArray(0, 1, [[null], [null], [null], [null], [null]]); // Empty values on the second visual column.

    // Widths should be maintained by headers even after clearing data.
    expect(colWidth(spec().$container, 1)).toBe(longestW);
    expect(colWidth(spec().$container, 2)).toBe(longerW);
  });

  it('should keep the viewport position unchanged after resetting all columns widths (#dev-1888)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 50),
      width: 400,
      height: 400,
      autoColumnSize: true,
      colHeaders: ['Longer header name'],
      rowHeaders: true,
    });

    await scrollViewportTo(0, 49);

    const scrollBefore = inlineStartOverlay().getScrollPosition();

    expect(scrollBefore).toBeGreaterThan(0);

    await listen();
    await selectRows(2, 2);
    await keyDownUp('delete');

    expect(inlineStartOverlay().getScrollPosition()).toBe(scrollBefore);
  });

  describe('should cooperate with the `UndoRedo` plugin properly', () => {
    it('when removing single column', async() => {
      handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      const shortW = colWidth(spec().$container, 0);
      const medW = colWidth(spec().$container, 1);
      const longW = colWidth(spec().$container, 2);

      await alter('remove_col', 0);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(medW);
      expect(colWidth(spec().$container, 1)).toBe(longW);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      await alter('remove_col', 1);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(longW);

      getPlugin('undoRedo').undo();

      await alter('remove_col', 2);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
    });

    it('when inserting single column', async() => {
      handsontable({
        data: [['Short', 'Somewhat long', 'The very very very longest one']],
        autoColumnSize: true,
      });

      const shortW = colWidth(spec().$container, 0);
      const medW = colWidth(spec().$container, 1);
      const longW = colWidth(spec().$container, 2);
      const defW = getDefaultColumnWidth();

      await alter('insert_col_start', 0);
      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(defW);
      expect(colWidth(spec().$container, 1)).toBe(shortW);
      expect(colWidth(spec().$container, 2)).toBe(medW);
      expect(colWidth(spec().$container, 3)).toBe(longW);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      await alter('insert_col_start', 1);
      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(defW);
      expect(colWidth(spec().$container, 2)).toBe(medW);
      expect(colWidth(spec().$container, 3)).toBe(longW);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      await alter('insert_col_start', 2);
      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(defW);
      expect(colWidth(spec().$container, 3)).toBe(longW);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      await alter('insert_col_start', 3);
      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);

      getPlugin('undoRedo').redo();

      expect(colWidth(spec().$container, 0)).toBe(shortW);
      expect(colWidth(spec().$container, 1)).toBe(medW);
      expect(colWidth(spec().$container, 2)).toBe(longW);
      expect(colWidth(spec().$container, 3)).toBe(defW);
    });

    it('when removing all rows', async() => {
      handsontable({
        data: arrayOfObjects(),
        autoColumnSize: true,
        columns: [
          { data: 'id', title: 'Identifier' },
          { data: 'name', title: 'Name' },
          { data: 'lastName', title: 'Last Name' },
        ]
      });

      const w0 = colWidth(spec().$container, 0);
      const w1 = colWidth(spec().$container, 1);
      const w2 = colWidth(spec().$container, 2);

      await alter('remove_row', 0);

      getPlugin('undoRedo').undo();

      expect(colWidth(spec().$container, 0)).toBe(w0);
      expect(colWidth(spec().$container, 1)).toBe(w1);
      expect(colWidth(spec().$container, 2)).toBe(w2);
    });
  });

  describe('should cooperate with the HiddenColumns plugin properly', () => {
    it('should display proper sizes for columns', async() => {
      handsontable({
        data: arrayOfObjects(),
        autoColumnSize: true,
        columns: [
          { data: 'id' },
          { data: 'name' },
          { data: 'lastName' },
        ],
        colHeaders: true,
        hiddenColumns: {
          columns: [1],
          indicators: true
        }
      });

      // With hidden column indicator, the first visible column should be wider than just "Short" text
      // (it includes the hidden column indicator), and the last column should be wider than default.
      expect(colWidth(spec().$container, 0)).toBeGreaterThan(getDefaultColumnWidth());
      expect(colWidth(spec().$container, 1)).toBeGreaterThan(getDefaultColumnWidth());

      // Content-based check: visual column 1 now maps to physical column 2 (lastName);
      // its content "The very very very longest one" must fit without overflow.
      const lastNameCell = spec().$container.find('tbody tr:first td')[1];

      expect(lastNameCell.scrollWidth).toBeLessThanOrEqual(lastNameCell.clientWidth);
      // Visual column 0 shows "Short" plus the hidden column indicator; asserting content
      // fits catches regressions where the indicator gets clipped.
      const firstDataCell = spec().$container.find('tbody tr:first td')[0];

      expect(firstDataCell.scrollWidth).toBeLessThanOrEqual(firstDataCell.clientWidth);
    });
  });

  describe('samplingRatio', () => {
    it('should samplingRatio overwrites default samples count', async() => {
      handsontable({
        data: [
          ['iiiii'],
          ['aaaaa'],
          ['zzzzz'],
          ['WWWWW'],
        ],
        autoColumnSize: {
          samplingRatio: 4,
        },
      });

      expect(colWidth(spec().$container, 0)).toBeGreaterThan(60);

      // Content-based check: every row's content must fit (no overflow) and the column must
      // not be grossly oversized. With samplingRatio: 4 the "WWWWW" row must be sampled so the
      // column fits the widest rendered row.
      for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 4)) {
        expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
      }

      const upperBound = measureColumnUpperBound(0, 4, 12);

      expect(colWidth(spec().$container, 0)).toBeLessThanOrEqual(upperBound);
    });
  });

  describe('allowSampleDuplicates', () => {
    it('should add duplicated values', async() => {
      handsontable({
        data: [
          ['1'],
          ['1'],
        ],
        autoColumnSize: {
          allowSampleDuplicates: true,
        },
        renderer(hotInstance, td, row, column, prop, value) {
          const cellValue = row === 1 ? `${value}_WWWWW` : `${value}`;

          td.innerHTML = cellValue;
        }
      });

      // With duplicates allowed, both raw data values are "1" but the renderer expands row 1
      // into "1_WWWWW". That wider content must be sampled (not deduplicated) so the column can
      // fit it. Compare row 1's rendered text width against row 0's to prove sampling occurred.
      const row0Cell = getCell(0, 0);
      const row1Cell = getCell(1, 0);
      const row0TextWidth = measureCellTextWidth(row0Cell);
      const row1TextWidth = measureCellTextWidth(row1Cell);
      const actualWidth = colWidth(spec().$container, 0);

      // Sanity: the plugin and the DOM must agree on the column width.
      expect(actualWidth).toBe(getPlugin('autoColumnSize').getColumnWidth(0));
      // Row 1's text must not overflow (column sized to fit it).
      expect(row1Cell.scrollWidth).toBeLessThanOrEqual(row1Cell.clientWidth);
      // Column must be significantly wider than what row 0's short text alone would require.
      // This catches the regression where duplicate sampling is skipped and the column sizes
      // only to the deduplicated row 0.
      expect(actualWidth).toBeGreaterThan(getDefaultColumnWidth());
      expect(row1TextWidth).toBeGreaterThan(row0TextWidth * 2);
    });
  });

  describe('modifyAutoColumnSizeSeed', () => {
    it('should overwrite native seed generation', async() => {
      handsontable({
        columns: [
          { data: 'lang' },
        ],
        data: [
          { lang: { code: 'en-bz', name: 'English (Belize)' } },
          { lang: { code: 'en-ie', name: 'English (Ireland)' } },
          { lang: { code: 'en-jm', name: 'English (Jamaica)' } },
          { lang: { code: 'en-gb', name: 'English (United Kingdom)' } },
        ],
        autoColumnSize: true,
        modifyAutoColumnSizeSeed(seed, cellMeta, cellValue) {
          return `${cellValue.code}`;
        },
        renderer(hotInstance, td, row, column, prop, value) {
          td.innerHTML = value.name;
        }
      });

      // Custom renderer displays full name; column should be wider than default to fit it.
      expect(colWidth(spec().$container, 0)).toBeGreaterThan(getDefaultColumnWidth());
      expect(colWidth(spec().$container, 0)).toBe(getPlugin('autoColumnSize').getColumnWidth(0));

      // Content-based check: the widest rendered name ("English (United Kingdom)") must fit.
      for (const { row, scrollWidth, clientWidth } of getCellOverflowMetrics(0, 4)) {
        expect(scrollWidth).withContext(`row ${row}`).toBeLessThanOrEqual(clientWidth);
      }
    });
  });

  it('should calculate column widths correctly when `valueFormatter` is used', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
      autoColumnSize: true,
      valueFormatter: () => 'new formatted value',
    });

    expect(getColWidth(1)).toBeGreaterThan(getDefaultColumnWidth());
  });

  describe('should work together with formulas plugin', () => {
    it('should calculate widths only once during the initialization of Handsontable with formulas plugin enabled', async() => {
      const beforeInit = function() {
        spyOn(this.getPlugin('autoColumnSize').ghostTable, 'addColumn').and.callThrough();
      };

      Handsontable.hooks.add('beforeInit', beforeInit);

      handsontable({
        data: [[42], ['=A1']],
        formulas: {
          engine: HyperFormula
        },
      });

      expect(getPlugin('autoColumnSize').ghostTable.addColumn).toHaveBeenCalledTimes(1);
      Handsontable.hooks.remove('beforeInit', beforeInit);
    });

    it('should increase width if result become to be longer', async() => {
      handsontable({
        data: [
          [9, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      const widthBefore = colWidth(spec().$container, 1);

      await setDataAtCell(0, 0, 999999999999);
      await waitForNextAnimationFrames(2);

      expect(colWidth(spec().$container, 1)).toBeGreaterThan(widthBefore);
    });

    it('should decrease width if result become to be shorter', async() => {
      handsontable({
        data: [
          [999, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      const widthBefore = colWidth(spec().$container, 1);

      await setDataAtCell(0, 0, 9);
      await waitForNextAnimationFrames(2);

      expect(colWidth(spec().$container, 1)).toBeLessThan(widthBefore);
    });

    it('should change width if result become to be an error', async() => {
      handsontable({
        data: [
          [9, '=A1*500'],
          [8, '=A2*500'],
          [6, '=A3*500'],
        ],
        type: 'numeric',
        formulas: {
          engine: HyperFormula
        }
      });

      const widthBefore = colWidth(spec().$container, 1);

      await setDataAtCell(0, 0, 'not a number');
      await waitForNextAnimationFrames(2);

      // Error text like "#VALUE!" should change the column width.
      expect(colWidth(spec().$container, 1)).not.toBe(widthBefore);
    });

    it('should not throw when two tables with different layouts share a HyperFormula engine (#12301)', async() => {
      spec().$container2 = $('<div id="testContainer-2"></div>').appendTo('body');

      const hot1 = handsontable({
        data: [['a', 'b']],
        autoRowSize: true,
        autoColumnSize: true,
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
        },
      });

      spec().$container2.handsontable({
        data: [['c'], ['d']],
        autoRowSize: true,
        autoColumnSize: true,
        formulas: {
          engine: hot1.getPlugin('formulas').engine,
          sheetName: 'Sheet2',
        },
      });

      const hot2 = spec().$container2.handsontable('getInstance');

      expect(() => {
        hot2.setDataAtCell(0, 0, 'test');
      }).not.toThrow();

      expect(() => {
        hot1.setDataAtCell(0, 0, 'test2');
      }).not.toThrow();
    });

    it('should not queue column refresh for changes belonging to another sheet (#12301)', async() => {
      spec().$container2 = $('<div id="testContainer-2"></div>').appendTo('body');

      const hot1 = handsontable({
        data: [['a', '=A1']],
        autoColumnSize: true,
        formulas: {
          engine: HyperFormula,
          sheetName: 'Sheet1',
        },
      });

      const hot2Instance = spec().$container2.handsontable({
        data: [['=Sheet1!A1'], ['d'], ['e']],
        autoColumnSize: true,
        formulas: {
          engine: hot1.getPlugin('formulas').engine,
          sheetName: 'Sheet2',
        },
      }).data('handsontable');

      const sheet2Id = hot2Instance.getPlugin('formulas').sheetId;
      const toVisualColumnSpy = spyOn(hot1, 'toVisualColumn').and.callThrough();

      hot1.runHooks('afterFormulasValuesUpdate', [
        { address: { sheet: sheet2Id, row: 0, col: 0 }, newValue: 'test' },
        { address: { sheet: sheet2Id, row: 2, col: 0 }, newValue: 'test2' },
      ]);

      expect(toVisualColumnSpy).not.toHaveBeenCalled();
    });
  });
});
