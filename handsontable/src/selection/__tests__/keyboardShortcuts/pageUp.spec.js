describe('Selection navigation', () => {
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

  describe('"PageUp"', () => {
    it.forTheme('classic')('should move the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will move up one per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 5,1 to: 5,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      await keyDownUp('pageup');

      expect(`
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it.forTheme('main')('should move the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 126, // 126/29 (default cell height) rounding down is 4. So PageUp will move up one per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 5,1 to: 5,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      await keyDownUp('pageup');

      expect(`
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it.forTheme('horizon')('should move the cell selection up by the height of the table viewport', async() => {
      handsontable({
        width: 180,
        height: 161, // 161/37 (default cell height) rounding down is 4. So PageUp will move up one per 4 rows
        startRows: 15,
        startCols: 3
      });

      await selectCell(13, 1);
      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 9,1 from: 9,1 to: 9,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 5,1 from: 5,1 to: 5,1']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   |
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);

      await keyDownUp('pageup');

      expect(`
        |   : # :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
    });

    it('should move the cell selection up to the first cell', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(3, 2);
      await keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should move the cell selection up to the first cell and then to the last cell of the previous column (autoWrap on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
      });

      await selectCell(3, 2);
      await keyDownUp('pageup');

      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);

      await keyDownUp('pageup');

      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    });

    it('should move the cell selection up to the first column header and then to the last cell of the previous column (autoWrap on, navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        autoWrapCol: true,
        autoWrapRow: true,
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

      await selectCell(3, 2);
      await keyDownUp('pageup');

      expect(`
        |   :   :   ║   :   : # :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,2 from: -3,2 to: -3,2']);

      await keyDownUp('pageup');

      expect(`
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   : - :   :   :   |
        |===:===:===:===:===:===:===:===|
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   :   ║   :   :   :   :   |
        |   :   : - ║   : # :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 4,1 from: 4,1 to: 4,1']);
    });

    it.forTheme('classic')('should move the cell selection up to the first column header and scroll ' +
      'the viewport (navigableHeaders on)', async() => {
      handsontable({
        height: 200,
        rowHeaders: true,
        colHeaders: true,
        startRows: 15,
        startCols: 3,
        autoWrapCol: true,
        autoWrapRow: true,
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

      await selectCell(13, 1);

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(9);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(5);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(0);
    });

    it.forTheme('main')('should move the cell selection up to the first column header and scroll ' +
      'the viewport (navigableHeaders on)', async() => {
      handsontable({
        height: 252,
        rowHeaders: true,
        colHeaders: true,
        startRows: 15,
        startCols: 3,
        autoWrapCol: true,
        autoWrapRow: true,
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

      await selectCell(13, 1);

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(9);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(5);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(0);
    });

    it.forTheme('horizon')('should move the cell selection up to the first column header and scroll ' +
      'the viewport (navigableHeaders on)', async() => {
      handsontable({
        height: 322,
        rowHeaders: true,
        colHeaders: true,
        startRows: 15,
        startCols: 3,
        autoWrapCol: true,
        autoWrapRow: true,
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

      await selectCell(13, 1);

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(9);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(5);

      await keyDownUp('pageup');

      await sleep(100);

      expect(tableView().getFirstFullyVisibleRow()).toBe(0);
    });

    it('should move the cell selection up for oversized row', async() => {
      handsontable({
        width: 180,
        height: 100,
        rowHeights: 200,
        navigableHeaders: false,
        startRows: 15,
        startCols: 3
      });

      await selectCell(9, 0);
      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 8,0 from: 8,0 to: 8,0']);

      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 7,0 from: 7,0 to: 7,0']);

      await keyDownUp('pageup');

      expect(getSelectedRange()).toEqualCellRange(['highlight: 6,0 from: 6,0 to: 6,0']);
    });
  });
});
