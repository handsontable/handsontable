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

  it('should call the `selectCells` method of the Selection module internally', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(selection(), 'selectCells').and.returnValue('return value');

    expect(await selectCells()).toBe('return value');
    expect(selection().selectCells).toHaveBeenCalledWith([[]]);
    expect(selection().selectCells).toHaveBeenCalledTimes(1);

    selection().selectCells.calls.reset();

    expect(await selectCells('arg1')).toBe('return value');
    expect(selection().selectCells).toHaveBeenCalledWith('arg1');
    expect(selection().selectCells).toHaveBeenCalledTimes(1);

    selection().selectCells.calls.reset();

    expect(await selectCells('arg1', 'arg2')).toBe('return value');
    expect(selection().selectCells).toHaveBeenCalledWith('arg1');
    expect(selection().selectCells).toHaveBeenCalledTimes(1);
  });

  it('should not deselect current selection when selectCells is called without arguments', async() => {
    handsontable({
      data: createSpreadsheetObjectData(6, 4),
    });

    await selectCells([[0, 0, 2, 2], [1, 1, 3, 3]]); // Initial selection.

    expect(async() => {
      await selectCells();
    }).not.toThrow();

    expect(getSelected()).toEqual([[0, 0, 2, 2], [1, 1, 3, 3]]);
  });

  it('should by default scroll the viewport to the selected cell using column props (bottom of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCells([[15, 'prop0']]);

    expect(getCell(15, 0)).toBeVisibleAtBottomOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (right of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCells([[5, 15]]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (right of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCells([[5, 'prop15']]);

    expect(getCell(5, 15)).toBeVisibleAtRightOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (left of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCell(5, 15); // Scroll to the right of the table.
    await selectCells([[5, 5]]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (left of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCell(5, 15); // Scroll to the right of the table.
    await selectCells([[5, 'prop5']]);

    expect(getCell(5, 5)).toBeVisibleAtLeftOfViewport();
  });

  it('should by default scroll the viewport to the selected cell (top of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCell(19, 0); // Scroll to the bottom of the table.
    await selectCells([[1, 0]]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it('should by default scroll the viewport to the selected cell using column props (top of the viewport)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCell(19, 0); // Scroll to the bottom of the table.
    await selectCells([[1, 'prop0']]);

    expect(getCell(1, 0)).toBeVisibleAtTopOfViewport();
  });

  it.forTheme('classic')('should not the scroll the viewport when `false` argument is passed', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
    });

    await selectCells([[15, 0]], false);

    expect(getCell(15, 0)).not.toBeVisibleInViewport();
  });

  it.forTheme('main')('should not the scroll the viewport when `false` argument is passed', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 378,
      width: 300,
    });

    await selectCells([[15, 0]], false);

    expect(getCell(15, 0)).not.toBeVisibleInViewport();
  });

  it.forTheme('horizon')('should not the scroll the viewport when `false` argument is passed', async() => {
    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 482,
      width: 300,
    });

    await selectCells([[15, 0]], false);

    expect(getCell(15, 0)).not.toBeVisibleInViewport();
  });

  it('should by default change the listener to handsontable instance from the action was triggered', async() => {
    const afterListen = jasmine.createSpy();

    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterListen,
    });

    await selectCells([[15, 0]]);

    expect(afterListen).toHaveBeenCalled();
  });

  it('should not change the listening state when `false` argument is passed', async() => {
    const afterListen = jasmine.createSpy();

    handsontable({
      data: createSpreadsheetObjectData(20, 20),
      height: 300,
      width: 300,
      afterListen,
    });

    await selectCells([[15, 0]], true, false);

    expect(afterListen).not.toHaveBeenCalled();
  });
});
