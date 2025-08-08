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

  describe('"Shift + Home"', () => {
    it('should extend the cell selection to the left-most cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,0']);
    });

    it('should extend the cell selection to the left-most cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 :   :   |
        | 0 : 0 : A :   :   |
        | 0 : 0 : 0 :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,0']);
    });

    it('should extend the cell selection to the left-most cell starting from the active selection layer', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectCells([[2, 3, 3, 3], [0, 1, 1, 1]]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        |   :   :   :   :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 2,3 to: 3,0']);
    });

    it('should extend the cell selection to the left-most cell of the current row when fixed overlays are enabled and the cell is selected', async() => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   :   | 0 : A :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cells selection to the left-most cells of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 3, 3, 3]]);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,0']);
    });

    it('should extend the column header selection to the left-most column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

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

    it('should extend the row header selection to the left-most row header starting from the focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

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

    it('should extend the column header selection to the left-most visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(1, true);
      await render();

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

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

    it('should not extend the column header selection to the left-most column header (navigableHeaders on)', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(3, 3, -1);
      await listen();
      await keyDownUp(['shift', 'home']);

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

    it('should not extend the column header selection to the left-most column header when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

      expect(`
        |   ║   :   :   : # :   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,3 from: -1,3 to: -1,3']);
    });

    it('should not extend the column header selection to the left-most column header when all rows are hidden (navigableHeaders on)', async() => {
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
      await keyDownUp(['shift', 'home']);

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
      await keyDownUp(['shift', 'home']);

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
      await keyDownUp(['shift', 'home']);

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
      await keyDownUp(['shift', 'home']);

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
      await keyDownUp(['shift', 'home']);

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
      await keyDownUp(['shift', 'home']);

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

    it('should extend the cell selection to the left-most non-frozen cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   :   | 0 : A :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cell selection to the left-most non-frozen cell when left overlay is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 3,
      });

      await selectCell(1, 1);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   :   |   :   |
        |   : A : 0 | 0 :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
        |   :   :   |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,3']);
    });

    it('should extend the cell selection to the left-most non-frozen cell of the current row starting from the focus position', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
        fixedColumnsStart: 1,
      });

      await selectCell(1, 2, 3, 4);
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

      expect(`
        |   |   :   :   :   |
        |   | 0 : 0 :   :   |
        |   | 0 : A :   :   |
        |   | 0 : 0 :   :   |
        |   |   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,2 from: 1,2 to: 3,1']);
    });

    it('should extend the cell selection to the left-most non-frozen cell of the current row when fixed overlays are enabled and the cell is selected', async() => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 3);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   :   | 0 : A :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,2']);
    });

    it('should extend the cells selection to the left-most non-frozen cells of the current row when the range of the cells are selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      await selectCells([[1, 3, 3, 3]]);
      await keyDownUp(['shift', 'home']);

      expect(`
        |   :   |   :   :   |
        |   :   | 0 : A :   |
        |   :   | 0 : 0 :   |
        |   :   | 0 : 0 :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 3,2']);
    });

    it('should extend the column header selection to the left-most non-frozen column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

      expect(`
        |   ║   :   | * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   | 0 : A :   |
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,2']);
    });

    it('should extend the row header selection to the left-most non-frozen row header starting from the focus position', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        enterBeginsEditing: false,
        fixedColumnsStart: 2,
      });

      await selectColumns(3);
      await listen();
      await keyDownUp('enter'); // Move focus down
      await keyDownUp(['shift', 'home']);

      expect(`
        |   ║   :   | * : * :   |
        |===:===:===:===:===:===|
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : A :   |
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : 0 :   |
        | - ║   :   | 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: -1,3 to: 4,2']);
    });

    it('should extend the column header selection to the left-most non-frozen visible column', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5,
        fixedColumnsStart: 2,
      });

      const hidingMap = columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

      hidingMap.setValueAtIndex(0, true);
      hidingMap.setValueAtIndex(2, true);
      await render();

      await selectColumns(3);
      await listen();
      await keyDownUp(['shift', 'home']);

      expect(`
        |   ║   | * :   |
        |===:===:===:===|
        | - ║   | A :   |
        | - ║   | 0 :   |
        | - ║   | 0 :   |
        | - ║   | 0 :   |
        | - ║   | 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,3 from: -1,3 to: 4,3']);
    });
  });
});
