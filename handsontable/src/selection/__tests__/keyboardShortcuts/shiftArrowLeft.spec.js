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

  describe('"Shift + ArrowLeft"', () => {
    it('should extend the cell selection to the left cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 2);
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 1,1']);
    });

    it('should extend the cells selection to the left cells of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 2, 3, 2]]);
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : A :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,1']);
    });

    it('should extend the cells selection to the left of the another active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[2, 2, 3, 2], [1, 3, 2, 3], [0, 4, 1, 4]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   : 0 |
        |   :   : 0 : 0 : 0 |
        |   :   : 1 : A :   |
        |   :   : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,2 from: 2,2 to: 3,2',
        'highlight: 2,3 from: 1,3 to: 2,2',
        'highlight: 0,4 from: 0,4 to: 1,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   : 0 |
        |   :   : 0 : 0 : 0 |
        |   : 0 : 1 : 0 :   |
        |   : 0 : A :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 3,2 from: 2,2 to: 3,1',
        'highlight: 1,2 from: 1,3 to: 2,2',
        'highlight: 0,4 from: 0,4 to: 1,4',
      ]);

      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   : 0 : 0 |
        |   :   : 0 : 1 : A |
        |   : 0 : 1 : 0 :   |
        |   : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 2,1 from: 2,2 to: 3,1',
        'highlight: 1,2 from: 1,3 to: 2,2',
        'highlight: 1,4 from: 0,4 to: 1,3',
      ]);
    });

    it('should extend the cells selection to the left when focus is moved within a range', async() => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      await selectCells([[1, 1, 3, 4]]);
      await keyDownUp('tab'); // move cell focus right
      await keyDownUp('tab'); // move cell focus right
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        |   : 0 : 0 : A :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,1 to: 3,3']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   :   |
        | 0 : 0 : 0 : A :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        | 0 : 0 : 0 : 0 :   :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);
    });

    it('should extend the column header selection to the left column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(2);
      await listen();
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║   : * : * :   :   |
        |===:===:===:===:===:===|
        | - ║   : 0 : A :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,1']);
    });

    it('should extend the column header selection to the left column header when focus is moved within a range', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 6
      });

      await selectColumns(1, 4);
      await listen();
      await keyDownUp('tab'); // move cell focus right
      await keyDownUp('tab'); // move cell focus right
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║   : * : * : * :   :   |
        |===:===:===:===:===:===:===|
        | - ║   : 0 : 0 : A :   :   |
        | - ║   : 0 : 0 : 0 :   :   |
        | - ║   : 0 : 0 : 0 :   :   |
        | - ║   : 0 : 0 : 0 :   :   |
        | - ║   : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,1 to: 4,3']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : * :   :   |
        |===:===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : A :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   |
        | - ║ 0 : 0 : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,0']);

      await keyDownUp(['shift', 'arrowleft']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,0']);
    });

    it('should extend the column header selection to the left visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(1, true);
      hidingMap.setValueAtIndex(2, true);
      await render();

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║ * : * :   |
        |===:===:===:===|
        | - ║ 0 : A :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,0']);
    });

    it('should extend the column header selection to the left column header (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║   : * : # :   :   |
        |===:===:===:===:===:===|
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
        | - ║   : 0 : 0 :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: 4,1']);
    });

    it('should not extend the column header selection to the left column header when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectColumns(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║   :   : # :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: -1,2']);
    });

    it('should not extend the column header selection to the left column header when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectColumns(2, 2, -1);
      await listen();
      await keyDownUp(['shift', 'arrowleft']);

      expect(`
        |   ║   :   : # :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,2 from: -1,2 to: 4,2']);
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
      await keyDownUp(['shift', 'arrowleft']);

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
      await keyDownUp(['shift', 'arrowleft']);

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
      await keyDownUp(['shift', 'arrowleft']);

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
      await keyDownUp(['shift', 'arrowleft']);

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
      await keyDownUp(['shift', 'arrowleft']);

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
