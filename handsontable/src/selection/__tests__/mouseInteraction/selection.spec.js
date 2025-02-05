describe('Selection using mouse interaction', () => {
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

  function columnHeader(renderedColumnIndex, TH) {
    const visualColumnsIndex = renderedColumnIndex >= 0 ?
      this.columnIndexMapper.getVisualFromRenderableIndex(renderedColumnIndex) : renderedColumnIndex;

    this.view.appendColHeader(visualColumnsIndex, TH);
  }
  function rowHeader(renderableRowIndex, TH) {
    const visualRowIndex = renderableRowIndex >= 0 ?
      this.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

    this.view.appendRowHeader(visualRowIndex, TH);
  }

  it('should correctly render the selection using event simulation', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(9, 8),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    mouseDown(getCell(5, 4));
    mouseOver(getCell(1, 1));
    mouseUp(getCell(1, 1));

    keyDown('control/meta');

    mouseDown(getCell(0, 2));
    mouseOver(getCell(8, 2));
    mouseUp(getCell(7, 2));

    mouseDown(getCell(2, 4));
    mouseOver(getCell(2, 4));
    mouseUp(getCell(2, 4));

    mouseDown(getCell(7, 6));
    mouseOver(getCell(8, 7));
    mouseUp(getCell(8, 7));

    keyUp('control/meta');

    expect(`
      |   ║   : - : - : - : - :   : - : - |
      |===:===:===:===:===:===:===:===:===|
      | - ║   :   : 0 :   :   :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 1 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   : 0 : 1 : 0 : 0 :   :   :   |
      | - ║   :   : 0 :   :   :   :   :   |
      | - ║   :   : 0 :   :   :   : A : 0 |
      | - ║   :   : 0 :   :   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should focus external textarea when clicked during editing', () => {
    const textarea = $('<input type="text">').prependTo($('body'));

    handsontable();
    selectCell(0, 0);

    keyDownUp('enter');
    // $("html").triggerHandler('mouseup');
    $('html').simulate('mouseup');
    textarea.focus();

    expect(document.activeElement).toBe(textarea[0]);
    textarea.remove();
  });

  it('should deselect currently selected cell', () => {
    handsontable();
    selectCell(0, 0);

    $('html').simulate('mousedown');

    expect(getSelected()).toBeUndefined();
    expect(`
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
      |   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select entire column by left click on column header', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)'), 'LMB'); // Header "A"

    expect(`
      |   ║ * :   :   :   :   |
      |===:===:===:===:===:===|
      | - ║ A :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: 4,0']);
  });

  it('should select entire row by left click on row header', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(0) th'), 'LMB'); // Header "1"

    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,-1 to: 0,4']);
  });

  it('should select entire column by right click on column header', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)'), 'RMB'); // Header "A"

    expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
    expect(`
      |   ║ * :   :   :   :   |
      |===:===:===:===:===:===|
      | - ║ A :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select entire row by right click on row header', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(0) th'), 'RMB'); // Header "1"

    expect(getSelected()).toEqual([[0, -1, 0, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select entire column by left click on column header (navigableHeaders on)', () => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      afterGetColumnHeaderRenderers(headerRenderers) {
        headerRenderers.push(columnHeader.bind(this));
        headerRenderers.push(columnHeader.bind(this));
      },
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)'), 'LMB'); // First "B" header

    expect(`
      |   ║   : # :   :   :   |
      |   ║   : * :   :   :   |
      |   ║   : * :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(1) th:eq(2)'), 'LMB'); // Second "B" header

    expect(`
      |   ║   : * :   :   :   |
      |   ║   : # :   :   :   |
      |   ║   : * :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(2) th:eq(2)'), 'LMB'); // Third "B" header

    expect(`
      |   ║   : * :   :   :   |
      |   ║   : * :   :   :   |
      |   ║   : # :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 1,1']);
  });

  it('should select entire row by left click on row header (navigableHeaders on)', () => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      afterGetRowHeaderRenderers(headerRenderers) {
        headerRenderers.push(rowHeader.bind(this));
        headerRenderers.push(rowHeader.bind(this));
      },
    });

    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)'), 'LMB'); // First header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | # : * : * ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(1)'), 'LMB'); // Second header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | * : # : * ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-2 from: 1,-2 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(2)'), 'LMB'); // Third header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | * : * : # ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,1']);
  });

  it('should select entire column by right click on column header (navigableHeaders on)', () => {
    handsontable({
      data: createSpreadsheetData(2, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      afterGetColumnHeaderRenderers(headerRenderers) {
        headerRenderers.push(columnHeader.bind(this));
        headerRenderers.push(columnHeader.bind(this));
      },
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)'), 'RMB'); // First "B" header

    expect(`
      |   ║   : # :   :   :   |
      |   ║   : * :   :   :   |
      |   ║   : * :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(1) th:eq(2)'), 'RMB'); // Second "B" header

    expect(`
      |   ║   : * :   :   :   |
      |   ║   : # :   :   :   |
      |   ║   : * :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -2,1 from: -2,1 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(2) th:eq(2)'), 'RMB'); // Third "B" header

    expect(`
      |   ║   : * :   :   :   |
      |   ║   : * :   :   :   |
      |   ║   : # :   :   :   |
      |===:===:===:===:===:===|
      | - ║   : 0 :   :   :   |
      | - ║   : 0 :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 1,1']);
  });

  it('should select entire row by right click on row header (navigableHeaders on)', () => {
    handsontable({
      data: createSpreadsheetData(5, 2),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      afterGetRowHeaderRenderers(headerRenderers) {
        headerRenderers.push(rowHeader.bind(this));
        headerRenderers.push(rowHeader.bind(this));
      },
    });

    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(0)'), 'RMB'); // First header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | # : * : * ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(1)'), 'RMB'); // Second header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | * : # : * ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-2 from: 1,-2 to: 1,1']);

    deselectCell();
    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(1) th:eq(2)'), 'RMB'); // Third header "2"

    expect(`
      |   :   :   ║ - : - |
      |===:===:===:===:===|
      |   :   :   ║   :   |
      | * : * : # ║ 0 : 0 |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
      |   :   :   ║   :   |
    `).toBeMatchToSelectionPattern();
    expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,1']);
  });

  it('should select entire column by right click on column header and overwrite the previous cell selection (#7051)', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    selectCell(0, 0);
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)'), 'RMB'); // Header "A"

    expect(getSelected()).toEqual([[-1, 0, 4, 0]]);
    expect(`
      |   ║ * :   :   :   :   |
      |===:===:===:===:===:===|
      | - ║ A :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
      | - ║ 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select entire row by right click on row header and overwrite the previous cell selection (#7051)', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
    });

    selectCell(0, 0);
    simulateClick(spec().$container.find('.ht_clone_inline_start tbody tr:eq(0) th'), 'RMB'); // Header "1"

    expect(getSelected()).toEqual([[0, -1, 0, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select columns by click on header when all rows are trimmed', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)'));

    expect(getSelected()).toEqual([[-1, 1, -1, 1]]);
    expect(`
      |   ║   : * :   :   :   |
      |===:===:===:===:===:===|
    `).toBeMatchToSelectionPattern();
  });

  it('should select row and column headers after clicking the corner header, when all rows are trimmed', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
    });

    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(0)'));

    expect(getSelected()).toEqual([[-1, -1, -1, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
    `).toBeMatchToSelectionPattern();
  });

  it('should select rows by click on header when all columns are trimmed (using `columns` option)', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      columns: [], // The TrimmingMap should be used instead of the plugin.
    });

    simulateClick(spec().$container.find('.ht_clone_inline_start tr:eq(2) th:eq(0)'));

    expect(getSelected()).toEqual([[1, -1, 1, -1]]);
    expect(`
      |   |
      |===|
      |   |
      | * |
      |   |
      |   |
      |   |
    `).toBeMatchToSelectionPattern();
  });

  it('should expand columns selection by click on header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(2)').simulate('mouseup');

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 1, 4, 4]]);
    expect(`
      |   ║   : * : * : * : * |
      |===:===:===:===:===:===|
      | - ║   : A : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should expand rows selection by click on header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    spec().$container.find('.ht_clone_inline_start tr:eq(2) th:eq(0)').simulate('mousedown');
    spec().$container.find('.ht_clone_inline_start tr:eq(2) th:eq(0)').simulate('mouseup');

    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, -1, 4, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selection after click on column header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    selectCell(1, 1, 3, 3);

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 1, 4, 4]]);
    expect(`
      |   ║   : * : * : * : * |
      |===:===:===:===:===:===|
      | - ║   : A : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selection after click on row header with SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    selectCell(1, 1, 3, 3);

    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[1, -1, 4, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should allow switching between row/column selection, when clicking on the headers ' +
    'while holding the SHIFT key', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
    });

    selectCell(0, 0, 0, 0);

    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_inline_start tr:eq(5) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, -1, 4, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();

    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(5)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 0, 4, 4]]);
    expect(`
      |   ║ * : * : * : * : * |
      |===:===:===:===:===:===|
      | - ║ A : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();

    spec().$container.find('.ht_clone_inline_start tr:eq(3) th:eq(0)').simulate('mousedown', { shiftKey: true });
    spec().$container.find('.ht_clone_inline_start tr:eq(3) th:eq(0)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, -1, 2, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should call `afterSelection` while user selects cells with mouse; `afterSelectionEnd` when user finishes selection', () => {
    let tick = 0;
    let tickEnd = 0;

    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick += 1;
      },
      afterSelectionEnd() {
        tickEnd += 1;
      }
    });

    spec().$container.find('tr:eq(1) td:eq(0)').simulate('mousedown');
    spec().$container.find('tr:eq(1) td:eq(1)').simulate('mouseover');
    spec().$container.find('tr:eq(2) td:eq(3)').simulate('mouseover');

    spec().$container.find('tr:eq(2) td:eq(3)').simulate('mouseup');

    expect(getSelected()).toEqual([[0, 0, 1, 3]]);
    expect(`
      |   ║ - : - : - : - :   |
      |===:===:===:===:===:===|
      | - ║ A : 0 : 0 : 0 :   |
      | - ║ 0 : 0 : 0 : 0 :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
    expect(tick).toEqual(3);
    expect(tickEnd).toEqual(1);
  });

  it('should properly select columns, when the user moves the cursor over column headers across two overlays', () => {
    handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5,
      fixedColumnsStart: 2
    });

    spec().$container.find('.ht_clone_inline_start tr:eq(0) th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_clone_inline_start tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('.ht_clone_top tr:eq(0) th:eq(3)').simulate('mouseover');
    spec().$container.find('.ht_clone_inline_start tr:eq(0) th:eq(2)').simulate('mouseover');
    spec().$container.find('.ht_clone_inline_start tr:eq(0) th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 1, 4, 1]]);
    expect(`
      |   ║   : * |   :   :   |
      |===:===:===:===:===:===|
      | - ║   : A |   :   :   |
      | - ║   : 0 |   :   :   |
      | - ║   : 0 |   :   :   |
      | - ║   : 0 |   :   :   |
      | - ║   : 0 |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  // This test should cover the #893 case, but it always passes. It seems like the keydown event (with CTRL key pressed) isn't delivered.
  it('should not move focus from outside elements on CTRL keydown event, when no cell is selected', () => {
    const $input = $('<input type="text"/>');

    $('body').append($input);
    handsontable();
    selectCell(0, 0);

    expect(document.activeElement.nodeName).toBeInArray(['TEXTAREA', 'BODY', 'HTML', 'TD', 'TH']);

    $input.focus();
    expect(document.activeElement.nodeName).toBe('INPUT');

    $input.simulate('keydown', { key: 'Control', ctrlKey: true, metaKey: false });
    expect(document.activeElement.nodeName).toBe('INPUT');
    $input.simulate('keyup', { key: 'Control', ctrlKey: true, metaKey: false });

    $input.remove();
  });

  it.forTheme('classic')('should select the entire column after column header is clicked', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true
    });

    spec().$container.find('thead th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[-1, 0, 9, 0]]);
    expect(`
      | * :   :   :   :   |
      |===:===:===:===:===|
      | A :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should select the entire column after column header is clicked', () => {
    handsontable({
      width: 200,
      height: 126,
      startRows: 10,
      startCols: 5,
      colHeaders: true
    });

    spec().$container.find('thead th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[-1, 0, 9, 0]]);
    expect(`
      | * :   :   :   :   |
      |===:===:===:===:===|
      | A :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
      | 0 :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should select the entire column and row after column header and row ' +
    'header is clicked', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
    });

    spec().$container.find('thead th:eq(3)').simulate('mousedown');

    keyDown('control/meta');

    mouseDown(spec().$container.find('tr:eq(2) th:eq(0)')[0]);

    keyUp('control/meta');

    expect(`
      |   ║ - : - : * : - : - |
      |===:===:===:===:===:===|
      | - ║   :   : 0 :   :   |
      | * ║ A : 0 : 1 : 0 : 0 |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should select the entire column and row after column header and row ' +
    'header is clicked', () => {
    handsontable({
      width: 200,
      height: 126,
      startRows: 10,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
    });

    spec().$container.find('thead th:eq(3)').simulate('mousedown');

    keyDown('control/meta');

    mouseDown(spec().$container.find('tr:eq(2) th:eq(0)')[0]);

    keyUp('control/meta');

    expect(`
      |   ║ - : - : * : - : - |
      |===:===:===:===:===:===|
      | - ║   :   : 0 :   :   |
      | * ║ A : 0 : 1 : 0 : 0 |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select the entire column and row after column header and row header is clicked when cell editor is open', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(0, 0);
    keyDownUp('enter');

    expect(getActiveEditor()).not.toBeUndefined();

    keyDown('control/meta');

    mouseDown(spec().$container.find('thead th:eq(3)')[0]);
    mouseDown(spec().$container.find('tr:eq(3) th:eq(0)')[0]);

    keyUp('control/meta');

    expect(`
      |   ║ - : - : * : - : - |
      |===:===:===:===:===:===|
      | - ║ 0 :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | * ║ A : 0 : 1 : 0 : 0 |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select the entire column after column header is clicked (in fixed rows/cols corner)', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true,
      fixedRowsTop: 2,
      fixedColumnsStart: 2
    });

    spec().$container.find('.ht_clone_top_inline_start_corner thead th:eq(1)').simulate('mousedown');

    expect(getSelected()).toEqual([[-1, 0, 9, 0]]);
    expect(`
      |   ║ * :   |   :   :   |
      |===:===:===:===:===:===|
      | - ║ A :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      |---:---:---:---:---:---|
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
      | - ║ 0 :   |   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should select the entire fixed column after column header is clicked, ' +
    'after scroll horizontally', () => {
    handsontable({
      width: 200,
      height: 100,
      startRows: 10,
      startCols: 10,
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsStart: 2
    });

    render();
    scrollViewportTo({
      col: countCols() - 1,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    spec().$container.find('.ht_master thead th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_master thead th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 1, 9, 1]]);
    expect(`
      |   ║   : * |   :   :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      | - ║   : A |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should select the entire fixed column after column header is clicked, ' +
    'after scroll horizontally', () => {
    handsontable({
      width: 200,
      height: 126,
      startRows: 10,
      startCols: 10,
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsStart: 2
    });

    render();
    scrollViewportTo({
      col: countCols() - 1,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    spec().$container.find('.ht_master thead th:eq(2)').simulate('mousedown');
    spec().$container.find('.ht_master thead th:eq(2)').simulate('mouseup');

    expect(getSelected()).toEqual([[-1, 1, 9, 1]]);
    expect(`
      |   ║   : * |   :   :   :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===|
      | - ║   : A |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
      | - ║   : 0 |   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should set the selection end to the first visible row, when dragging the ' +
    'selection from a cell to a column header', async() => {
    handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    scrollViewportTo({
      row: 10,
      col: 10,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    await sleep(30);

    mouseDown(getCell(12, 11));
    spec().$container.find('.ht_clone_top thead th:eq(6)').simulate('mouseover'); // Header `L`

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 0, 11]]);
    expect(`
      |   ║   :   :   :   :   : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===:===|
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : A :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should set the selection end to the first visible row, when dragging the ' +
    'selection from a cell to a column header', async() => {
    handsontable({
      width: 200,
      height: 252,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    scrollViewportTo({
      row: 10,
      col: 10,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });

    render();

    await sleep(30);

    mouseDown(getCell(12, 11));
    spec().$container.find('.ht_clone_top thead th:eq(6)').simulate('mouseover'); // Header `L`

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 0, 11]]);
    expect(`
      |   ║   :   :   :   :   : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===:===|
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : 0 :   :   :   :   :   |
      | - ║   :   :   :   :   : A :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('classic')('should set the selection end to the first visible column, when dragging ' +
    'the selection from a cell to a row header', async() => {
    handsontable({
      width: 200,
      height: 200,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    scrollViewportTo({
      row: 10,
      col: 10,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    render();

    await sleep(30);

    mouseDown(getCell(12, 11));
    spec().$container.find('.ht_clone_inline_start tbody th:eq(12)')
      .simulate('mouseover')
      .simulate('mouseup');

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 12, 0]]);
    expect(`
      | - ║ - : - : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      | - ║ 0 : 0 : 0 : 0 : 0 : A :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it.forTheme('main')('should set the selection end to the first visible column, when dragging ' +
    'the selection from a cell to a row header', async() => {
    handsontable({
      width: 200,
      height: 245,
      startRows: 20,
      startCols: 20,
      colHeaders: true,
      rowHeaders: true
    });

    scrollViewportTo({
      row: 10,
      col: 10,
      verticalSnap: 'top',
      horizontalSnap: 'start',
    });
    render();

    await sleep(30);

    mouseDown(getCell(12, 11));
    spec().$container.find('.ht_clone_inline_start tbody th:eq(12)')
      .simulate('mouseover')
      .simulate('mouseup');

    await sleep(30);

    expect(getSelected()).toEqual([[12, 11, 12, 0]]);
    expect(`
      | - ║ - : - : - : - : - : - :   :   :   :   :   |
      |===:===:===:===:===:===:===:===:===:===:===:===|
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      | - ║ 0 : 0 : 0 : 0 : 0 : A :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
      |   ║   :   :   :   :   :   :   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select the entire row after row header is clicked', () => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    spec().$container.find('tr:eq(2) th:eq(0)').simulate('mousedown');

    expect(getSelected()).toEqual([[1, -1, 1, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should change selection after left mouse button on one of selected cell', () => {
    const hot = handsontable({
      rowHeaders: true,
      colHeaders: true,
      startRows: 5,
      startCols: 5
    });
    const cells = $('.ht_master.handsontable td');

    cells.eq(6).simulate('mousedown');
    cells.eq(18).simulate('mouseover');
    cells.eq(18).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[1, 1, 3, 3]]);
    expect(`
      |   ║   : - : - : - :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | - ║   : A : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      | - ║   : 0 : 0 : 0 :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();

    cells.eq(16).simulate('mousedown');
    cells.eq(16).simulate('mouseup');

    expect(hot.getSelected()).toEqual([[3, 1, 3, 1]]);
    expect(`
      |   ║   : - :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      | - ║   : # :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should select all cells when corner header is clicked', () => {
    handsontable({
      startRows: 5,
      startCols: 5,
      colHeaders: true,
      rowHeaders: true
    });

    spec().$container.find('thead').find('th').eq(0).simulate('mousedown');

    expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | - ║ A : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should be able to select one column headers after select all headers and cells', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetData(2, 2),
      colHeaders: true,
    });

    hot.selectAll();
    simulateClick(spec().$container.find('.ht_clone_top tr:eq(0) th:eq(1)'), 'LMB'); // Header "B"

    expect(getSelected()).toEqual([[-1, 1, 1, 1]]);
  });
});
