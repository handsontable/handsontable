describe('Selection extending (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Ctrl/Cmd + Shift + ArrowLeft"', () => {
    it('should extend the cell selection to the left-most cell of the current row when the cell is selected', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cell selection to the left-most cell of the current row when fixed overlays are enabled and the cell is selected', async() => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   |   :   |
        | 0 : 0 : 0 | A :   |
        |---:---:---:---:---|
        |   :   :   |   :   |
        |---:---:---:---:---|
        |   :   :   |   :   |
        |   :   :   |   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,4']);
    });

    it('should extend the cells selection to the left-most cells of the current row', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 3, 1]]);
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        |   :   :   :   :   |
        | 0 : 0 : 0 : A :   |
        | 0 : 0 : 0 : 0 :   |
        | 0 : 0 : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 3,4']);
    });

    it('should extend the header selection to the left-most column header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectColumns(1);
      await listen();
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        | * : * : * : * :   ║   |
        |===:===:===:===:===:===|
        | 0 : 0 : 0 : A :   ║ - |
        | 0 : 0 : 0 : 0 :   ║ - |
        | 0 : 0 : 0 : 0 :   ║ - |
        | 0 : 0 : 0 : 0 :   ║ - |
        | 0 : 0 : 0 : 0 :   ║ - |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 4,4']);
    });

    it('should extend the column header selection to the left-most column header when there is no rows (navigableHeaders on)', async() => {
      handsontable({
        data: [],
        columns: [{}, {}, {}, {}, {}],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectColumns(1, 1, -1);
      await listen();
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        | * : * : * : # :   ║   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,4']);
    });

    it('should extend the column header selection to the left-most column header when all rows are hidden (navigableHeaders on)', async() => {
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
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        | * : * : * : # :   ║   |
        |===:===:===:===:===:===|
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 4,4']);
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
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        | - : - : - : - : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | 0 : 0 : 0 : 0 : A ║ * |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
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
      await keyDownUp(['control/meta', 'shift', 'arrowleft']);

      expect(`
        | * : * : * : * : * ║ * |
        |===:===:===:===:===:===|
        | 0 : 0 : 0 : 0 : A ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
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
      await keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   :   : # :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
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
      await keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   :   :   :   ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║ # |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
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
      await keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   :   :   :   ║ # |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
        |   :   :   :   :   ║   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: -1,-1']);
    });
  });
});
