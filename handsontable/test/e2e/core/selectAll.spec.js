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

  it('should call the `selectAll` method of the Selection module internally', async() => {
    handsontable({
      data: createSpreadsheetObjectData(5, 5),
    });

    spyOn(selection(), 'selectAll');

    await selectAll();

    expect(selection().selectAll).toHaveBeenCalledWith(true, true, undefined);
    expect(selection().selectAll).toHaveBeenCalledTimes(1);

    selection().selectAll.calls.reset();

    await selectAll(false);

    expect(selection().selectAll).toHaveBeenCalledWith(false, false, undefined);
    expect(selection().selectAll).toHaveBeenCalledTimes(1);

    selection().selectAll.calls.reset();

    await selectAll(true, false);

    expect(selection().selectAll).toHaveBeenCalledWith(true, false, undefined);
    expect(selection().selectAll).toHaveBeenCalledTimes(1);

    selection().selectAll.calls.reset();

    await selectAll(true, true, { focusPosition: { row: 1, col: 1 } });

    expect(selection().selectAll).toHaveBeenCalledWith(true, true, { focusPosition: { row: 1, col: 1 } });
    expect(selection().selectAll).toHaveBeenCalledTimes(1);
  });

  it('should not scroll the viewport when all cells without headers are selected', async() => {
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

    handsontable({
      data: createSpreadsheetObjectData(15, 20),
      width: Math.min(200 - scrollbarWidth, 185),
      height: Math.min(100 - scrollbarWidth, 85),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    await scrollViewportHorizontally(150);
    await scrollViewportVertically(150);

    await selectAll(false);

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
    expect(tableView()._wt.wtTable.holder.scrollTop).toBe(150);
    expect(tableView()._wt.wtTable.holder.scrollLeft).toBe(150);
  });

  it('should not scroll the viewport when all cells with headers are selected', async() => {
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

    handsontable({
      data: createSpreadsheetObjectData(15, 20),
      width: Math.min(200 - scrollbarWidth, 185),
      height: Math.min(100 - scrollbarWidth, 85),
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    await selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    await scrollViewportHorizontally(150);
    await scrollViewportVertically(150);

    await selectAll(true);

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
    expect(tableView()._wt.wtTable.holder.scrollTop).toBe(150);
    expect(tableView()._wt.wtTable.holder.scrollLeft).toBe(150);
  });
});
