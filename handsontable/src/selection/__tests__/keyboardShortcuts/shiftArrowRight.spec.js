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

  describe('"Shift + ArrowRight"', () => {
    it('should extend the cell selection to the right cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,2']);
    });

    it('should extend the cells selection to the right cells of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 3, 1]]);
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,2']);
    });

    it('should extend the cells selection to the right of the another active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[0, 0, 1, 0], [1, 1, 2, 1], [2, 2, 3, 2]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        |   : A : 1 :   :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,0',
        'highlight: 2,1 from: 1,1 to: 2,2',
        'highlight: 2,2 from: 2,2 to: 3,2',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 : 0 :   :   :   |
        | A : 1 : 0 :   :   |
        |   : 0 : 1 :   :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,0 from: 0,0 to: 1,1',
        'highlight: 1,1 from: 1,1 to: 2,2',
        'highlight: 2,2 from: 2,2 to: 3,2',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        | 0 : 0 :   :   :   |
        | 0 : 1 : 0 :   :   |
        |   : 0 : 1 : 0 :   |
        |   :   : A : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 0,0 from: 0,0 to: 1,1',
        'highlight: 1,1 from: 1,1 to: 2,2',
        'highlight: 3,2 from: 2,2 to: 3,3',
      ]);
    });

    it('should extend the cells selection to the right when focus is moved within a range', async() => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      await selectCells([[1, 4, 3, 1]]);
      await keyDownUp(['shift', 'tab']); // move cell focus left
      await keyDownUp(['shift', 'tab']); // move cell focus left
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,4 to: 3,2']);

      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);

      await keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);
    });

    it('should extend the column header selection to the right column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : * : * :   :   |
        |===:===:===:===:===:===|
        | - ║   : A : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,2']);
    });

    it('should extend the column header selection to the right column header when focus is moved within a range', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 6
      });

      await selectColumns(4, 1);
      await listen();
      await keyDownUp(['shift', 'tab']); // move cell focus left
      await keyDownUp(['shift', 'tab']); // move cell focus left
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   :   : * : * : * :   |
        |===:===:===:===:===:===:===|
        | - ║   :   : A : 0 : 0 :   |
        | - ║   :   : 0 : 0 : 0 :   |
        | - ║   :   : 0 : 0 : 0 :   |
        | - ║   :   : 0 : 0 : 0 :   |
        | - ║   :   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,4 to: 4,2']);

      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   :   : * : * : * : * |
        |===:===:===:===:===:===:===|
        | - ║   :   : A : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,5']);

      await keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,5']);
    });

    it('should extend the column header selection to the right visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(3, true);
      await render();

      await selectColumns(1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : * : * |
        |===:===:===:===|
        | - ║   : A : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,4']);
    });

    it('should extend the column header selection to the right column header (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(1, 1, -1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : # : * :   :   |
        |===:===:===:===:===:===|
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 4,2']);
    });

    it('should not extend the column header selection to the right column header when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectColumns(1, 1, -1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : # :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should not extend the column header selection to the right column header when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectColumns(1, 1, -1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : # :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 4,1']);
    });

    it('should not change the selection when row header is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectRows(1);
      await listen();
      await keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 1,4']);
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
      await keyDownUp(['shift', 'arrowright']);

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
      await keyDownUp(['shift', 'arrowright']);

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
      await keyDownUp(['shift', 'arrowright']);

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
      await keyDownUp(['shift', 'arrowright']);

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
