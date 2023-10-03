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

  describe('"Control/Meta" + "A"', () => {
    it('should close the menu and move the selection of the main table to the previous cell', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: generateRandomDropdownMenuItems(10),
      });

      dropdownMenu(1);
      keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(false);
      expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,0 to: 4,4']);
      expect(isListening()).toBe(true);
    });
  });
});
