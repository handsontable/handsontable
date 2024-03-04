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
    it('should extend the cell selection to the right cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,2']);
    });

    it('should extend the cells selection to the right cells of the current row when the range of the cells are selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 1, 3, 1]]);
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,2']);
    });

    it('should extend the cells selection to the right when focus is moved within a range', () => {
      handsontable({
        startRows: 5,
        startCols: 6
      });

      selectCells([[1, 4, 3, 1]]);
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   : 0 : 0 : 0 :   |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,4 to: 3,2']);

      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   :   :   :   :   :   |
        |   :   : A : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 1,2 to: 3,5']);
    });

    it('should extend the column header selection to the right column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['shift', 'arrowright']);

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

    it('should extend the column header selection to the right column header when focus is moved within a range', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 6
      });

      selectColumns(4, 1);
      listen();
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'tab']); // move cell focus left
      keyDownUp(['shift', 'arrowright']);

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

      keyDownUp(['shift', 'arrowright']);

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

      keyDownUp(['shift', 'arrowright']);

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,5']);
    });

    it('should extend the column header selection to the right visible column', () => {
      const hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(2, true);
      hidingMap.setValueAtIndex(3, true);
      hot.render();

      selectColumns(1);
      listen();
      keyDownUp(['shift', 'arrowright']);

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

    it('should extend the column header selection to the right column header (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1, 1, -1);
      listen();
      keyDownUp(['shift', 'arrowright']);

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

    it('should not extend the column header selection to the right column header when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectColumns(1, 1, -1);
      listen();
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : # :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    });

    it('should not extend the column header selection to the right column header when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectColumns(1, 1, -1);
      listen();
      keyDownUp(['shift', 'arrowright']);

      expect(`
        |   ║   : # :   :   :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 4,1']);
    });

    it('should not change the selection when row header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(1);
      listen();
      keyDownUp(['shift', 'arrowright']);

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

    it('should not change the selection when all cells are selected (triggered by corner click)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectAll();
      listen();
      keyDownUp(['shift', 'arrowright']);

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
      keyDownUp(['shift', 'arrowright']);

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
      keyDownUp(['shift', 'arrowright']);

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
      keyDownUp(['shift', 'arrowright']);

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
