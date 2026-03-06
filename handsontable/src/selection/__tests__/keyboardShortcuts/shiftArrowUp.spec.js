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
    it('should extend the cell selection up of the current column when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 1);
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 :   :   :   |
        |   : A :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 1,1']);
    });

    it('should extend the cells selection up of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[3, 2, 2, 1]]);
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 1,1']);
    });

    it('should extend the cells selection up of the another active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[2, 1, 2, 2], [3, 2, 3, 3], [4, 3, 4, 4]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   : 0 : 1 : 0 :   |
        |   :   : 0 : A :   |
        |   :   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,1 from: 2,1 to: 2,2',
        'highlight: 3,3 from: 3,2 to: 2,3',
        'highlight: 4,3 from: 4,3 to: 4,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : B : 0 :   |
        |   :   : 0 : 0 :   |
        |   :   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,1 to: 1,2',
        'highlight: 2,2 from: 3,2 to: 2,3',
        'highlight: 4,3 from: 4,3 to: 4,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 1 : 0 :   |
        |   :   : 0 : 1 : 0 |
        |   :   :   : 0 : A |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,1 from: 2,1 to: 1,2',
        'highlight: 2,2 from: 3,2 to: 2,3',
        'highlight: 4,4 from: 4,3 to: 3,4',
      ]);
    });

    it('should extend the row header selection up to the previous row header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectRows(2);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should extend the row header selection up to the previous visible row header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);
      await render();

      await selectRows(3);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 0,4']);
    });

    it('should extend the row header selection up to the previous row header (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectRows(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not extend the row header selection up to the previous row header when there is no columns (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectRows(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not extend the row header selection up to the previous row header when all columns are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectRows(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not change the selection when column header is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not change the selection when all cells are selected (triggered by corner click)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await listen();

      await selectAll();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not change the selection when the column header is highlighted', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not change the selection when the row header is highlighted', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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

    it('should not change the selection when the corner is highlighted', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      await listen();
      await keyDownUp(['shift', 'arrowup']);

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
