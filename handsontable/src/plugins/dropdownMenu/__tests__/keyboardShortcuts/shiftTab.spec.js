describe('DropdownMenu keyboard shortcut', () => {
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
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(10),
      });

      await dropdownMenu(1);
      await keyDownUp(['shift', 'tab']);

      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(false);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,0 from: 0,0 to: 0,0']);
      expect(isListening()).toBe(true);
    });
  });
});
