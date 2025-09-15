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

  describe('"Ctrl + Space"', () => {
    it('should select the column from single cell selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 3);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║   :   :   : * :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : A :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,3 to: 4,3']);
    });

    it('should select the column from selection without changing the focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCell(2, 2, 3, 3);
      await keyDownUp('tab'); // Move focus to the next cell
      await keyDownUp('tab'); // Move focus to the next cell
      await keyDownUp('tab'); // Move focus to the next cell
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : A :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: -1,2 to: 4,3']);
    });

    it('should select the columns from multiple cells selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCells([[3, 3, 1, 0]]);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║ * : * : * : * :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : A :   |
        | - ║ 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: -1,3 to: 4,0']);
    });

    it('should select the columns from multiple cells selection when the focus is on the non-last layer', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 0, 1, 1], [2, 3, 3, 4]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║ * : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : A :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
        | - ║ 0 : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: -1,0 to: 4,1']);
    });

    it('should select the columns only from the last selection layer of the non-contiguous cells selection', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : A : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 4,3']);
    });

    it('should select all headers and cells when at least one row is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectRows(1);
      await listen();
      await keyDownUp(['control', 'space']);

      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,-1 to: 4,4']);
    });

    it('should not change the selection when column is already selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(1);
      await listen();
      await keyDownUp(['control', 'space']);

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

    it('should select the column from single cell selection (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(2, 3);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║   :   :   : * :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : A :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: -1,3 to: 4,3']);
    });

    it('should select the columns from multiple cells selection (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCells([[3, 3, 1, 0]]);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║ * : * : * : * :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : A :   |
        | - ║ 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: -1,3 to: 4,0']);
    });

    it('should select the columns only from the last selection layer of the non-contiguous cells selection (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      await keyDownUp(['control', 'space']);

      expect(`
        |   ║   :   : * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : A : 0 :   |
        | - ║   :   : 0 : 0 :   |
        | - ║   :   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: -1,2 to: 4,3']);
    });

    it('should select all headers and cells when at least one row is selected (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectRows(1);
      await listen();
      await keyDownUp(['control', 'space']);

      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: -1,-1 to: 4,4']);
    });
  });
});
