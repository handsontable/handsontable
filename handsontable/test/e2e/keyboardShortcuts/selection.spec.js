describe('Core selection keyboard shortcut', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"ArrowRight + Shift + Ctrl/Cmd"', () => {
    it('should extend the cell selection to the right-most cell of the current row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   :   :   :   :   |
        |   :   :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 1, 4]]);
    });

    it('should extend the cell selection to the right-most cell of the current row when fixed overlays are enabled', () => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   |   :   :   |
        |   : A | 0 : 0 : 0 |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |---:---:---:---:---|
        |   :   |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 1, 4]]);
    });

    it('should extend the cells selection to the right-most cells of the current row', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 1, 3, 1]]);
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 |
        |   : 0 : 0 : 0 : 0 |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 3, 4]]);
    });

    it('should extend the header selection to the right-most column header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
      |   ║   : * : * : * : * |
      |===:===:===:===:===:===|
      | - ║   : A : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
      | - ║   : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, 1, 4, 4]]);
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
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, -1, 1, 4]]);
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
      keyDownUp(['control/meta', 'shift', 'arrowright']);

      expect(`
        |   ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });
  });

  describe('"ArrowLeft + Shift + Ctrl/Cmd"', () => {
    it('should extend the cell selection to the left-most cell of the current row', () => {
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
      expect(getSelected()).toEqual([[1, 3, 1, 0]]);
    });

    it('should extend the cell selection to the left-most cell of the current row when fixed overlays are enabled', () => {
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
      expect(getSelected()).toEqual([[1, 3, 1, 0]]);
    });

    it('should extend the cells selection to the left-most cells of the current row', () => {
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
      expect(getSelected()).toEqual([[1, 3, 3, 0]]);
    });

    it('should extend the header selection to the left-most column header', () => {
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
      expect(getSelected()).toEqual([[-1, 3, 4, 0]]);
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
      expect(getSelected()).toEqual([[1, -1, 1, 4]]);
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
      |   ║ * : * : * : * : * |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });
  });

  describe('"ArrowUp + Shift + Ctrl/Cmd"', () => {
    it('should extend the cell selection to the first cell of the current column', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 1);
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
        |   : 0 :   :   :   |
        |   : 0 :   :   :   |
        |   : 0 :   :   :   |
        |   : A :   :   :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[3, 1, 0, 1]]);
    });

    it('should extend the cell selection to the first cell of the current column when fixed overlays are enabled', () => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      selectCell(3, 1);
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
        |   : 0 |   :   :   |
        |   : 0 |   :   :   |
        |---:---:---:---:---|
        |   : 0 |   :   :   |
        |---:---:---:---:---|
        |   : A |   :   :   |
        |   :   |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[3, 1, 0, 1]]);
    });

    it('should extend the cells selection to the first cells of the current column', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[3, 1, 3, 3]]);
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
        |   : A : 0 : 0 :   |
        |   :   :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[3, 1, 0, 3]]);
    });

    it('should extend the header selection to the top-most row header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(3);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ A : 0 : 0 : 0 : 0 |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[3, -1, 0, 4]]);
    });

    it('should not change the selection when column header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
        |   ║   : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : A :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, 1, 4, 1]]);
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
      keyDownUp(['control/meta', 'shift', 'arrowup']);

      expect(`
      |   ║ * : * : * : * : * |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });
  });

  describe('"ArrowDown + Shift + Ctrl/Cmd"', () => {
    it('should extend the cell selection to the last cell of the current column', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   :   :   :   |
        |   : A :   :   :   |
        |   : 0 :   :   :   |
        |   : 0 :   :   :   |
        |   : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 4, 1]]);
    });

    it('should extend the cell selection to the last cell of the current column when fixed overlays are enabled', () => {
      handsontable({
        fixedColumnsStart: 2,
        fixedRowsTop: 2,
        fixedRowsBottom: 2,
        startRows: 5,
        startCols: 5
      });

      selectCell(1, 1);
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   |   :   :   |
        |   : A |   :   :   |
        |---:---:---:---:---|
        |   : 0 |   :   :   |
        |---:---:---:---:---|
        |   : 0 |   :   :   |
        |   : 0 |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 4, 1]]);
    });

    it('should extend the cells selection to the last cells of the current column', () => {
      handsontable({
        startRows: 5,
        startCols: 5
      });

      selectCells([[1, 1, 1, 3]]);
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   :   :   :   :   |
        |   : A : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
        |   : 0 : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 4, 3]]);
    });

    it('should extend the header selection to the top-most row header', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectRows(1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, -1, 4, 4]]);
    });

    it('should not change the selection when column header is selected', () => {
      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      selectColumns(1);
      listen();
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
        |   ║   : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : A :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, 1, 4, 1]]);
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
      keyDownUp(['control/meta', 'shift', 'arrowdown']);

      expect(`
      |   ║ * : * : * : * : * |
      |===:===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[-1, -1, 4, 4]]);
    });
  });

  describe('"PageUp + Shift"', () => {
    it('should extend the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(13, 1);
      keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[13, 1, 9, 1]]);

      keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[13, 1, 5, 1]]);

      keyDownUp(['shift', 'pageup']);

      expect(`
        |   :   :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[13, 1, 1, 1]]);

      keyDownUp(['shift', 'pageup']);

      expect(`
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : A :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[13, 1, 0, 1]]);
    });

    it('should scroll the viewport repeatedly by the same number of pixels with keeping the initial ' +
       'selection viewport offset', async() => {
      const hot = handsontable({
        width: 180,
        height: 200,
        startRows: 100,
        startCols: 3
      });

      selectCell(95, 1);
      // scroll the viewport in that way the cell highlight is in the middle of the table viewport
      scrollViewportTo(99, 1);

      await sleep(20);

      keyDownUp(['shift', 'pageup']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 3);

      await sleep(20);

      keyDownUp(['shift', 'pageup']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 3);

      keyDownUp(['shift', 'pageup']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 3);
    });
  });

  describe('"PageDown + Shift"', () => {
    it('should extend the cell selection up by the height of the table viewport', () => {
      handsontable({
        width: 180,
        height: 100, // 100/23 (default cell height) rounding down is 4. So PageUp will extend the selection per 4 rows
        startRows: 15,
        startCols: 3
      });

      selectCell(1, 1);
      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 5, 1]]);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 9, 1]]);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   :   :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 13, 1]]);

      keyDownUp(['shift', 'pagedown']);

      expect(`
        |   :   :   |
        |   : A :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
        |   : 0 :   |
      `).toBeMatchToSelectionPattern();
      expect(getSelected()).toEqual([[1, 1, 14, 1]]);
    });

    it('should scroll the viewport repeatedly by the same number of pixels with keeping the initial ' +
       'selection viewport offset', async() => {
      const hot = handsontable({
        width: 180,
        height: 200,
        startRows: 100,
        startCols: 3
      });

      // select and scroll the viewport in that way the cell highlight is in the middle of the table viewport
      selectCell(4, 1);

      await sleep(20);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);

      await sleep(20);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);

      keyDownUp(['shift', 'pagedown']);

      await sleep(20);

      expect(getSelectedRangeLast().to.row).toBe(hot.view.getFirstFullyVisibleRow() + 4);
    });
  });

  describe('"Enter + Ctrl/Cmd"', () => {
    it('should not populate the cell value when the selection range includes less than 2 cells', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCell(1, 1);
      keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual(createSpreadsheetData(5, 5));
      expect(getSelected()).toEqual([[1, 1, 1, 1]]);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('should not populate the cell value when the last non-contiguous selection layer includes less than 2 cells', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[1, 0, 3, 0], [2, 2, 2, 2]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual(createSpreadsheetData(5, 5));
      expect(getSelected()).toEqual([[1, 0, 3, 0], [2, 2, 2, 2]]);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('should not trigger the cells value change more than once for the same coords in "{after/before}Change" hooks ' +
       'when selection layers overlap each self', () => {
      const beforeChange = jasmine.createSpy('beforeChange');
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeChange,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[1, 1, 2, 2], [1, 2, 2, 2], [2, 1, 2, 2]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[1, 1, 2, 2], [1, 2, 2, 2], [2, 1, 2, 2]]);
      expect(beforeChange).toHaveBeenCalledTimes(1);
      expect(beforeChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'B3'],
        [1, 2, 'C2', 'B3'],
        [2, 2, 'C3', 'B3'],
      ], 'edit');
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'B3'],
        [1, 2, 'C2', 'B3'],
        [2, 2, 'C3', 'B3'],
      ], 'edit');
    });

    it('should populate the cell value when the selection range includes at least 2 cells in a row', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[2, 1, 2, 2]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[2, 1, 2, 2]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [2, 2, 'C3', 'B3'],
      ], 'edit');
    });

    it('should populate the cell value when the selection range includes at least 2 cells in a column', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[1, 1, 2, 1]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[1, 1, 2, 1]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [2, 1, 'B3', 'B2'],
      ], 'edit');
    });

    it('should populate the cell value when the selection range goes from bottom-right to top-left direction', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[3, 3, 1, 1]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[3, 3, 1, 1]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'D4'],
        [1, 2, 'C2', 'D4'],
        [1, 3, 'D2', 'D4'],
        [2, 1, 'B3', 'D4'],
        [2, 2, 'C3', 'D4'],
        [2, 3, 'D3', 'D4'],
        [3, 1, 'B4', 'D4'],
        [3, 2, 'C4', 'D4'],
      ], 'edit');
    });

    it('should populate the cell value to all selection layers', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[3, 4, 3, 4], [4, 3, 1, 3], [3, 2, 3, 2], [1, 1, 1, 2], [0, 0, 1, 0]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[3, 4, 3, 4], [4, 3, 1, 3], [3, 2, 3, 2], [1, 1, 1, 2], [0, 0, 1, 0]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [3, 4, 'E4', 'A1'],
        [1, 3, 'D2', 'A1'],
        [2, 3, 'D3', 'A1'],
        [3, 3, 'D4', 'A1'],
        [4, 3, 'D5', 'A1'],
        [3, 2, 'C4', 'A1'],
        [1, 1, 'B2', 'A1'],
        [1, 2, 'C2', 'A1'],
        [1, 0, 'A2', 'A1'],
      ], 'edit');
    });

    it('should populate the cell value to all cells when the selection is done by the corner click', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectAll();
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[-1, -1, 2, 2]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [0, 1, 'B1', 'A1'],
        [0, 2, 'C1', 'A1'],
        [1, 0, 'A2', 'A1'],
        [1, 1, 'B2', 'A1'],
        [1, 2, 'C2', 'A1'],
        [2, 0, 'A3', 'A1'],
        [2, 1, 'B3', 'A1'],
        [2, 2, 'C3', 'A1'],
      ], 'edit');
    });

    it('should populate the cell value to all cells within selected column header', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectColumns(1);
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[-1, 1, 2, 1]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'B1'],
        [2, 1, 'B3', 'B1'],
      ], 'edit');
    });

    it('should populate the cell value to all cells within selected row header', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
        colHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectRows(1);
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getSelected()).toEqual([[1, -1, 1, 2]]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'A2'],
        [1, 2, 'C2', 'A2'],
      ], 'edit');
    });
  });
});
