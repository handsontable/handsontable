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
    it('should select the column from single cell selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 3);
      keyDownUp(['control', 'space']);

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

    it('should select the column from selection without changing the focus position', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCell(2, 2, 3, 3);
      keyDownUp('tab'); // Move focus to the next cell
      keyDownUp('tab'); // Move focus to the next cell
      keyDownUp('tab'); // Move focus to the next cell
      keyDownUp(['control', 'space']);

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

    it('should select the columns from multiple cells selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCells([[3, 3, 1, 0]]);
      keyDownUp(['control', 'space']);

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

    it('should select the columns only from the last selection layer of the non-contiguous cells selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      keyDownUp(['control', 'space']);

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

    it('should select all headers and cells when at least one row is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(1);
      listen();
      keyDownUp(['control', 'space']);

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

    it('should not change the selection when column is already selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['control', 'space']);

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

    it('should select the column from single cell selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(2, 3);
      keyDownUp(['control', 'space']);

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

    it('should select the columns from multiple cells selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCells([[3, 3, 1, 0]]);
      keyDownUp(['control', 'space']);

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

    it('should select the columns only from the last selection layer of the non-contiguous cells selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      keyDownUp(['control', 'space']);

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

    it('should select all headers and cells when at least one row is selected (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectRows(1);
      listen();
      keyDownUp(['control', 'space']);

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
