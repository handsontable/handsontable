describe('DropdownMenu keyboard shortcut', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find('#testContainer').remove();
    }
  });

  describe('"ArrowRight"', () => {
    it('should open subMenu and highlight the first item', async() => {
      handsontable({
        colHeaders: true,
        data: createSpreadsheetData(4, 4),
        dropdownMenu: ['alignment'],
        height: 100
      });

      await dropdownMenu();
      await keyDownUp('arrowdown');
      await keyDownUp('arrowright');

      await sleep(300);

      expect(getPlugin('dropdownMenu').menu.hotSubMenus.alignment.hotMenu.getSelected()).toEqual([
        [0, 0, 0, 0]
      ]);
    });
  });
});
