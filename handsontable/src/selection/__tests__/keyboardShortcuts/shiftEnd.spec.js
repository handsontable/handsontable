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

  describe('"Shift + End"', () => {
    it('should extend the cell selection to the right-most cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cell selection to the right-most cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        |   :   : 0 : 0 : 0 |
        |   :   : A : 0 : 0 |
        |   :   : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,4']);
    });

    it('should extend the cell selection to the right-most cell of the current row when fixed overlays are enabled and the cell is selected', async() => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   |   :   :   |
        |   : A | 0 : 0 : 0 |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cells selection to the right-most cells of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 3, 3]]);
      await keyDownUp(['shift', 'end']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
    });

    it('should extend the column header selection to the right-most column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(2);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   :   : * : * : * |
        |===:===:===:===:===:===|
        | - ║   :   : A : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 4,4']);
    });

    it('should extend the row header selection to the right-most row header starting from the focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectColumns(2);
      await listen();
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   :   : * : * : * |
        |===:===:===:===:===:===|
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : A : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
        | - ║   :   : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: -1,2 to: 4,4']);
    });

    it('should extend the column header selection to the right-most visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(3, true);
      hidingMap.setValueAtIndex(4, true);
      await render();

      await selectColumns(1);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   : * : * |
        |===:===:===:===|
        | - ║   : A : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
        | - ║   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,2']);
    });

    it('should not extend the column header selection to the right-most column header (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(3, 3, -1);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   :   :   : # :   |
        |===:===:===:===:===:===|
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 4,3']);
    });

    it('should not extend the column header selection to the right-most column header when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   :   :   : # :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);
    });

    it('should not extend the column header selection to the right-most column header when all rows are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectColumns(3, 3, -1);
      await listen();
      await keyDownUp(['shift', 'end']);

      expect(`
        |   ║   :   :   : # :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: 4,3']);
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
      await keyDownUp(['shift', 'end']);

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
      await keyDownUp(['shift', 'end']);

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

    it('should not change the selection when the column header is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      await listen();
      await keyDownUp(['shift', 'end']);

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

    it('should not change the selection when the row header is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      await listen();
      await keyDownUp(['shift', 'end']);

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

    it('should not change the selection when the corner is selected', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      await listen();
      await keyDownUp(['shift', 'end']);

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
