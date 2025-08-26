describe('Selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
    this.$container1 = $('<div id="testContainer2"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
    this.$container1.data('handsontable')?.destroy();
    this.$container1.remove();
  });

  describe('`importSelection` method', () => {
    it('should import selection from another instance', async() => {
      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      });

      await selectRows(2);
      await keyDown('meta');
      await selectColumns(3);
      await mouseDown(getCell(3, 0));
      await mouseOver(getCell(3, 1));
      await mouseOver(getCell(4, 1));
      await mouseUp(getCell(4, 1));
      await keyUp('meta');
      await keyDownUp('tab');
      await keyDownUp('enter'); // move focus to the B5

      const selectionState = hot.selection.exportSelection();

      const hot2 = handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
      }, false, spec().$container1);

      const selection = hot2.selection;

      selection.importSelection(selectionState);
      hot2.view.render();

      expect(`
        |   ║ - : - : - : * : - |
        |===:===:===:===:===:===|
        | - ║   :   :   : 0 :   |
        | - ║   :   :   : 0 :   |
        | * ║ 0 : 0 : 0 : 1 : 0 |
        | - ║ 0 : 0 :   : 0 :   |
        | - ║ 0 : A :   : 0 :   |
      `).toBeMatchToSelectionPattern(hot2);
      expect(hot2.getSelectedRange()).toEqualCellRange([
        'highlight: 2,0 from: 2,-1 to: 2,4',
        'highlight: 0,3 from: -1,3 to: 4,3',
        'highlight: 4,1 from: 3,0 to: 4,1',
      ]);
      expect(selection.isSelectedByRowHeader(0)).toBe(true);
      expect(selection.isSelectedByRowHeader(1)).toBe(false);
      expect(selection.isSelectedByRowHeader(2)).toBe(false);
      expect(selection.isSelectedByColumnHeader(0)).toBe(false);
      expect(selection.isSelectedByColumnHeader(1)).toBe(true);
      expect(selection.isSelectedByColumnHeader(2)).toBe(false);
    });
  });
});
