describe('Core.selectAll', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call the `selectAll` method of the Selection module internally', () => {
    const hot = handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(hot.selection, 'selectAll');
    selectAll();

    expect(hot.selection.selectAll).toHaveBeenCalledWith(true, true, undefined);
    expect(hot.selection.selectAll).toHaveBeenCalledTimes(1);

    hot.selection.selectAll.calls.reset();
    selectAll(false);

    expect(hot.selection.selectAll).toHaveBeenCalledWith(false, false, undefined);
    expect(hot.selection.selectAll).toHaveBeenCalledTimes(1);

    hot.selection.selectAll.calls.reset();
    selectAll(true, false);

    expect(hot.selection.selectAll).toHaveBeenCalledWith(true, false, undefined);
    expect(hot.selection.selectAll).toHaveBeenCalledTimes(1);

    hot.selection.selectAll.calls.reset();
    selectAll(true, true, { focusPosition: { row: 1, col: 1 } });

    expect(hot.selection.selectAll).toHaveBeenCalledWith(true, true, { focusPosition: { row: 1, col: 1 } });
    expect(hot.selection.selectAll).toHaveBeenCalledTimes(1);
  });

  it('should not scroll the viewport when all cells without headers are selected', () => {
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(15, 20),
      width: Math.min(200 - scrollbarWidth, 185),
      height: Math.min(100 - scrollbarWidth, 85),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    hot.view._wt.wtTable.holder.scrollTop = 150;
    hot.view._wt.wtTable.holder.scrollLeft = 150;

    selectAll(false);

    expect(`
      |   ║ - : - : - : - : - : - : - : - |
      |===:===:===:===:===:===:===:===:===|
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : A : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

    // "Select all" shouldn't scroll te table.
    expect(hot.view._wt.wtTable.holder.scrollTop).toBe(150);
    expect(hot.view._wt.wtTable.holder.scrollLeft).toBe(150);
  });

  it('should not scroll the viewport when all cells with headers are selected', () => {
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(15, 20),
      width: Math.min(200 - scrollbarWidth, 185),
      height: Math.min(100 - scrollbarWidth, 85),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    hot.view._wt.wtTable.holder.scrollTop = 150;
    hot.view._wt.wtTable.holder.scrollLeft = 150;

    selectAll(true);

    expect(`
      | * ║ * : * : * : * : * : * : * : * |
      |===:===:===:===:===:===:===:===:===|
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : A : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();

    // "Select all" shouldn't scroll te table.
    expect(hot.view._wt.wtTable.holder.scrollTop).toBe(150);
    expect(hot.view._wt.wtTable.holder.scrollLeft).toBe(150);
  });
});
