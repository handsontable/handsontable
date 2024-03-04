describe('Selection extending', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Shift + ArrowUp"', () => {
    it('should extend the cell selection up of the current column when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 1);
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 :   :   :   |
        |   : A :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 1,1']);
    });

    it('should extend the cells selection up of the current row when the range of the cells are selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[3, 2, 2, 1]]);
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 1,1']);
    });

    it('should extend the row header selection up to the previous row header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(2);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,0 from: 2,-1 to: 1,4']);
    });

    it('should extend the row header selection up to the previous visible row header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);
      render();

      selectRows(3);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 0,4']);
    });

    it('should extend the row header selection up to the previous row header (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(2, 2, -1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | # ║ 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 1,4']);
    });

    it('should not extend the row header selection up to the previous row header when there is no columns (navigableHeaders on)', () => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectRows(2, 2, -1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   |
        |===|
        |   |
        |   |
        | # |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,-1']);
    });

    it('should not extend the row header selection up to the previous row header when all columns are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectRows(2, 2, -1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   |
        |===|
        |   |
        |   |
        | # |
        |   |
        |   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,-1 from: 2,-1 to: 2,4']);
    });

    it('should not change the selection when column header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║   : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : A :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,1']);
    });

    it('should not change the selection when all cells are selected (triggered by corner click)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectAll();
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 4,4']);
    });

    it('should not change the selection when the column header is highlighted', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║   : # :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should not change the selection when the row header is highlighted', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | # ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 1,-1']);
    });

    it('should not change the selection when the corner is highlighted', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      listen();
      keyDownUp(['shift', 'arrowup']);

      expect(`
        | # ║   :   :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });
  });
});
