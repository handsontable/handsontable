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

  it('should select all cells and clear previous selection', async() => {
    const scrollbarWidth = Handsontable.dom.getScrollbarWidth(); // normalize viewport size disregarding of the scrollbar size on any OS

    const hot = handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(15, 20),
      width: 185 + scrollbarWidth,
      height: 85 + scrollbarWidth,
      selectionMode: 'multiple',
      colHeaders: true,
      rowHeaders: true,
    });

    selectCells([[1, 1, 2, 2], [2, 2, 4, 4]]);

    hot.view.wt.wtTable.holder.scrollTop = 150;
    hot.view.wt.wtTable.holder.scrollLeft = 150;

    selectAll();

    await sleep(50);

    /*
    Before scrolling, Walkontable wants to render rows from 0 to 4. Handsontable's setting
    `viewportRowRenderingOffset` "auto" causes extending that to: from 0 to 8.

    After scrolling, Walkontable wants to render rows from 2 to 5. Handsontable's setting
    `viewportRowRenderingOffset` "auto" causes extending that to: from 0 to 9.

    Hence, it is expected to render 10 rows in total.
    */
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
      `).toBeMatchToSelectionPattern();
    // "Select all" shouldn't scroll te table.
    expect(hot.view.wt.wtTable.holder.scrollTop).toBe(150);
    expect(hot.view.wt.wtTable.holder.scrollLeft).toBe(150);
  });
});
