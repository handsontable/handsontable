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
});
