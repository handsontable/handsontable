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
    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(15, 20),
      width: 200,
      height: 100,
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    hot.view.wt.wtTable.holder.scrollTop = 100;
    hot.view.wt.wtTable.holder.scrollLeft = 100;

    selectAll();

    expect(`
      |   ║ * : * : * : * : * : * |
      |===:===:===:===:===:===:===|
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
      `).toBeMatchToSelectionPattern();
    // "Select all" shouldn't scroll te table.
    expect(hot.view.wt.wtTable.holder.scrollTop).toBe(100);
    expect(hot.view.wt.wtTable.holder.scrollLeft).toBe(100);
  });
});
