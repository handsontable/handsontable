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

  describe('"Ctrl/Cmd + Shift + ArrowLeft"', () => {
    it('should extend the cell selection to the left-most cell of the current row when the cell is selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
    });

    it('should extend the cell selection to the left-most cell of the current row starting from the focus position', () => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      selectCell(1, 2, 3, 4);
      keyDownUp('enter'); // Move focus down
      keyDownUp('tab'); // Move focus right
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : A :   |
        | 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,3 from: 1,3 to: 3,0']);
    });

    it('should extend the cell selection to the left-most cell of the current row when fixed overlays are enabled and the cell is selected', () => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 3);
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   |   :   :   |
        | 0 : 0 | 0 : A :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
    });

    it('should extend the cells selection to the left-most cells of the current row when the range of the cells are selected', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 3, 3, 3]]);
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);
    });

    it('should extend the column header selection to the left-most column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(3);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : * :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : A :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,0']);
    });

    it('should extend the row header selection to the left-most row header starting from the focus position', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      selectColumns(3);
      listen();
      keyDownUp('enter'); // Move focus down
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : * :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : A :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -1,3 to: 4,0']);
    });

    it('should extend the column header selection to the left-most visible column', () => {
      const hot = handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = hot.columnIndexMapper.createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      hot.render();

      selectColumns(3);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * :   |
        |===:===:===:===|
        | - ║ 0 : A :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
        | - ║ 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,2']);
    });

    it('should extend the column header selection to the left-most column header (navigableHeaders on)', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(3, 3, -1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : # :   |
        |===:===:===:===:===:===|
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
        | - ║ 0 : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 4,0']);
    });

    it('should extend the column header selection to the left-most column header when there is no rows (navigableHeaders on)', () => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectColumns(3);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : # :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,0']);
    });

    it('should extend the column header selection to the left-most column header when all rows are hidden (navigableHeaders on)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      render();

      selectColumns(3, 3, -1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ * : * : * : # :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 4,0']);
    });

    it('should extend the selection done by Cmd+Shift+ArrowUp to the left', () => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowup']);
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ - : - :   |
        |===:===:===:===|
        | - ║ 0 : 0 :   |
        | - ║ 0 : A :   |
        |   ║   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 0,0']);
    });

    it('should extend the selection done by Cmd+Shift+ArrowDown to the left', () => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowdown']);
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   ║ - : - :   |
        |===:===:===:===|
        |   ║   :   :   |
        | - ║ 0 : A :   |
        | - ║ 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,0']);
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
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

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
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

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

    it('should not change the selection when the column header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

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

    it('should not change the selection when the row header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

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

    it('should not change the selection when the corner is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowleft']);

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
