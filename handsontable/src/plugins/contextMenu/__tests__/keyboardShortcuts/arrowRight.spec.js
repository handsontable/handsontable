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

  describe('"ArrowRight"', () => {
    it('should open subMenu and highlight the first item', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: ['alignment'],
        height: 100
      });

      contextMenu();
      keyDownUp('arrowdown');
      keyDownUp('arrowright');

      await sleep(300);

      expect(getPlugin('contextMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });
});
