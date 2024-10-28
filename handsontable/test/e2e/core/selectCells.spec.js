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

  it('should call the `selectCells` method of the Selection module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot.selection, 'selectCells').and.returnValue('return value');

    expect(selectCells()).toBe('return value');
    expect(hot.selection.selectCells).toHaveBeenCalledWith([[]]);
    expect(hot.selection.selectCells).toHaveBeenCalledTimes(1);

    hot.selection.selectCells.calls.reset();

    expect(selectCells('arg1')).toBe('return value');
    expect(hot.selection.selectCells).toHaveBeenCalledWith('arg1');
    expect(hot.selection.selectCells).toHaveBeenCalledTimes(1);

    hot.selection.selectCells.calls.reset();

    expect(selectCells('arg1', 'arg2')).toBe('return value');
    expect(hot.selection.selectCells).toHaveBeenCalledWith('arg1');
    expect(hot.selection.selectCells).toHaveBeenCalledTimes(1);
  });

  it('should not deselect current selection when sellectCells is called without arguments', () => {
    handsontable({
      data: createSpreadsheetObjectData(6, 4),
    });

    selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.
    expect(() => {
      selectCells();
    }).not.toThrow();

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
  });

  it('should by default scroll the viewport to the selected cell using column props (bottom of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[15, 'prop0']]);

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (right of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[5, 15]]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (right of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[5, 'prop15']]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (left of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCells([[5, 5]]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (left of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(5, 15); // Scroll to the right of the table.
    selectCells([[5, 'prop5']]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (top of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCells([[1, 0]]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (top of the viewport)', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCell(19, 0); // Scroll to the bottom of the table.
    selectCells([[1, 'prop0']]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should not the scroll the viewport when `false` argument is passed', () => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    selectCells([[15, 0]], false);

    expect(getCell(15, 0)).not.toBeVisibleInViewport();
  });

  it('should by default change the listener to handsontable instance from the action was triggered', () => {
    const afterListen = jasmine.createSpy();

    handsontable({
      data: createSpreadsheetObjectData(20, 20),
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
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterListen,
    });

    selectCells([[15, 0]], true, false);

    expect(afterListen).not.toHaveBeenCalled();
  });
});
