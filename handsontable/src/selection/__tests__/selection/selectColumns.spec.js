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

  describe('`selectColumns` method', () => {
    it('should highlight single column (default selectionMode, without headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   :   : A :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode, without headers, navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   :   : A :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        |   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   ║   :   : * :   |
        |===:===:===:===:===|
        | - ║   :   : A :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode, navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   ║   :   : * :   |
        |===:===:===:===:===|
        | - ║   :   : A :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode, multiple headers)', async() => {
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

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   :   :   ║   :   : * :   |
        |   :   :   ║   :   : * :   |
        |   :   :   ║   :   : * :   |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode, multiple headers, navigableHeaders on)', async() => {
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

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   :   :   ║   :   : * :   |
        |   :   :   ║   :   : * :   |
        |   :   :   ║   :   : * :   |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        |   :   : - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight non-contiguous selection when CTRL key is pressed', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      await listen();
      hot().selection.selectColumns(2);
      await keyDown('control/meta');
      hot().selection.selectColumns(0);
      await keyUp('control/meta');

      expect(`
        |   ║ * :   : * :   |
        |===:===:===:===:===|
        | - ║ A :   : 0 :   |
        | - ║ 0 :   : 0 :   |
        | - ║ 0 :   : 0 :   |
        | - ║ 0 :   : 0 :   |
        | - ║ 0 :   : 0 :   |
        | - ║ 0 :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,2 from: -1,2 to: 5,2',
        'highlight: 0,0 from: -1,0 to: 5,0',
      ]);
    });

    it('should highlight non-contiguous selection when CTRL key is pressed (multiple headers, navigableHeaders on)', async() => {
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

      // After changes introduced in Handsontable 12.0.0 we handle shortcuts only by listening Handsontable.
      // Please keep in mind that selectColumns/selectRows doesn't set instance to listening (see #7290).
      await listen();
      hot().selection.selectColumns(2);
      await keyDown('control/meta');
      hot().selection.selectColumns(0);
      await keyUp('control/meta');

      expect(`
        |   :   :   ║ * :   : * :   |
        |   :   :   ║ * :   : * :   |
        |   :   :   ║ * :   : * :   |
        |===:===:===:===:===:===:===|
        |   :   : - ║ A :   : 0 :   |
        |   :   : - ║ 0 :   : 0 :   |
        |   :   : - ║ 0 :   : 0 :   |
        |   :   : - ║ 0 :   : 0 :   |
        |   :   : - ║ 0 :   : 0 :   |
        |   :   : - ║ 0 :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,2 from: -1,2 to: 5,2',
        'highlight: 0,0 from: -1,0 to: 5,0',
      ]);
    });

    it('should highlight single column (default selectionMode, fixedColumnsStart enabled)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        fixedColumnsStart: 2,
      });

      expect(hot().selection.selectColumns(1, 2)).toBe(true);
      expect(`
        |   ║   : * | * :   |
        |===:===:===:===:===|
        | - ║   : A | 0 :   |
        | - ║   : 0 | 0 :   |
        | - ║   : 0 | 0 :   |
        | - ║   : 0 | 0 :   |
        | - ║   : 0 | 0 :   |
        | - ║   : 0 | 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 5,2']);
    });

    it('should highlight single column (default selectionMode) using column property', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns('prop2')).toBe(true);
      expect(`
        |   ║   :   : * :   |
        |===:===:===:===:===|
        | - ║   :   : A :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight single column (default selectionMode, navigableHeaders on) using column property', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns('prop2')).toBe(true);
      expect(`
        |   ║   :   : * :   |
        |===:===:===:===:===|
        | - ║   :   : A :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        | - ║   :   : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,2']);
    });

    it('should highlight range of the columns (default selectionMode)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns(2, 3)).toBe(true);
      expect(`
        |   ║   :   : * : * |
        |===:===:===:===:===|
        | - ║   :   : A : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,3']);
    });

    it('should highlight range of the columns (default selectionMode, multiple headers, navigableHeaders on)', async() => {
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

      expect(hot().selection.selectColumns(2, 3)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,3']);
    });

    it('should highlight range of the columns (default selectionMode, reversed selection)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns(3, 2)).toBe(true);
      expect(`
        |   ║   :   : * : * |
        |===:===:===:===:===|
        | - ║   :   : 0 : A |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 5,2']);
    });

    it('should highlight range of the columns (default selectionMode, reversed selection, multiple headers, navigableHeaders on)', async() => {
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

      expect(hot().selection.selectColumns(3, 2)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : A |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 5,2']);
    });

    it('should highlight range of the columns (default selectionMode) using column property', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns('prop2', 'prop3')).toBe(true);
      expect(`
        |   ║   :   : * : * |
        |===:===:===:===:===|
        | - ║   :   : A : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 5,3']);
    });

    it('should highlight range of the columns (default selectionMode, reversed selection) using column property', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
      });

      expect(hot().selection.selectColumns('prop3', 'prop2')).toBe(true);
      expect(`
        |   ║   :   : * : * |
        |===:===:===:===:===|
        | - ║   :   : 0 : A |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        | - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 5,2']);
    });

    it('should be possible to move the focus (by passing a number) selection around cells range (navigableHeaders off, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, 1)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, 2)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : A : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 2,3']);
    });

    it('should be possible to move the focus (by passing an object) selection around cells range (navigableHeaders off, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, { row: 1, col: 2 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 2, col: 3 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : A |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 1, col: 1 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -1,2 to: 2,3']);
    });

    it('should not be possible to move the focus (by passing a number) selection around headers range (navigableHeaders off, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, -1)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, -3)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -3,2 to: 2,3']);
    });

    it('should not be possible to move the focus (by passing an object) selection around headers range (navigableHeaders off, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, { row: 0, col: -1 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 0, col: 1 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 0, col: 4 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : A |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,2 to: 2,3']);
    });

    it('should be possible to move the focus (by passing a number) selection around headers and cells range (navigableHeaders on, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, -1)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : # : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, -3)).toBe(true);
      expect(`
        |   :   :   ║   :   : # : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, 0)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, 2)).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : A : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 2,3']);
    });

    it('should be possible to move the focus (by passing an object) selection around headers and cells range (navigableHeaders on, with headers)', async() => {
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

      expect(hot().selection.selectColumns(2, 3, { row: -1, col: 2 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : # : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: -3, col: 3 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : # |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,3 from: -3,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 0, col: -1 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : A : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 2,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 2, col: 3 })).toBe(true);
      expect(`
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |   :   :   ║   :   : * : * |
        |===:===:===:===:===:===:===|
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : 0 |
        |   :   : - ║   :   : 0 : A |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,2 to: 2,3']);
    });

    it('should be possible to move the focus (by passing a number) selection around cells range (navigableHeaders on, without headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2, 3, 1)).toBe(true);
      expect(`
        |   :   : 0 : 0 |
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 0,2 to: 5,3']);

      expect(hot().selection.selectColumns(2, 3, 4)).toBe(true);
      expect(`
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 0,2 to: 5,3']);
    });

    it('should be possible to move the focus (by passing an object) selection around cells range (navigableHeaders on, without headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2, 3, { row: 1, col: 3 })).toBe(true);
      expect(`
        |   :   : 0 : 0 |
        |   :   : 0 : A |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 0,2 to: 5,3']);

      expect(hot().selection.selectColumns(2, 3, { row: 4, col: 3 })).toBe(true);
      expect(`
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : A |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,3 from: 0,2 to: 5,3']);
    });

    it('should not be possible to move the focus (by passing a number) selection around headers range (navigableHeaders on, without headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2, 3, -1)).toBe(true);
      expect(`
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,3']);

      expect(hot().selection.selectColumns(2, 3, -3)).toBe(true);
      expect(`
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,3']);
    });

    it('should not be possible to move the focus (by passing an object) selection around headers range (navigableHeaders on, without headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: false,
        rowHeaders: false,
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(2, 3, { row: -1, col: 2 })).toBe(true);
      expect(`
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,3']);

      expect(hot().selection.selectColumns(2, 3, { row: -3, col: 2 })).toBe(true);
      expect(`
        |   :   : A : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        |   :   : 0 : 0 |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 5,3']);
    });

    it('should highlight only single cell when selectionMode is set as `single`', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should highlight only single cell when selectionMode is set as `single` and navigableHeaders is enabled', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        navigableHeaders: true,
        selectionMode: 'single',
      });

      expect(hot().selection.selectColumns(2)).toBe(true);
      expect(`
        |   ║   :   : - :   |
        |===:===:===:===:===|
        | - ║   :   : # :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should highlight the range of the columns when selectionMode is set as `range`', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'range',
      });

      expect(hot().selection.selectColumns(1, 2)).toBe(true);
      expect(`
        |   ║   : * : * :   |
        |===:===:===:===:===|
        | - ║   : A : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 5,2']);
    });

    it('should highlight the range of the columns when selectionMode is set as `range` and navigableHeaders is enabled', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
        colHeaders: true,
        rowHeaders: true,
        selectionMode: 'range',
        navigableHeaders: true,
      });

      expect(hot().selection.selectColumns(1, 2)).toBe(true);
      expect(`
        |   ║   : * : * :   |
        |===:===:===:===:===|
        | - ║   : A : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        | - ║   : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 5,2']);
    });

    it('should not highlight headers as selected when there are no rows', async() => {
      handsontable({
        data: [],
        colHeaders: true,
        columns: [{ }, { }],
      });

      let wasSelected = hot().selection.selectColumns(0);

      expect(`
        | * :   |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,0 to: -1,0']);
      expect(wasSelected).toBeTrue();

      await deselectCell();
      wasSelected = hot().selection.selectColumns(1);

      expect(`
        |   : * |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: -1,1']);
      expect(wasSelected).toBeTrue();

      await deselectCell();
      wasSelected = hot().selection.selectColumns(1, 2);

      expect(`
        |   :   |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
      expect(wasSelected).toBeFalse();
    });

    it('should highlight headers as selected when there are no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        navigableHeaders: true,
        colHeaders: true,
        columns: [{ }, { }],
      });

      let wasSelected = hot().selection.selectColumns(0);

      expect(`
        | # :   |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
      expect(wasSelected).toBeTrue();

      await deselectCell();
      wasSelected = hot().selection.selectColumns(1);

      expect(`
        |   : # |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
      expect(wasSelected).toBeTrue();

      await deselectCell();
      wasSelected = hot().selection.selectColumns(1, 2);

      expect(`
        |   :   |
        |===:===|
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toBeUndefined();
      expect(wasSelected).toBeFalse();
    });

    it('should not deselect current selection when selectColumns is called without arguments', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      await selectCell(1, 1); // Initial selection.

      expect(`
        |   :   :   :   |
        |   : # :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      hot().selection.selectColumns();

      expect(`
        |   :   :   :   |
        |   : # :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
    });

    it('should not deselect current selection when selectColumns is called with negative values', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      let wasSelected = await selectCell(0, 0, 2, 2); // Initial selection.

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectColumns(0, -1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-1, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-3, -1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when selectColumns is called with negative values (navigableHeaders on, with headers)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
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

      let wasSelected = await selectCell(0, 0, 2, 2); // Initial selection.

      expect(`
        |   :   ║   :   :   :   |
        |   :   ║ - : - : - :   |
        |===:===:===:===:===:===|
        |   : - ║ A : 0 : 0 :   |
        |   : - ║ 0 : 0 : 0 :   |
        |   : - ║ 0 : 0 : 0 :   |
        |   :   ║   :   :   :   |
        |   :   ║   :   :   :   |
        |   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectColumns(0, -1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-1, 0);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-3, -1);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(-2);

      expect(`
        |   :   ║   :   :   :   |
        |   :   ║ - : - : - :   |
        |===:===:===:===:===:===|
        |   : - ║ A : 0 : 0 :   |
        |   : - ║ 0 : 0 : 0 :   |
        |   : - ║ 0 : 0 : 0 :   |
        |   :   ║   :   :   :   |
        |   :   ║   :   :   :   |
        |   :   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when selectColumns is called with coordinates beyond the table data range', async() => {
      handsontable({
        data: createSpreadsheetObjectData(3, 4),
      });

      let wasSelected = await selectCell(0, 0, 2, 2); // Initial selection.

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectColumns(3, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(0, 4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(4);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns(200);

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);
    });

    it('should not deselect current selection when selectColumns is called with undefined column property', async() => {
      handsontable({
        data: createSpreadsheetObjectData(6, 4),
      });

      let wasSelected = await selectCell(0, 0, 2, 2); // Initial selection.

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(true);

      wasSelected = hot().selection.selectColumns(0, 'notExistProp');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);

      wasSelected = hot().selection.selectColumns('notExistProp');

      expect(`
        | A : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        | 0 : 0 : 0 :   |
        |   :   :   :   |
        |   :   :   :   |
        |   :   :   :   |
        `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 2,2']);
      expect(wasSelected).toBe(false);
    });

    it('should not the scroll the viewport when column is selected', async() => {
      handsontable({
        data: createSpreadsheetObjectData(20, 20),
        height: 300,
        width: 300,
      });

      await selectCell(15, 1); // Scroll to the bottom of the Hot viewport.

      const scrollTop = tableView()._wt.wtTable.holder.scrollTop;

      selection().selectColumns(1);

      expect(tableView()._wt.wtTable.holder.scrollTop).toBe(scrollTop);
    });

    it('should fire hooks with proper context', async() => {
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

      selection().selectColumns(1, 2);

      expect(afterSelection.calls.first().object).toBe(hot);
      expect(afterSelectionByProp.calls.first().object).toBe(hot);
      expect(afterSelectionEnd.calls.first().object).toBe(hot);
      expect(afterSelectionEndByProp.calls.first().object).toBe(hot);
      expect(beforeSetRangeStartOnly.calls.first().object).toBe(hot);
    });

    it('should fire hooks with proper arguments when a single column is selected', async() => {
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

      hot().selection.selectColumns(1);

      expect(afterSelection.calls.count()).toBe(1);
      expect(afterSelection.calls.argsFor(0)).toEqual([0, 1, 19, 1, jasmine.any(Object), 0]);

      expect(afterSelectionByProp.calls.count()).toBe(1);
      expect(afterSelectionByProp.calls.argsFor(0)).toEqual([0, 'prop1', 19, 'prop1', jasmine.any(Object), 0]);

      expect(afterSelectionEnd.calls.count()).toBe(1);
      expect(afterSelectionEnd.calls.argsFor(0)).toEqual([0, 1, 19, 1, 0]);

      expect(afterSelectionEndByProp.calls.count()).toBe(1);
      expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([0, 'prop1', 19, 'prop1', 0]);

      expect(beforeSetRangeStart.calls.count()).toBe(0);

      expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(0);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(1);
    });

    it('should fire hooks with proper arguments when range of the columns are selected', async() => {
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

      hot().selection.selectColumns(1, 2);

      expect(afterSelection.calls.count()).toBe(1);
      expect(afterSelection.calls.argsFor(0)).toEqual([0, 1, 19, 2, jasmine.any(Object), 0]);

      expect(afterSelectionByProp.calls.count()).toBe(1);
      expect(afterSelectionByProp.calls.argsFor(0)).toEqual([0, 'prop1', 19, 'prop2', jasmine.any(Object), 0]);

      expect(afterSelectionEnd.calls.count()).toBe(1);
      expect(afterSelectionEnd.calls.argsFor(0)).toEqual([0, 1, 19, 2, 0]);

      expect(afterSelectionEndByProp.calls.count()).toBe(1);
      expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([0, 'prop1', 19, 'prop2', 0]);

      expect(beforeSetRangeStart.calls.count()).toBe(0);

      expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(0);
      expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(1);
    });
  });
});
