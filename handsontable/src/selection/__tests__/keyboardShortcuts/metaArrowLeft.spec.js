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

  function rowHeader(renderableRowIndex, TH) {
    const visualRowIndex = renderableRowIndex >= 0 ?
      this.rowIndexMapper.getVisualFromRenderableIndex(renderableRowIndex) : renderableRowIndex;

    this.view.appendRowHeader(visualRowIndex, TH);
  }

  describe('"Ctrl/Cmd + ArrowLeft"', () => {
    it('should move the cell selection to the most left cell in a row', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
      });

      await selectCell(1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectCells([[3, 3, 1, 1]]);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,0 to: 3,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();

      await selectRows(2);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,0 to: 2,0']);
      expect(`
        |   ║ - :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | - ║ # :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
    });

    it('should move the cell selection to the most left cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
      });

      await selectCells([[0, 2, 1, 2], [3, 2, 4, 2]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | # :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,0 to: 1,0']);
    });

    it('should move the header selection to the most left header in a row (navigableHeaders on)', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left header in a row when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left header in a row when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectCell(-1, 3);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,0 from: -1,0 to: -1,0']);
    });

    it('should move the header selection to the most left row header in a row when there is no columns (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      await selectCell(1, -1);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
    });

    it('should move the header selection to the most left row header in a row when all columns are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        navigableHeaders: true,
        afterGetRowHeaderRenderers(headerRenderers) {
          headerRenderers.push(rowHeader.bind(this));
          headerRenderers.push(rowHeader.bind(this));
        },
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectCell(1, -1);
      await keyDownUp(['control/meta', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-3 from: 1,-3 to: 1,-3']);
    });
  });
});
