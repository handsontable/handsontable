describe('Core.selectRows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should mark single row visually (default selectionMode, without headers)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectRows(2);

    expect(`
      |   :   :   :   |
      |   :   :   :   |
      | A : 0 : 0 : 0 |
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single row visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectRows(2);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark non-contiquous selection when CTRL key is pressed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectRows(2);
    keyDown('ctrl');
    selectRows(0);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      | * ║ 0 : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the rows visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectRows(2, 3);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | * ║ A : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the rows visually (default selectionMode, reversed selection)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectRows(3, 2);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | * ║ 0 : 0 : 0 : 0 |
      | * ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark only single cell visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
      selectionMode: 'single',
    });

    selectRows(2);

    expect(`
      |   ║ - :   :   :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | - ║ # :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark the range of the rows visually when selectionMode is set as `range`', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
      selectionMode: 'range',
    });

    selectRows(1, 2);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | * ║ A : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not deselect current selection when selectRows is called without arguments', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectCell(1, 1); // Initial selection.

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);

    selectRows();

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should not deselect current selection when selectRows is called with negative values', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectRows(0, -1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(-1, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(-3, -1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(-2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when selectRows is called with coordinates beyond the table data range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(3, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectRows(3, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(0, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows(200);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when selectRows is called with undefined column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectRows(0, 'notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectRows('notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should select only one row when two the same arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectRows(1, 1);

    expect(getSelected()).toEqual([[1, -1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of rows when the coordinates are passed in reversed order (from right to left)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectRows(2, 1);

    expect(getSelected()).toEqual([[2, -1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should not the scroll the viewport when row is selected', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(1, 15); // Scroll to the bottom of the Hot viewport.

    const scrollTop = hot.view.wt.wtTable.holder.scrollTop;

    selectRows(1);

    expect(hot.view.wt.wtTable.holder.scrollTop).toBe(scrollTop);
  });

  it('should fire hooks with proper context', () => {
    const {
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    } = jasmine.createSpyObj('hooks', [
      'afterSelection',
      'afterSelectionByProp',
      'afterSelectionEnd',
      'afterSelectionEndByProp',
      'beforeSetRangeStart',
      'beforeSetRangeStartOnly',
      'beforeSetRangeEnd',
    ]);

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    });

    selectRows(1, 2);

    expect(afterSelection.calls.first().object).toBe(hot);
    expect(afterSelectionByProp.calls.first().object).toBe(hot);
    expect(afterSelectionEnd.calls.first().object).toBe(hot);
    expect(afterSelectionEndByProp.calls.first().object).toBe(hot);
    expect(beforeSetRangeStartOnly.calls.first().object).toBe(hot);
  });

  it('should fire hooks with proper arguments when a single row is selected', () => {
    const {
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    } = jasmine.createSpyObj('hooks', [
      'afterSelection',
      'afterSelectionByProp',
      'afterSelectionEnd',
      'afterSelectionEndByProp',
      'beforeSetRangeStart',
      'beforeSetRangeStartOnly',
      'beforeSetRangeEnd',
    ]);

    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    });

    selectRows(1);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, -1, 1, 19, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, -1, 1, 'prop19', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, -1, 1, 19, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, -1, 1, 'prop19', 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(-1);
  });

  it('should fire hooks with proper arguments when range of the columns are selected', () => {
    const {
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    } = jasmine.createSpyObj('hooks', [
      'afterSelection',
      'afterSelectionByProp',
      'afterSelectionEnd',
      'afterSelectionEndByProp',
      'beforeSetRangeStart',
      'beforeSetRangeStartOnly',
      'beforeSetRangeEnd',
    ]);

    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterSelection,
      afterSelectionByProp,
      afterSelectionEnd,
      afterSelectionEndByProp,
      beforeSetRangeStart,
      beforeSetRangeStartOnly,
      beforeSetRangeEnd,
    });

    selectRows(1, 2);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, -1, 2, 19, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, -1, 2, 'prop19', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, -1, 2, 19, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, -1, 2, 'prop19', 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(-1);
  });
});
