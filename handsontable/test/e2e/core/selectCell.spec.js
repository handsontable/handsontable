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

  it('should call the `selectCells` method of the Core module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot, 'selectCells').and.returnValue('return value');

    expect(selectCell()).toBe(false);
    expect(hot.selectCells).toHaveBeenCalledTimes(0);

    hot.selectCells.calls.reset();

    expect(selectCell(1)).toBe(false);
    expect(hot.selectCells).toHaveBeenCalledTimes(0);

    hot.selectCells.calls.reset();

    expect(selectCell(1, 2)).toBe('return value');
    expect(hot.selectCells).toHaveBeenCalledWith([[1, 2, undefined, undefined]], true, true);
    expect(hot.selectCells).toHaveBeenCalledTimes(1);

    hot.selectCells.calls.reset();

    expect(selectCell(1, 2, 3)).toBe('return value');
    expect(hot.selectCells).toHaveBeenCalledWith([[1, 2, 3, undefined]], true, true);
    expect(hot.selectCells).toHaveBeenCalledTimes(1);

    hot.selectCells.calls.reset();

    expect(selectCell(1, 2, 3, 4)).toBe('return value');
    expect(hot.selectCells).toHaveBeenCalledWith([[1, 2, 3, 4]], true, true);
    expect(hot.selectCells).toHaveBeenCalledTimes(1);

    hot.selectCells.calls.reset();

    expect(selectCell(1, 2, 3, 4, false)).toBe('return value');
    expect(hot.selectCells).toHaveBeenCalledWith([[1, 2, 3, 4]], false, true);
    expect(hot.selectCells).toHaveBeenCalledTimes(1);

    hot.selectCells.calls.reset();

    expect(selectCell(1, 2, 3, 4, false, false)).toBe('return value');
    expect(hot.selectCells).toHaveBeenCalledWith([[1, 2, 3, 4]], false, false);
    expect(hot.selectCells).toHaveBeenCalledTimes(1);
  });

  it('should call `afterSelectionEnd` as many times as for `afterSelection`', () => {
    let tick = 0;
    let tickEnd = 0;

    handsontable({
      startRows: 5,
      startCols: 5,
      afterSelection() {
        tick += 1;
      },
      afterSelectionEnd() {
        tickEnd += 1;
      }
    });

    selectCell(3, 0);
    selectCell(1, 1);

    expect(tick).toEqual(2);
    expect(tickEnd).toEqual(2);
  });
});
