describe('DropdownMenu', () => {
  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
  ], ({ htmlDir, layoutDirection }) => {
    const id = 'testContainer';

    beforeEach(function() {
      $('.jasmine_html-reporter').hide();
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('.jasmine_html-reporter').show();
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('menu opening', () => {
      it('should render dropdown menu by default on the right position', () => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
        });

        dropdownMenu(0);

        const dropdownButton = getColumnHeader(0).querySelector('.changeType');
        const dropdownButtonOffset = $(dropdownButton).offset();
        const dropdownButtonHeight = $(dropdownButton).outerHeight();
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();

        expect($dropdownMenu.length).toBe(1);
        // 4px - an empty gap between button and context menu element
        expect(menuOffset.top).toBeCloseTo(dropdownButtonOffset.top + dropdownButtonHeight + 4, 0);
        expect(menuOffset.left).toBeCloseTo(dropdownButtonOffset.left, 0);
      });

      it('should render dropdown menu on the left position if on the right there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
          colHeaders: true,
        });

        dropdownMenu(countCols() - 1);

        const dropdownButton = getColumnHeader(countCols() - 1).querySelector('.changeType');
        const dropdownButtonOffset = $(dropdownButton).offset();
        const dropdownButtonHeight = $(dropdownButton).outerHeight();
        const dropdownButtonWidth = $(dropdownButton).outerWidth();
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();

        expect($dropdownMenu.length).toBe(1);
        // 4px - an empty gap between button and context menu element
        expect(menuOffset.top).toBeCloseTo(dropdownButtonOffset.top + dropdownButtonHeight + 4, 0);
        expect(menuOffset.left).toBeCloseTo(dropdownButtonOffset.left - menuWidth + dropdownButtonWidth, 0);
      });
    });

    describe('subMenu opening', () => {
      it('should open subMenu by default on the right position of the main menu', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
          colHeaders: true,
        });

        openDropdownSubmenuOption('Alignment', 0);

        await sleep(350);

        const $dropdownMenu = $('.htDropdownMenu');
        const dropdownOffset = $dropdownMenu.offset();

        const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const subMenuRoot = $('.htDropdownMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBeCloseTo(dropdownOffset.left + $dropdownMenu.outerWidth(), 0);
      });

      it('should open subMenu on the left of the main menu if on the right there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
          colHeaders: true,
        });

        openDropdownSubmenuOption('Alignment', countCols() - 1);

        await sleep(350);

        const $dropdownMenu = $('.htDropdownMenu');
        const dropdownOffset = $dropdownMenu.offset();

        const subMenuItem = $('.htDropdownMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const subMenuRoot = $('.htDropdownMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        expect(subMenuOffset.left).toBeCloseTo(dropdownOffset.left - $dropdownMenu.outerWidth(), 0);
      });
    });
  });
});
