describe('DropdownMenu keyboard shortcut (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {

    const id = 'testContainer';

    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('"Control/meta" + "Enter"', () => {
      it('should be possible to open the dropdown menu in the correct position', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(3, 8),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          dropdownMenu: true
        });

        selectCell(-1, 1);
        keyDownUp(['control/meta', 'enter']);

        const cell = getCell(-1, 1, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const cellOffset = $(cell).offset();
        const cellWidth = $(cell).outerWidth();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + cellWidth);
        expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: 2,1']);
      });

      it('should be possible to open the dropdown menu on the right position when on the left there is no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: true,
          dropdownMenu: true
        });

        const lastColumn = countCols() - 1;

        selectCell(-1, lastColumn);
        keyDownUp(['control/meta', 'enter']);

        const cell = getCell(-1, lastColumn, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const cellOffset = $(cell).offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + cell.clientHeight + 2);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left);
        expect(getSelectedRange()).toEqualCellRange([
          `highlight: -1,${lastColumn} from: -1,${lastColumn} to: 3,${lastColumn}`
        ]);
      });
    });
  });
});
