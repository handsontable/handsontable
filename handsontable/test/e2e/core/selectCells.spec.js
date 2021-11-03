describe('Core.selectCells', () => {
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

    selectCells([[2, 2]]);

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

    selectCells([[2, 2]]);

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

    selectCells([[1, 2, 2, 3]]);

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

  it('should mark non-contiguous cells visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([
      [0, 0],
      [5, 1, 2, 2],
      [4, 3, 1, 2],
      [3, 0, 3, 2],
      [4, 2],
      [4, 2]
    ]);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      | - ║ 0 :   :   :   |
      | - ║   :   : 0 : 0 |
      | - ║   : 0 : 1 : 0 |
      | - ║ 0 : 1 : 2 : 0 |
      | - ║   : 0 : D : 0 |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single cell visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[2, 2]]);

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

  it('should not mark range of the cells visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 2, 2, 3]]);

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

  it('should not mark non-contiguous cells visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'single',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([
      [0, 0],
      [5, 1, 2, 2],
      [4, 3, 1, 2],
      [3, 0, 3, 2],
      [4, 2],
      [4, 2]
    ]);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      | - ║   :   : # :   |
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

    selectCells([[2, 2]]);

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

  it('should mark range of the cells visually when selectionMode is set as `range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'range',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 2, 2, 3]]);

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

  it('should not mark non-contiguous cells visually when selectionMode is set as `range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      selectionMode: 'range',
    });

    selectCells([
      [0, 0],
      [5, 1, 2, 2],
      [4, 3, 1, 2],
      [3, 0, 3, 2],
      [4, 2],
      [4, 2]
    ]);

    expect(`
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
      |   :   :   :   |
      |   :   : # :   |
      |   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark the headers when whole column and row is selected', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[0, 1, 5, 1], [0, 3, 5, 3]]);

    expect(`
      |   ║   : - :   : - |
      |===:===:===:===:===|
      | - ║   : 0 :   : A |
      | - ║   : 0 :   : 0 |
      | - ║   : 0 :   : 0 |
      | - ║   : 0 :   : 0 |
      | - ║   : 0 :   : 0 |
      | - ║   : 0 :   : 0 |
      `).toBeMatchToSelectionPattern();

    selectCells([[1, 0, 1, 3], [3, 0, 3, 3]]);

    expect(`
      |   ║ - : - : - : - |
      |===:===:===:===:===|
      |   ║   :   :   :   |
      | - ║ 0 : 0 : 0 : 0 |
      |   ║   :   :   :   |
      | - ║ A : 0 : 0 : 0 |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not deselect current selection when sellectCells is called without arguments', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.
    selectCells();

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
  });

  it('should throw an exception when the coordinates are passed in invalid format', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

    expect(() => selectCells(1)).toThrow();
    expect(() => selectCells([1])).toThrow();
    expect(() => selectCells('prop0')).toThrow();
    expect(() => selectCells(['prop0'])).toThrow();

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
  });

  it('should not deselect current selection when sellectCells is called with one argument', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(true);

    /* eslint-disable no-empty */
    try {
      selectCells([[1]]);
    } catch (ex) {}

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
  });

  it('should not deselect current selection when sellectCells is called with negative values', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCells([[0, -1, 0, 0]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[-1, 0, 0, 0]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, -1, 0]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, 0, -1]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, 0, 0], [0, 0, 0, -1]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when sellectCells is called with coordinates beyond the table data range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(3, 4),
    });

    let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 2, 2]]); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCells([[3, 0]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 4]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, 3, 0]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, 0, 4]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0], [0, 0, 0, 4]]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when sellectCells is called with undefined column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectCells([[0, 'notExistProp']]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[0, 0, 0, 'notExistProp']]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectCells([[1, 1], [0, 0, 0, 'notExistProp']]);

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
    expect(wasSelected).toBe(false);
  });

  it('should select only one cell when two arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 1]]);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select only one cell when two arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 'prop1']]);

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when at least the three arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[0, 0, 1]]);

    expect(getSelected()).toEqual([[0, 0, 1, 0]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when at least the three arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[0, 'prop0', 1]]);

    expect(getSelected()).toEqual([[0, 0, 1, 0]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the four arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 1, 2, 3]]);

    expect(getSelected()).toEqual([[1, 1, 2, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the four arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 'prop1', 2, 'prop3']]);

    expect(getSelected()).toEqual([[1, 1, 2, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select multiple cells when the multiple ranges are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([
      [0, 0],
      [5, 1, 2, 2],
      [4, 3, 1, 2],
      [3, 0, 3, 2],
      [4, 2],
      [4, 2]
    ]);

    expect(getSelected()).toEqual([[0, 0, 0, 0], [5, 1, 2, 2], [4, 3, 1, 2], [3, 0, 3, 2], [4, 2, 4, 2], [4, 2, 4, 2]]);
    expect(wasSelected).toBe(true);
  });

  it('should select multiple cells when the multiple ranges are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([
      [0, 'prop0'],
      [5, 'prop1', 2, 'prop2'],
      [4, 'prop3', 1, 'prop2'],
      [3, 'prop0', 3, 'prop2'],
      [4, 'prop2'],
      [4, 'prop2']
    ]);

    expect(getSelected()).toEqual([[0, 0, 0, 0], [5, 1, 2, 2], [4, 3, 1, 2], [3, 0, 3, 2], [4, 2, 4, 2], [4, 2, 4, 2]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-bottom to left-top)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[2, 3, 1, 1]]);

    expect(getSelected()).toEqual([[2, 3, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-bottom to left-top using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[2, 'prop3', 1, 'prop1']]);

    expect(getSelected()).toEqual([[2, 3, 1, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from left-bottom to right-top)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[2, 1, 1, 3]]);

    expect(getSelected()).toEqual([[2, 1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from left-bottom to right-top using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[2, 'prop1', 1, 'prop3']]);

    expect(getSelected()).toEqual([[2, 1, 1, 3]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-top to left-bottom)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 3, 2, 1]]);

    expect(getSelected()).toEqual([[1, 3, 2, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of cells when the coordinates are passed in reversed order (from right-top to left-bottom using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectCells([[1, 'prop3', 2, 'prop1']]);

    expect(getSelected()).toEqual([[1, 3, 2, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should by default scroll the viewport to the selected cell (bottom of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[15, 0]]);

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (bottom of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[15, 'prop0']]);

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (right of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[5, 15]]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (right of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[5, 'prop15']]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (left of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCells([[5, 5]]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (left of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCells([[5, 'prop5']]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (top of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCells([[1, 0]]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (top of the viewport)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCells([[1, 'prop0']]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should not the scroll the viewport when `false` argument is passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[15, 0]], false);

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

    selectCells([[15, 0]]);

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

    selectCells([[15, 0]], true, false);

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

    selectCells([[1, 2, 2, 4], [2, 1, 3, 2], [7, 7], [8, 4, 0, 4], [2, 4]]);

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

    selectCells([[1, 2]]);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 1, 2, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 1, 2, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 1, 'prop2', 0]);

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

    selectCells([[1, 2, 2, 4]]);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 2, 4, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 2, 4, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
  });

  it('should fire hooks with proper arguments when the non-contiguous selection is added', () => {
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

    selectCells([[1, 2, 2, 4], [2, 1, 3, 2], [7, 7], [8, 4, 0, 4], [2, 4]]);

    expect(afterSelection.calls.count()).toBe(5);
    expect(afterSelection.calls.argsFor(0)).toEqual([1, 2, 2, 4, jasmine.any(Object), 0]);
    expect(afterSelection.calls.argsFor(1)).toEqual([2, 1, 3, 2, jasmine.any(Object), 1]);
    expect(afterSelection.calls.argsFor(2)).toEqual([7, 7, 7, 7, jasmine.any(Object), 2]);
    expect(afterSelection.calls.argsFor(3)).toEqual([8, 4, 0, 4, jasmine.any(Object), 3]);
    expect(afterSelection.calls.argsFor(4)).toEqual([2, 4, 2, 4, jasmine.any(Object), 4]);

    expect(afterSelectionByProp.calls.count()).toBe(5);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', jasmine.any(Object), 0]);
    expect(afterSelectionByProp.calls.argsFor(1)).toEqual([2, 'prop1', 3, 'prop2', jasmine.any(Object), 1]);
    expect(afterSelectionByProp.calls.argsFor(2)).toEqual([7, 'prop7', 7, 'prop7', jasmine.any(Object), 2]);
    expect(afterSelectionByProp.calls.argsFor(3)).toEqual([8, 'prop4', 0, 'prop4', jasmine.any(Object), 3]);
    expect(afterSelectionByProp.calls.argsFor(4)).toEqual([2, 'prop4', 2, 'prop4', jasmine.any(Object), 4]);

    expect(afterSelectionEnd.calls.count()).toBe(5);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([1, 2, 2, 4, 0]);
    expect(afterSelectionEnd.calls.argsFor(1)).toEqual([2, 1, 3, 2, 1]);
    expect(afterSelectionEnd.calls.argsFor(2)).toEqual([7, 7, 7, 7, 2]);
    expect(afterSelectionEnd.calls.argsFor(3)).toEqual([8, 4, 0, 4, 3]);
    expect(afterSelectionEnd.calls.argsFor(4)).toEqual([2, 4, 2, 4, 4]);

    expect(afterSelectionEndByProp.calls.count()).toBe(5);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([1, 'prop2', 2, 'prop4', 0]);
    expect(afterSelectionEndByProp.calls.argsFor(1)).toEqual([2, 'prop1', 3, 'prop2', 1]);
    expect(afterSelectionEndByProp.calls.argsFor(2)).toEqual([7, 'prop7', 7, 'prop7', 2]);
    expect(afterSelectionEndByProp.calls.argsFor(3)).toEqual([8, 'prop4', 0, 'prop4', 3]);
    expect(afterSelectionEndByProp.calls.argsFor(4)).toEqual([2, 'prop4', 2, 'prop4', 4]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(5);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(2);
    expect(beforeSetRangeStartOnly.calls.argsFor(1)[0].row).toBe(2);
    expect(beforeSetRangeStartOnly.calls.argsFor(1)[0].col).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(2)[0].row).toBe(7);
    expect(beforeSetRangeStartOnly.calls.argsFor(2)[0].col).toBe(7);
    expect(beforeSetRangeStartOnly.calls.argsFor(3)[0].row).toBe(8);
    expect(beforeSetRangeStartOnly.calls.argsFor(3)[0].col).toBe(4);
    expect(beforeSetRangeStartOnly.calls.argsFor(4)[0].row).toBe(2);
    expect(beforeSetRangeStartOnly.calls.argsFor(4)[0].col).toBe(4);
  });
});
