describe('ContextMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  describe('"Control/Meta" + "A"', () => {
    it('should close the menu and move the selection of the main table to the previous cell', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(10),
      });

      await selectCell(1, 2);
      await contextMenu();
      await keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('contextMenu').menu.isOpened()).toBe(false);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,2 from: 0,0 to: 4,4']);
      expect(isListening()).toBe(true);
    });
  });
});
