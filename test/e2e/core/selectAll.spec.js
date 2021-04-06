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

  it('should select all cells and clear previous selection', () => {
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

    hot.view.wt.wtTable.holder.scrollTop = 150;
    hot.view.wt.wtTable.holder.scrollLeft = 150;

    selectAll();

    expect(`
    |   ║ * : * : * : * : * : * : * |
    |===:===:===:===:===:===:===:===|
    | * ║ A : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
    | * ║ 0 : 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();

    // "Select all" shouldn't scroll te table.
    expect(hot.view.wt.wtTable.holder.scrollTop).toBe(150);
    expect(hot.view.wt.wtTable.holder.scrollLeft).toBe(150);
  });

  it('should select the row and column headers after calling the `selectAll` method, when all rows are trimmed', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
    });

    selectAll();

    expect(getSelected()).toEqual([[-1, -1, -1, 4]]);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
    `).toBeMatchToSelectionPattern();
  });

  it('should NOT select the row and column headers after calling the `selectAll` method with the `inclueHeaders`' +
    ' arguments set to `false`, when all rows are trimmed', () => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      trimRows: [0, 1, 2, 3, 4], // TODO: The TrimmingMap should be used instead of the plugin.
    });

    selectAll(false);

    expect(`
      |   ║   :   :   :   :   |
      |===:===:===:===:===:===|
    `).toBeMatchToSelectionPattern();
  });
});
