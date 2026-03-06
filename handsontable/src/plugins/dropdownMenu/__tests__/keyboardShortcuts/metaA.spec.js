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
    it('should not close the dropdown menu, nor select all cells in the main table', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
      });

      await dropdownMenu(0);

      const initialSelectionState = getSelectedRange();

      await keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
      expect(getSelectedRange()).toEqual(initialSelectionState);
      expect(isListening()).toBe(false);

      await openDropdownSubmenuOption('Alignment');

      await sleep(300);

      await keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.isOpened()).toBe(true);
      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
      expect(getSelectedRange()).toEqual(initialSelectionState);
      expect(isListening()).toBe(false);
    });
  });
});
