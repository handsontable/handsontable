describe('Core.selectCell', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should mark single cell visually (default selectionMode, without headers)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: false,
      rowHeaders: false,
    });

    selectCell(2, 2);

    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   : # :   |
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single cell visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(2, 2);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | - ║   :   : # :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the cells visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(1, 2, 2, 3);

    expect(`
      |   ║   :   : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   :   : A : 0 |
      | - ║   :   : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single cell visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(2, 2);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | - ║   :   : # :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not mark the range of the cells visually when selectionMode is set as `single`', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(1, 2, 2, 3);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   :   : # :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single cell visually when selectionMode is set as `range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'range',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(2, 2);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | - ║   :   : # :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark the range of the cells visually when selectionMode is set as `range`', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'range',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(1, 2, 2, 3);

    expect(`
      |   ║   :   : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║   :   : A : 0 |
      | - ║   :   : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark the headers when whole column and row is selected', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectCell(0, 2, 5, 3);

    expect(`
      |   ║   :   : - : - |
      |===:===:===:===:===|
      | - ║   :   : A : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();

    selectCell(1, 0, 2, 3);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║ A : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not deselect current selection when sellectCell is called without arguments', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectCell(0, 0, 2, 2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);

    selectCell();

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);

    selectCell(1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
  });

  it('should not deselect current selection when sellectCell is called with one argument', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCell(1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when sellectCell is called with negative values', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCell(0, -1, 0, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(-1, 0, 0, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 0, -1, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 0, 0, -1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when sellectCell is called with coordinates beyond the table data range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(3, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCell(3, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 0, 3, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 0, 0, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when sellectCell is called with undefined column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCell(0, 'notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCell(0, 0, 0, 'notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should select only one cell when two arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 1);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select only one cell when two arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 'prop1');

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when at least the three arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(0, 0, 1);

    expect(getSelected()).toEqual([[0, 0, 1, 0]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when at least the three arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(0, 'prop0', 1);

    expect(getSelected()).toEqual([[0, 0, 1, 0]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the four arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 1, 2, 3);

    expect(getSelected()).toEqual([[1, 1, 2, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the four arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 'prop1', 2, 'prop3');

    expect(getSelected()).toEqual([[1, 1, 2, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-bottom to left-top)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(2, 3, 1, 1);

    expect(getSelected()).toEqual([[2, 3, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-bottom to left-top using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(2, 'prop3', 1, 'prop1');

    expect(getSelected()).toEqual([[2, 3, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from left-bottom to right-top)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(2, 1, 1, 3);

    expect(getSelected()).toEqual([[2, 1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from left-bottom to right-top using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(2, 'prop1', 1, 'prop3');

    expect(getSelected()).toEqual([[2, 1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-top to left-bottom)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 3, 2, 1);

    expect(getSelected()).toEqual([[1, 3, 2, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-top to left-bottom using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCell(1, 'prop3', 2, 'prop1');

    expect(getSelected()).toEqual([[1, 3, 2, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should by default scroll the viewport to the selected cell (bottom of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(15, 0);

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (bottom of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(15, 'prop0');

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (right of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (right of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 'prop15');

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (left of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCell(5, 0);

    expect(getCell(5, 0)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (left of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCell(5, 'prop0');

    expect(getCell(5, 0)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (top of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCell(1, 0);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (top of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCell(1, 'prop0');

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should not the scroll the viewport when `false` argument is passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(15, 0, 15, 0, false);

    expect(getCell(15, 0)).not.toBeVisibleInViewport();
  });

  it('should by default change the listener to handsontable instance from the action was triggered', () => {
    const afterListen = jasmine.createSpy();

    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterListen,
    });

    selectCell(15, 0);

    expect(afterListen).toHaveBeenCalled();
  });

  it('should not change the listening state when `false` argument is passed', () => {
    const afterListen = jasmine.createSpy();

    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterListen,
    });

    selectCell(15, 0, 15, 0, true, false);

    expect(afterListen).not.toHaveBeenCalled();
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

    selectCell(1, 2);

    expect(afterSelection.calls.first().object).toBe(hot);
    expect(afterSelectionByProp.calls.first().object).toBe(hot);
    expect(afterSelectionEnd.calls.first().object).toBe(hot);
    expect(afterSelectionEndByProp.calls.first().object).toBe(hot);
    expect(beforeSetRangeStartOnly.calls.first().object).toBe(hot);
  });

  it('should fire hooks with proper arguments when a single cell is selected', () => {
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

    selectCell(1, 2);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 1, 2, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 1, 2, 0, void 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', 0, void 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
  });

  it('should fire hooks with proper arguments when range of the cells are selected', () => {
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

    selectCell(1, 2, 2, 4);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 2, 4, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 2, 4, 0, void 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', 0, void 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
  });
});
