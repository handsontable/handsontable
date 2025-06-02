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

  describe('"Shift" + "Tab"', () => {
    it('should close the menu and move the selection of the main table to the previous cell', async() => {
      handsontable({
        contextMenu: generateRandomContextMenuItems(10),
      });

      await selectCell(1, 2);
      await contextMenu();
      await keyDownUp(['shift', 'tab']);

      expect(getPlugin('contextMenu').menu.isOpened()).toBe(false);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 1,1 from: 1,1 to: 1,1']);
      expect(isListening()).toBe(true);
    });
  });
});
