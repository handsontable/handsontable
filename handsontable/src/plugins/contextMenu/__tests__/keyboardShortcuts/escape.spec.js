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

  describe('"Escape"', () => {
    it('should close the menu', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await contextMenu();

      expect($('.htContextMenu').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect($('.htContextMenu').is(':visible')).toBe(false);
    });

    it('should close only the submenu leaving the parent open', async() => {
      handsontable({
        contextMenu: true,
        height: 100
      });

      await openContextSubmenuOption('Alignment');
      await sleep(300);
      await keyDownUp('arrowdown');

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(true);

      await keyDownUp('escape');

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(false);
      expect($('.htContextMenu').is(':visible')).toBe(true);
    });
  });
});
