describe('ContextMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('"Tab"', () => {
    it('should close the menu and move the selection of the main table to the next cell', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(10),
      });

      await selectCell(1, 2);
      await contextMenu();
      await keyDownUp('tab');

      expect(getPlugin('contextMenu').menu.isOpened()).toBe(false);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,3 from: 1,3 to: 1,3']);
      expect(isListening()).toBe(true);
    });
  });
});
