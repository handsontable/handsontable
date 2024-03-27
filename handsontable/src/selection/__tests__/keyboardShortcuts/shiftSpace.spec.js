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

  describe('"Shift + Space"', () => {
    it('should select the row from single cell selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 2);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : A : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,-1 to: 3,4']);
    });

    it('should select the row from selection without changing the focus position', () => {
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
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : A : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 2,-1 to: 3,4']);
    });

    it('should select the rows from multiple cells selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCells([[3, 3, 0, 1]]);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : A : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,-1 to: 0,4']);
    });

    it('should select the rows only from the last selection layer of the non-contiguous cells selection', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : A : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,-1 to: 3,4']);
    });

    it('should select all headers and cells when at least one column is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['shift', 'space']);

      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ 0 : A : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,-1 to: 4,4']);
    });

    it('should not change the selection when a row is already selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(1);
      listen();
      keyDownUp(['shift', 'space']);

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

    it('should select the row from single cell selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(3, 2);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : A : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,-1 to: 3,4']);
    });

    it('should select the rows from multiple cells selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCells([[3, 3, 0, 1]]);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : A : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,-1 to: 0,4']);
    });

    it('should select the rows only from the last selection layer of the non-contiguous cells selection (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCells([[1, 1, 1, 1], [2, 2, 3, 3]]);
      keyDownUp(['shift', 'space']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        | * ║ 0 : 0 : A : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 2,-1 to: 3,4']);
    });

    it('should select all headers and cells when at least one column is selected (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectColumns(1);
      listen();
      keyDownUp(['shift', 'space']);

      expect(`
        | * ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ 0 : A : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,-1 to: 4,4']);
    });
  });
});
