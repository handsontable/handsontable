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

  describe('"ArrowLeft"', () => {
    it('should open subMenu and highlight the first item when configured as `layoutDirection: rtl`', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['alignment'],
        height: 100,
        layoutDirection: 'rtl',
      });

      await contextMenu();
      await keyDownUp('arrowdown');
      await keyDownUp('arrowleft');

      await sleep(300);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });

    it('should hide already opened subMenu', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: ['alignment'],
        height: 100,
      });

      await contextMenu();
      await keyDownUp('arrowdown');
      await keyDownUp('arrowright');

      await sleep(300);

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(true);

      await keyDownUp('arrowleft');

      expect($('.htContextMenuSub_Alignment').is(':visible')).toBe(false);
    });
  });
});
