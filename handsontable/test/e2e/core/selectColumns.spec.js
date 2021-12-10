describe('Core.selectColumns', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should mark single column visually (default selectionMode, without headers)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: false,
      rowHeaders: false,
    });

    selectColumns(2);

    expect(`
      |   :   : A :   |
      |   :   : 0 :   |
      |   :   : 0 :   |
      |   :   : 0 :   |
      |   :   : 0 :   |
      |   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single column visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns(2);

    expect(`
      |   ║   :   : * :   |
      |===:===:===:===:===|
      | - ║   :   : A :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark non-contiquous selection when CTRL key is pressed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns(2);
    keyDown('ctrl');
    selectColumns(0);

    expect(`
      |   ║ * :   : * :   |
      |===:===:===:===:===|
      | - ║ A :   : 0 :   |
      | - ║ 0 :   : 0 :   |
      | - ║ 0 :   : 0 :   |
      | - ║ 0 :   : 0 :   |
      | - ║ 0 :   : 0 :   |
      | - ║ 0 :   : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single column visually (default selectionMode, fixedColumnsLeft enabled)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
      fixedColumnsLeft: 2,
    });

    selectColumns(1, 2);

    expect(`
      |   ║   : * | * :   |
      |===:===:===:===:===|
      | - ║   : A | 0 :   |
      | - ║   : 0 | 0 :   |
      | - ║   : 0 | 0 :   |
      | - ║   : 0 | 0 :   |
      | - ║   : 0 | 0 :   |
      | - ║   : 0 | 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark single column visually (default selectionMode) using column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns('prop2');

    expect(`
      |   ║   :   : * :   |
      |===:===:===:===:===|
      | - ║   :   : A :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      | - ║   :   : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the columns visually (default selectionMode)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns(2, 3);

    expect(`
      |   ║   :   : * : * |
      |===:===:===:===:===|
      | - ║   :   : A : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the columns visually (default selectionMode, reversed selection)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns(3, 2);

    expect(`
      |   ║   :   : * : * |
      |===:===:===:===:===|
      | - ║   :   : 0 : A |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the columns visually (default selectionMode) using column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns('prop2', 'prop3');

    expect(`
      |   ║   :   : * : * |
      |===:===:===:===:===|
      | - ║   :   : A : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark range of the columns visually (default selectionMode, reversed selection) using column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
    });

    selectColumns('prop3', 'prop2');

    expect(`
      |   ║   :   : * : * |
      |===:===:===:===:===|
      | - ║   :   : 0 : A |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      | - ║   :   : 0 : 0 |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark only single cell visually when selectionMode is set as `single', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
      selectionMode: 'single',
    });

    selectColumns(2);

    expect(`
      |   ║   :   : - :   |
      |===:===:===:===:===|
      | - ║   :   : # :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      |   ║   :   :   :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should mark the range of the columns visually when selectionMode is set as `range`', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
      colHeaders: true,
      rowHeaders: true,
      selectionMode: 'range',
    });

    selectColumns(1, 2);

    expect(`
      |   ║   : * : * :   |
      |===:===:===:===:===|
      | - ║   : A : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      | - ║   : 0 : 0 :   |
      `).toBeMatchToSelectionPattern();
  });

  it('should not mark headers as selected when there are no rows', () => {
    handsontable({
      data: [],
      colHeaders: true,
      columns: [{ }, { }],
    });

    let wasSelected = selectColumns(0);

    expect(getSelected()).toEqual([[-1, 0, -1, 0]]);
    expect(wasSelected).toBeTrue();
    expect(`
      | - :   |
      |===:===|
      `).toBeMatchToSelectionPattern();

    deselectCell();
    wasSelected = selectColumns(1);

    expect(getSelected()).toEqual([[-1, 1, -1, 1]]);
    expect(wasSelected).toBeTrue();
    expect(`
      |   : - |
      |===:===|
      `).toBeMatchToSelectionPattern();

    deselectCell();
    wasSelected = selectColumns(1, 2);

    expect(getSelected()).toBeUndefined();
    expect(wasSelected).toBeFalse();
    expect(`
      |   :   |
      |===:===|
      `).toBeMatchToSelectionPattern();
  });

  it('should not deselect current selection when selectColumns is called without arguments', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    selectCell(1, 1); // Initial selection.

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);

    selectColumns();

    expect(getSelected()).toEqual([[1, 1, 1, 1]]);
  });

  it('should not deselect current selection when selectColumns is called with negative values', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectColumns(0, -1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(-1, 0);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(-3, -1);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(-2);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when selectColumns is called with coordinates beyond the table data range', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(3, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectColumns(3, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(0, 4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(4);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns(200);

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should not deselect current selection when selectColumns is called with undefined column property', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    let wasSelected = selectCell(0, 0, 2, 2); // Initial selection.

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(true);

    wasSelected = selectColumns(0, 'notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);

    wasSelected = selectColumns('notExistProp');

    expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    expect(wasSelected).toBe(false);
  });

  it('should select only one column when two the same arguments are passed', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectColumns(1, 1);

    expect(getSelected()).toEqual([[-1, 1, 5, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select only one column when two the same arguments are passed (column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectColumns(1, 'prop1');

    expect(getSelected()).toEqual([[-1, 1, 5, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of columns when the coordinates are passed in reversed order (from right to left)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectColumns(2, 1);

    expect(getSelected()).toEqual([[-1, 2, 5, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should select range of columns when the coordinates are passed in reversed order (from right to left using column property)', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(6, 4),
    });

    const wasSelected = selectColumns('prop2', 'prop1');

    expect(getSelected()).toEqual([[-1, 2, 5, 1]]);
    expect(wasSelected).toBe(true);
  });

  it('should not the scroll the viewport when column is selected', () => {
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(15, 1); // Scroll to the bottom of the Hot viewport.

    const scrollTop = hot.view.wt.wtTable.holder.scrollTop;

    selectColumns(1);

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

    selectColumns(1, 2);

    expect(afterSelection.calls.first().object).toBe(hot);
    expect(afterSelectionByProp.calls.first().object).toBe(hot);
    expect(afterSelectionEnd.calls.first().object).toBe(hot);
    expect(afterSelectionEndByProp.calls.first().object).toBe(hot);
    expect(beforeSetRangeStartOnly.calls.first().object).toBe(hot);
  });

  it('should fire hooks with proper arguments when a single column is selected', () => {
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

    selectColumns(1);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([-1, 1, 19, 1, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([-1, 'prop1', 19, 'prop1', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([-1, 1, 19, 1, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([-1, 'prop1', 19, 'prop1', 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(-1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(1);
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

    selectColumns(1, 2);

    expect(afterSelection.calls.count()).toBe(1);
    expect(afterSelection.calls.argsFor(0)).toEqual([-1, 1, 19, 2, jasmine.any(Object), 0]);

    expect(afterSelectionByProp.calls.count()).toBe(1);
    expect(afterSelectionByProp.calls.argsFor(0)).toEqual([-1, 'prop1', 19, 'prop2', jasmine.any(Object), 0]);

    expect(afterSelectionEnd.calls.count()).toBe(1);
    expect(afterSelectionEnd.calls.argsFor(0)).toEqual([-1, 1, 19, 2, 0]);

    expect(afterSelectionEndByProp.calls.count()).toBe(1);
    expect(afterSelectionEndByProp.calls.argsFor(0)).toEqual([-1, 'prop1', 19, 'prop2', 0]);

    expect(beforeSetRangeStart.calls.count()).toBe(0);

    expect(beforeSetRangeStartOnly.calls.count()).toBe(1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].row).toBe(-1);
    expect(beforeSetRangeStartOnly.calls.argsFor(0)[0].col).toBe(1);
  });
});
