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

  describe('"Escape"', () => {
    it('should close the menu', () => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      dropdownMenu();

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });

    it('should close only the submenu leaving the parent open', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      openDropdownSubmenuOption('Alignment');

      await sleep(300);

      keyDownUp('arrowdown');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(true);

      keyDownUp('escape');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(false);
      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });
  });
});
