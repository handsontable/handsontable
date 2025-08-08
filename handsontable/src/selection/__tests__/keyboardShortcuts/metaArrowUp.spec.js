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

  describe('"Ctrl/Cmd + ArrowUp"', () => {
    it('should move the cell selection to the first cell (first row) in a column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(3, 3);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: 0,3 to: 0,3']);
      expect(`
        |   ║   :   :   : - :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : # :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCells([[3, 1, 1, 3]]);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: 0,1 to: 0,1']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectColumns(2);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
      expect(`
        |   ║   :   : - :   :   |
        |===:===:===:===:===:===|
        | - ║   :   : # :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the first cell (first row) starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[1, 1, 1, 2], [2, 3, 2, 4]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control/meta', 'arrowup']);

      expect(`
        |   :   : # :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: 0,2 to: 0,2']);
    });

    it('should move the header selection to the most top header in a column (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        rowHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(3, -1);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top header in a column when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(3, -1);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top header in a column when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectCell(3, -1);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,-1 from: 0,-1 to: 0,-1']);
    });

    it('should move the header selection to the most top column header in a column when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      await selectCell(-1, 1);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
    });

    it('should move the header selection to the most top column header in a column when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
        afterGetColumnHeaderRenderers(headerRenderers) {
          headerRenderers.push(columnHeader.bind(this));
          headerRenderers.push(columnHeader.bind(this));
        },
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectCell(-1, 1);
      await keyDownUp(['control/meta', 'arrowup']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -3,1 from: -3,1 to: -3,1']);
    });
  });
});
