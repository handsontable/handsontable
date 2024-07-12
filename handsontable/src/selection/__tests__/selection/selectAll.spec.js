describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
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

  describe('`selectAll` method', () => {
    it('should select all cells with headers keeping the focus selection untouched', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true);

      expect(`
        | * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -1,-1 to: 3,5']);
    });

    it('should select all cells with headers and move the focus selection to another cell', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true, {
        focusPosition: { row: 2, col: 3 },
      });

      expect(`
        | * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : A : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,-1 to: 3,5']);
    });

    it('should select all cells with headers without highlighting headers', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true, {
        focusPosition: { row: 2, col: 3 },
        disableHeadersHighlight: true,
      });

      expect(`
        |   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : A : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,-1 to: 3,5']);
    });

    it('should select all cells without column headers', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, false);

      expect(`
        |   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 0,-1 to: 3,5']);
    });

    it('should select all cells without row headers', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(false, true);

      expect(`
        |   ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : A : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -1,0 to: 3,5']);
    });

    it('should select all cells and move the focus selection around the cells range', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
      });

      hot.selection.selectAll(true, true, {
        focusPosition: { row: 2, col: 4 }
      });

      expect(`
        | * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : A : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: -1,-1 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: -10, col: -10 }
      });

      expect(`
        | * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: 10, col: 10 }
      });

      expect(`
        | * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : A |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,5 from: -1,-1 to: 3,5']);
    });

    it('should select all cells and move the focus selection around the tables range (navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      hot.selection.selectAll(true, true, {
        focusPosition: { row: 2, col: 4 }
      });

      expect(`
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : A : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,4 from: -3,-3 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: -1, col: -2 }
      });

      expect(`
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : # : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-2 from: -3,-3 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: -3, col: -1 }
      });

      expect(`
        | * : * : # ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-1 from: -3,-3 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: -10, col: -10 }
      });

      expect(`
        | # : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: 3,5']);

      hot.selection.selectAll(true, true, {
        focusPosition: { row: 10, col: 10 }
      });

      expect(`
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : A |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,5 from: -3,-3 to: 3,5']);
    });

    it('should select all cells with headers and keep the focus selection untouched (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true);

      expect(`
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        | * : * : * ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : A : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -3,-3 to: 3,5']);
    });

    it('should select all cells with row headers and keep the focus selection untouched (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: false,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true);

      expect(`
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : A : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 0,-3 to: 3,5']);
    });

    it('should select all cells with column headers and keep the focus selection untouched (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: false,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, true);

      expect(`
        | * : * : * : * : * : * |
        | * : * : * : * : * : * |
        | * : * : * : * : * : * |
        |===:===:===:===:===:===|
        | 0 : 0 : 0 : 0 : 0 : 0 |
        | 0 : A : 0 : 0 : 0 : 0 |
        | 0 : 0 : 0 : 0 : 0 : 0 |
        | 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -3,0 to: 3,5']);
    });

    it('should select all cells without column headers (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(true, false);

      expect(`
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : A : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * : * : * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 0,-3 to: 3,5']);
    });

    it('should select all cells without row headers (multiple headers, navigableHeaders on)', () => {
      const hot = handsontable({
        data: createSpreadsheetObjectData(4, 6),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      selectCells([[1, 1, 2, 2]]);
      hot.selection.selectAll(false, true);

      expect(`
        |   :   :   ║ * : * : * : * : * : * |
        |   :   :   ║ * : * : * : * : * : * |
        |   :   :   ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===:===:===|
        |   :   : - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        |   :   : - ║ 0 : A : 0 : 0 : 0 : 0 |
        |   :   : - ║ 0 : 0 : 0 : 0 : 0 : 0 |
        |   :   : - ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -3,0 to: 3,5']);
    });

    it('should select row and column headers when all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
      });

      hot().selection.selectAll(true, true);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: -1,4']);
    });

    it('should not select row and column headers when all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
      });

      hot().selection.selectAll(false, false);

      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should select row and column headers when all rows are trimmed (multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      hot().selection.selectAll(true, true);

      expect(`
        | # :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║ - : - : - : - : - |
        |===:===:===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,-3 from: -3,-3 to: -1,4']);
    });

    it('should not select row and column headers when all rows are trimmed (multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      hot().selection.selectAll(false, false);

      expect(`
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });
  });
});
