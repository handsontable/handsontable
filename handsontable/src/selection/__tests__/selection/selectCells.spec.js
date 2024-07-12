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

  describe('`selectCells` method', () => {
    it('should throw an exception when the passed range does not expect the required format', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      const error = 'Unsupported format of the selection ranges was passed. ' +
        'To select cells pass the coordinates as an array of arrays' +
        ' ([[rowStart, columnStart/columnPropStart, rowEnd, columnEnd/columnPropEnd]]) ' +
        'or as an array of CellRange objects.';

      hot().selection.selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(() => hot().selection.selectCells(1)).toThrowError(error);
      expect(() => hot().selection.selectCells(1, 2, 3, 4)).toThrowError(error);
      expect(() => hot().selection.selectCells([1])).toThrowError(error);
      expect(() => hot().selection.selectCells('prop0')).toThrowError(error);
      expect(() => hot().selection.selectCells(['prop0'])).toThrowError(error);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
    });

    it('should not deselect current selection it is called with one argument', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      const wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
      expect(wasSelected).toBe(true);

      /* eslint-disable no-empty */
      try {
        selectCells([[1]]);
      } catch (ex) {}

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
    });

    it('should highlight single cell (default selectionMode, without headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   : # :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight single cell (default selectionMode, without headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   : # :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight single cell (default selectionMode)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight single cell (default selectionMode, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight the single column header (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[-1, 1]])).toBe(true);
      expect(`
        |   ║   : # :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should highlight the single row header (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[1, -1]])).toBe(true);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | # ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
    });

    it('should highlight the single cell in corner (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
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

      expect(hot().selection.selectCells([[-1, -2]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   : # :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-2 from: -1,-2 to: -1,-2']);
    });

    it('should not highlight the range of the column headers (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[-1, 0, -1, 1]])).toBe(false);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[1, 1, -1, 1]])).toBe(false);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should not highlight the range of the row headers (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[0, -1, 1, -1]])).toBe(false);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[1, 1, 1, -1]])).toBe(false);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should not highlight single header (navigableHeaders off)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
      });

      expect(hot().selection.selectCells([[-1, 0]])).toBe(false);
      expect(`
        |   ║   :   :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should highlight single cell (default selectionMode, multiple headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   : - :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   : - ║   :   : # :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight single cell (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
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

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   : - :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   : - ║   :   : # :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight non-contiguous cells (default selectionMode, navigableHeaders off)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);

      expect(`
        |   ║ - : - : - : - |
        |===:===:===:===:===|
        | - ║ 0 :   :   :   |
        | - ║   :   : 0 : 0 |
        | - ║   : 0 : 1 : 0 |
        | - ║ 0 : 1 : 2 : 0 |
        | - ║   : 0 : D : 0 |
        | - ║   : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 5,1 from: 5,1 to: 2,2',
        'highlight: 4,3 from: 4,3 to: 1,2',
        'highlight: 3,0 from: 3,0 to: 3,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
      ]);
    });

    it('should highlight non-contiguous cells (default selectionMode, navigableHeaders off) using props', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(selectCells([
        [0, 0],
        [5, 'prop1', 2, 'prop2'],
        [4, 'prop3', 1, 'prop2'],
        [3, 'prop0', 3, 'prop2'],
        [4, 'prop2'],
        [4, 'prop2']
      ])).toBe(true);

      expect(`
        |   ║ - : - : - : - |
        |===:===:===:===:===|
        | - ║ 0 :   :   :   |
        | - ║   :   : 0 : 0 |
        | - ║   : 0 : 1 : 0 |
        | - ║ 0 : 1 : 2 : 0 |
        | - ║   : 0 : D : 0 |
        | - ║   : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 5,1 from: 5,1 to: 2,2',
        'highlight: 4,3 from: 4,3 to: 1,2',
        'highlight: 3,0 from: 3,0 to: 3,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
      ]);
    });

    it('should highlight non-contiguous cells (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
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

      expect(selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);

      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║ - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   : - ║ 0 :   :   :   |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   : 0 : 1 : 0 |
        |   :   : - ║ 0 : 1 : 2 : 0 |
        |   :   : - ║   : 0 : D : 0 |
        |   :   : - ║   : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 0,0',
        'highlight: 5,1 from: 5,1 to: 2,2',
        'highlight: 4,3 from: 4,3 to: 1,2',
        'highlight: 3,0 from: 3,0 to: 3,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
        'highlight: 4,2 from: 4,2 to: 4,2',
      ]);
    });

    it('should highlight range of the cells from top-left to bottom-right (default selectionMode, no headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectCells([[1, 2, 4, 5]])).toBe(true);
      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 4,5']);
    });

    it('should highlight range of the cells from top-left to bottom-right (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
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

      expect(hot().selection.selectCells([[1, 2, 4, 5]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   :   |
        |   :   : - ║   :   : A : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 4,5']);
    });

    it('should highlight range of the cells from top-right to bottom-left (default selectionMode, no headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectCells([[1, 5, 4, 2]])).toBe(true);
      expect(`
        |   :   :   :   :   :   |
        |   :   : 0 : 0 : 0 : A |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 4,2']);
    });

    it('should highlight range of the cells from top-right to bottom-left (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
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

      expect(hot().selection.selectCells([[1, 5, 4, 2]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   :   |
        |   :   : - ║   :   : 0 : 0 : 0 : A |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,5 from: 1,5 to: 4,2']);
    });

    it('should highlight range of the cells from bottom-left to top-right (default selectionMode, no headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectCells([[4, 2, 1, 5]])).toBe(true);
      expect(`
        |   :   :   :   :   :   |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : A : 0 : 0 : 0 |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 1,5']);
    });

    it('should highlight range of the cells from bottom-left to top-right (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
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

      expect(hot().selection.selectCells([[4, 2, 1, 5]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   :   |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : A : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 1,5']);
    });

    it('should highlight range of the cells from bottom-right to top-left (default selectionMode, no headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectCells([[4, 5, 1, 2]])).toBe(true);
      expect(`
        |   :   :   :   :   :   |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : A |
        |   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 4,5 to: 1,2']);
    });

    it('should highlight range of the cells from bottom-right to top-left (default selectionMode, multiple headers, navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 6),
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

      expect(hot().selection.selectCells([[4, 5, 1, 2]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   :   :   :   :   |
        |   :   :   ║   :   : - : - : - : - |
        |===:===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   :   |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 : 0 : A |
        |   :   :   ║   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,5 from: 4,5 to: 1,2']);
    });

    it('should not be possible to select the header (navigableHeaders off, with headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(3, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: false,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      expect(hot().selection.selectCells([[-1, 0]])).toBe(false);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[0, -1]])).toBe(false);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[0, 0], [-1, -1]])).toBe(false);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should be possible to select the header (navigableHeaders on, with headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(3, 4),
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

      expect(hot().selection.selectCells([[-2, 0]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║ # :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,0 from: -2,0 to: -2,0']);

      expect(hot().selection.selectCells([[0, -1]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   : # ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);

      expect(hot().selection.selectCells([[-2, -3, -2, -3]])).toBe(true);
      expect(`
        |   :   :   ║   :   :   :   |
        | # :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -2,-3 from: -2,-3 to: -2,-3']);
    });

    it('should not be possible to move the focus selection to header (navigableHeaders on, without headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectCells([[-2, 0]])).toBe(false);
      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[0, -1]])).toBe(false);
      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();

      expect(hot().selection.selectCells([[0, 0], [-1, -1]])).toBe(false);
      expect(`
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
    });

    it('should highlight only single cell when selectionMode is set as `single`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should not highlight a range of cells when selectionMode is set as `single`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([[1, 2, 2, 3]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });

    it('should not highlight a range of non-contiguous cells when selectionMode is set as `single`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
    });

    it('should highlight only single cell when selectionMode is set as `single` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should not highlight a range of cells when selectionMode is set as `single` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([[1, 2, 2, 3]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,2']);
    });

    it('should not highlight a range of non-contiguous cells when selectionMode is set as `single` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
    });

    it('should highlight only single cell when selectionMode is set as `range`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight a range of cells when selectionMode is set as `range`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectCells([[1, 2, 2, 3]])).toBe(true);
      expect(`
        |   ║   :   : - : - |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║   :   : A : 0 |
        | - ║   :   : 0 : 0 |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 2,3']);
    });

    it('should not highlight a range of non-contiguous cells when selectionMode is set as `range`', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
    });

    it('should highlight only single cell when selectionMode is set as `range` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectCells([[2, 2]])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,2 to: 2,2']);
    });

    it('should highlight a range of cells when selectionMode is set as `range` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectCells([[1, 2, 2, 3]])).toBe(true);
      expect(`
        |   ║   :   : - : - |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║   :   : A : 0 |
        | - ║   :   : 0 : 0 |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 2,3']);
    });

    it('should not highlight a range of non-contiguous cells when selectionMode is set as `single` and navigableHeaders is enabled', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectCells([
        [0, 0],
        [5, 1, 2, 2],
        [4, 3, 1, 2],
        [3, 0, 3, 2],
        [4, 2],
        [4, 2]
      ])).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 4,2']);
    });

    it('should highlight the headers when whole column and row is selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectCells([[0, 1, 5, 1], [0, 3, 5, 3]])).toBe(true);
      expect(`
        |   ║   : - :   : - |
        |===:===:===:===:===|
        | - ║   : 0 :   : A |
        | - ║   : 0 :   : 0 |
        | - ║   : 0 :   : 0 |
        | - ║   : 0 :   : 0 |
        | - ║   : 0 :   : 0 |
        | - ║   : 0 :   : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,1 from: 0,1 to: 5,1',
        'highlight: 0,3 from: 0,3 to: 5,3',
      ]);

      expect(hot().selection.selectCells([[1, 0, 1, 3], [3, 0, 3, 3]])).toBe(true);
      expect(`
        |   ║ - : - : - : - |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║ 0 : 0 : 0 : 0 |
        |   ║   :   :   :   |
        | - ║ A : 0 : 0 : 0 |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,0 from: 1,0 to: 1,3',
        'highlight: 3,0 from: 3,0 to: 3,3',
      ]);
    });

    it('should not deselect current selection when it is called with negative values', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(`
        | 0 : 0 : 0 :   |
        | 0 : B : 1 : 0 |
        | 0 : 1 : 1 : 0 |
        |   : 0 : 0 : 0 |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectCells([[0, -1, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[-1, 0, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[0, 0, 0, -1]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        | 0 : 0 : 0 :   |
        | 0 : B : 1 : 0 |
        | 0 : 1 : 1 : 0 |
        |   : 0 : 0 : 0 |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when it is called with negative values (navigableHeaders on, with headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        navigableHeaders: true,
        rowHeaders: true,
        colHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║ - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   : - ║ 0 : 0 : 0 :   |
        |   :   : - ║ 0 : B : 1 : 0 |
        |   :   : - ║ 0 : 1 : 1 : 0 |
        |   :   : - ║   : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectCells([[0, -1, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[-1, 0, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[0, 0, 0, -1]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║ - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   : - ║ 0 : 0 : 0 :   |
        |   :   : - ║ 0 : B : 1 : 0 |
        |   :   : - ║ 0 : 1 : 1 : 0 |
        |   :   : - ║   : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when it is called with coordinates beyond the table data range', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(`
        | 0 : 0 : 0 :   |
        | 0 : B : 1 : 0 |
        | 0 : 1 : 1 : 0 |
        |   : 0 : 0 : 0 |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectCells([[0, 4, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[6, 0, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[0, 0, 6, 4]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        | 0 : 0 : 0 :   |
        | 0 : B : 1 : 0 |
        | 0 : 1 : 1 : 0 |
        |   : 0 : 0 : 0 |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when it is called with coordinates beyond the table data range (navigableHeaders on, with headers)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        navigableHeaders: true,
        rowHeaders: true,
        colHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║ - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   : - ║ 0 : 0 : 0 :   |
        |   :   : - ║ 0 : B : 1 : 0 |
        |   :   : - ║ 0 : 1 : 1 : 0 |
        |   :   : - ║   : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectCells([[0, 4, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[6, 0, 0, 0]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[0, 0, 6, 4]]);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        |   :   :   ║ - : - : - : - |
        |===:===:===:===:===:===:===|
        |   :   : - ║ 0 : 0 : 0 :   |
        |   :   : - ║ 0 : B : 1 : 0 |
        |   :   : - ║ 0 : 1 : 1 : 0 |
        |   :   : - ║   : 0 : 0 : 0 |
        |   :   :   ║   :   :   :   |
        |   :   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 2,2',
        'highlight: 1,1 from: 1,1 to: 3,3',
      ]);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when it is called with undefined column property', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      });

      let wasSelected = hot().selection.selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

      expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectCells([[0, 'notExistProp']]);

      expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[0, 0, 0, 'notExistProp']]);

      expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectCells([[1, 1], [0, 0, 0, 'notExistProp']]);

      expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
      expect(wasSelected).toBe(false);
    });

    it('should select range of cells when at least the three arguments are passed', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      expect(hot().selection.selectCells([[0, 0, 1]])).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 1,0']);
    });

    it('should select range of cells when at least the three arguments are passed (column property)', () => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      expect(hot().selection.selectCells([[0, 'prop0', 1]])).toBe(true);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 1,0']);
    });

    it('should fire hooks with proper context', () => {
      const {
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      } = jasmine.createSpyObj('hooks', [
        'afterSelection',
        'afterSelectionByProp',
        'afterSelectionEnd',
        'afterSelectionEndByProp',
        'beforeSetRangeStart',
        'beforeSetRangeStartOnly',
        'beforeSetRangeEnd',
      ]);

      const hot = handsontable({
        data: createSpreadsheetObjectData(20, 20),
        height: 300,
        width: 300,
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      });

      hot.selection.selectCells([[1, 2]]);

      expect(afterSelection.calls.first().object).toBe(hot);
      expect(afterSelectionByProp.calls.first().object).toBe(hot);
      expect(afterSelectionEnd.calls.first().object).toBe(hot);
      expect(afterSelectionEndByProp.calls.first().object).toBe(hot);
      expect(beforeSetRangeStartOnly.calls.first().object).toBe(hot);
    });

    it('should fire hooks with proper arguments when a single cell is selected', () => {
      const {
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      } = jasmine.createSpyObj('hooks', [
        'afterSelection',
        'afterSelectionByProp',
        'afterSelectionEnd',
        'afterSelectionEndByProp',
        'beforeSetRangeStart',
        'beforeSetRangeStartOnly',
        'beforeSetRangeEnd',
      ]);

      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
        height: 300,
        width: 300,
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      });

      hot().selection.selectCells([[1, 2]]);

      expect(afterSelection.calls.count()).toBe(1);
      expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 1, 2, jasmine.any(Object), 0]);

      expect(afterSelectionByProp.calls.count()).toBe(1);
      expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', jasmine.any(Object), 0]);

      expect(afterSelectionEnd.calls.count()).toBe(1);
      expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 1, 2, 0]);

      expect(afterSelectionEndByProp.calls.count()).toBe(1);
      expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', 0]);

      expect(beforeSetRangeStart.calls.count()).toBe(0);

      expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
    });

    it('should fire hooks with proper arguments when range of the cells are selected', () => {
      const {
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      } = jasmine.createSpyObj('hooks', [
        'afterSelection',
        'afterSelectionByProp',
        'afterSelectionEnd',
        'afterSelectionEndByProp',
        'beforeSetRangeStart',
        'beforeSetRangeStartOnly',
        'beforeSetRangeEnd',
      ]);

      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
        height: 300,
        width: 300,
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      });

      hot().selection.selectCells([[1, 2, 2, 4]]);

      expect(afterSelection.calls.count()).toBe(1);
      expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 2, 4, jasmine.any(Object), 0]);

      expect(afterSelectionByProp.calls.count()).toBe(1);
      expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', jasmine.any(Object), 0]);

      expect(afterSelectionEnd.calls.count()).toBe(1);
      expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 2, 4, 0]);

      expect(afterSelectionEndByProp.calls.count()).toBe(1);
      expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', 0]);

      expect(beforeSetRangeStart.calls.count()).toBe(0);

      expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
    });

    it('should fire hooks with proper arguments when the non-contiguous selection is added', () => {
      const {
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      } = jasmine.createSpyObj('hooks', [
        'afterSelection',
        'afterSelectionByProp',
        'afterSelectionEnd',
        'afterSelectionEndByProp',
        'beforeSetRangeStart',
        'beforeSetRangeStartOnly',
        'beforeSetRangeEnd',
      ]);

      handsontable({
        data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
        height: 300,
        width: 300,
        afterSelection,
        afterSelectionByProp,
        afterSelectionEnd,
        afterSelectionEndByProp,
        beforeSetRangeStart,
        beforeSetRangeStartOnly,
        beforeSetRangeEnd,
      });

      selectCells([[1, 2, 2, 4], [2, 1, 3, 2], [7, 7], [8, 4, 0, 4], [2, 4]]);

      expect(afterSelection.calls.count()).toBe(5);
      expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 2, 4, jasmine.any(Object), 0]);
      expect(afterSelection.calls.argsFor(1)).toEqual([2, 1, 3, 2, jasmine.any(Object), 1]);
      expect(afterSelection.calls.argsFor(2)).toEqual([7, 7, 7, 7, jasmine.any(Object), 2]);
      expect(afterSelection.calls.argsFor(3)).toEqual([8, 4, 0, 4, jasmine.any(Object), 3]);
      expect(afterSelection.calls.argsFor(4)).toEqual([2, 4, 2, 4, jasmine.any(Object), 4]);

      expect(afterSelectionByProp.calls.count()).toBe(5);
      expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', jasmine.any(Object), 0]);
      expect(afterSelectionByProp.calls.argsFor(1)).toEqual([2, 'prop1', 3, 'prop2', jasmine.any(Object), 1]);
      expect(afterSelectionByProp.calls.argsFor(2)).toEqual([7, 'prop7', 7, 'prop7', jasmine.any(Object), 2]);
      expect(afterSelectionByProp.calls.argsFor(3)).toEqual([8, 'prop4', 0, 'prop4', jasmine.any(Object), 3]);
      expect(afterSelectionByProp.calls.argsFor(4)).toEqual([2, 'prop4', 2, 'prop4', jasmine.any(Object), 4]);

      expect(afterSelectionEnd.calls.count()).toBe(1);
      expect(afterSelectionEnd.calls.argsFor(0)).toEqual([2, 4, 2, 4, 4]);

      expect(afterSelectionEndByProp.calls.count()).toBe(1);
      expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([2, 'prop4', 2, 'prop4', 4]);

      expect(beforeSetRangeStart.calls.count()).toBe(0);

      expect(beforeSetRangeStartOnly.calls.count()).toBe(5);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
      expect(beforeSetRangeStartOnly.calls.argsFor(1)[0].row).toBe(2);
      expect(beforeSetRangeStartOnly.calls.argsFor(1)[0].col).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(2)[0].row).toBe(7);
      expect(beforeSetRangeStartOnly.calls.argsFor(2)[0].col).toBe(7);
      expect(beforeSetRangeStartOnly.calls.argsFor(3)[0].row).toBe(8);
      expect(beforeSetRangeStartOnly.calls.argsFor(3)[0].col).toBe(4);
      expect(beforeSetRangeStartOnly.calls.argsFor(4)[0].row).toBe(2);
      expect(beforeSetRangeStartOnly.calls.argsFor(4)[0].col).toBe(4);
    });
  });
});
