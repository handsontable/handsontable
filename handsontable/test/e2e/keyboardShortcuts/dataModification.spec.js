describe('Core data modification keyboard shortcuts', () => {
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

  describe('"Ctrl/Cmd + Enter"', () => {
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
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
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
      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,0 from: 1,0 to: 3,0',
        'highlight: 2,2 from: 2,2 to: 2,2',
      ]);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('should not populate the cell value when the focus highlight points to the column header', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectColumns(1, 2, -1);
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual(createSpreadsheetData(5, 5));
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 4,2']);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('should not populate the cell value when the focus highlight points to the row header', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectRows(1, 2, -1);
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual(createSpreadsheetData(5, 5));
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,-1 from: 1,-1 to: 2,4']);
      expect(afterChange).not.toHaveBeenCalled();
    });

    it('should not populate the cell value when the focus highlight points to the corner', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
        afterChange,
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectAll(true, true, { row: -1, col: -1 });
      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(getData()).toEqual(createSpreadsheetData(5, 5));
      expect(getSelectedRange()).toEqualCellRange(['highlight: -1,-1 from: -1,-1 to: 4,4']);
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

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,1 from: 1,1 to: 2,2',
        'highlight: 1,2 from: 1,2 to: 2,2',
        'highlight: 2,1 from: 2,1 to: 2,2',
      ]);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 2,1 from: 2,1 to: 2,2']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 2,1']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 3,3 from: 3,3 to: 1,1']);
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

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 3,4 from: 3,4 to: 3,4',
        'highlight: 4,3 from: 4,3 to: 1,3',
        'highlight: 3,2 from: 3,2 to: 3,2',
        'highlight: 1,1 from: 1,1 to: 1,2',
        'highlight: 0,0 from: 0,0 to: 1,0',
      ]);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: -1,-1 to: 2,2']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,1']);
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

      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,0 from: 1,-1 to: 1,2']);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [1, 1, 'B2', 'A2'],
        [1, 2, 'C2', 'A2'],
      ], 'edit');
    });

    it('should populate the cell value omitting cells that are marked as read-only', () => {
      const afterChange = jasmine.createSpy('afterChange');

      handsontable({
        data: createSpreadsheetData(8, 8),
        rowHeaders: true,
        colHeaders: true,
        afterChange,
        columns: [
          {},
          { readOnly: true },
          {},
          { readOnly: true },
          {},
          {},
          {},
          {},
        ],
        cell: [{ row: 1, col: 0, readOnly: true }],
      });

      afterChange.calls.reset(); // reset initial "afterChange" call after load data
      selectCells([[1, 0, 4, 1], [4, 5, 4, 0]]);
      keyDownUp(['control/meta', 'enter']);

      expect(getSelectedRange()).toEqualCellRange([
        'highlight: 1,0 from: 1,0 to: 4,1',
        'highlight: 4,5 from: 4,5 to: 4,0',
      ]);
      expect(afterChange).toHaveBeenCalledTimes(1);
      expect(afterChange).toHaveBeenCalledWith([
        [2, 0, 'A3', 'F5'],
        [3, 0, 'A4', 'F5'],
        [4, 0, 'A5', 'F5'],
        [4, 2, 'C5', 'F5'],
        [4, 4, 'E5', 'F5'],
      ], 'edit');
    });

    it('should not throw an error when there is no selection', () => {
      const spy = jasmine.createSpyObj('error', ['test']);
      const prevError = window.onerror;

      window.onerror = function() {
        spy.test();

        return true;
      };

      handsontable({
        rowHeaders: true,
        colHeaders: true,
        startRows: 5,
        startCols: 5
      });

      listen();
      keyDownUp(['control/meta', 'enter']);

      expect(spy.test).not.toHaveBeenCalled();

      window.onerror = prevError;
    });
  });

  using('key', ['Delete', 'Backspace'], (pressedKey) => {
    it('should make selected cell empty', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      selectCell(1, 1);
      keyDownUp([pressedKey]);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', null, 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should make selected cells empty', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      selectCells([[1, 1, 2, 2]]);
      keyDownUp([pressedKey]);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', null, null, 'D2', 'E2'],
        ['A3', null, null, 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });

    it('should make non-contiguous selection empty', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      selectCells([[0, 0, 0, 0], [1, 1, 2, 2], [4, 2, 4, 4]]);
      keyDownUp([pressedKey]);

      expect(getData()).toEqual([
        [null, 'B1', 'C1', 'D1', 'E1'],
        ['A2', null, null, 'D2', 'E2'],
        ['A3', null, null, 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', null, null, null],
      ]);
    });

    it('should not make selected cells empty when header is focused', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      keyDownUp([pressedKey]);

      expect(getData()).toEqual([
        ['A1', 'B1', 'C1', 'D1', 'E1'],
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3'],
        ['A4', 'B4', 'C4', 'D4', 'E4'],
        ['A5', 'B5', 'C5', 'D5', 'E5'],
      ]);
    });
  });
});
