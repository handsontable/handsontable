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
    it('should close the menu', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      await dropdownMenu();

      expect($('.htDropdownMenu').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect($('.htDropdownMenu').is(':visible')).toBe(false);
    });

    it('should close only the submenu leaving the parent open', async() => {
      handsontable({
        colHeaders: true,
        dropdownMenu: true,
        height: 100
      });

      await openDropdownSubmenuOption('Alignment');
      await sleep(300);
      await keyDownUp('arrowdown');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect($('.htDropdownMenuSub_Alignment').is(':visible')).toBe(false);
      expect($('.htDropdownMenu').is(':visible')).toBe(true);
    });
  });
});
