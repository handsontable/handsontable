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

  describe('"Ctrl/Cmd + Shift + ArrowDown"', () => {
    it('should extend the cell selection to the last cell of the current column', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   :   :   :   |
        |   :   :   : A :   |
        |   :   :   : 0 :   |
        |   :   :   : 0 :   |
        |   :   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,1']);
    });

    it('should extend the cell selection to the last cell of the current column when fixed overlays are enabled', async() => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      await selectCell(1, 1);
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   :   |   :   |
        |   :   :   | A :   |
        |---:---:---:---:---|
        |   :   :   | 0 :   |
        |---:---:---:---:---|
        |   :   :   | 0 :   |
        |   :   :   | 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,1']);
    });

    it('should extend the cells selection to the last cells of the current column', async() => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      await selectCells([[1, 1, 1, 3]]);
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   :   :   :   |
        |   : 0 : 0 : A :   |
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 4,3']);
    });

    it('should extend the header selection to the top-most row header', async() => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      await selectRows(1);
      await listen();
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        | - : - : - : - : - ║   |
        |===:===:===:===:===:===|
        |   :   :   :   :   ║   |
        | 0 : 0 : 0 : 0 : A ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
        | 0 : 0 : 0 : 0 : 0 ║ * |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 4,4']);
    });

    it('should extend the row header selection to the bottom-most row header when there is no columns (navigableHeaders on)', async() => {
      handsontable({
        data: [[], [], [], [], []],
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectRows(1, 1, -1);
      await listen();
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   |
        |===|
        |   |
        | # |
        | * |
        | * |
        | * |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 4,-1']);
    });

    it('should extend the row header selection to the bottom-most row header when all columns are hidden (navigableHeaders on)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);
      await render();

      await selectRows(1, 1, -1);
      await listen();
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   |
        |===|
        |   |
        | # |
        | * |
        | * |
        | * |
      `).toBeMatchToSelectionPattern();
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 4,4']);
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
      await keyDownUp(['control/meta', 'shift', 'arrowdown']);

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
  });
});
