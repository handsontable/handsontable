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

      dropdownMenu(0);

      const initialSelectionState = getSelectedRange();

      keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
      expect(getSelectedRange()).toEqual(initialSelectionState);
      expect(isListening()).toBe(false);

      openDropdownSubmenuOption('Alignment');

      await sleep(300);

      keyDownUp(['Control/Meta', 'A']);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.isOpened()).toBe(true);
      expect(getPlugin('dropdownMenu').menu.isOpened()).toBe(true);
      expect(getSelectedRange()).toEqual(initialSelectionState);
      expect(isListening()).toBe(false);
    });
  });
});
