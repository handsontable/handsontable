describe('DropdownMenu keyboard shortcut (RTL mode)', () => {
  using('configuration object', [
    { htmlDir: 'rtl', layoutDirection: 'inherit' },
    { htmlDir: 'ltr', layoutDirection: 'rtl' },
  ], ({ htmlDir, layoutDirection }) => {
    beforeEach(function() {
      $('html').attr('dir', htmlDir);
      this.$container = $('<div id="testContainer"></div>').appendTo('body');
    });

    afterEach(function() {
      $('html').attr('dir', 'ltr');

      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('"Shift" + "Alt/Option" + "ArrowDown"', () => {
      it('should be possible to open the dropdown menu in the correct position', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(3, 8),
          colHeaders: true,
          rowHeaders: true,
          navigableHeaders: false,
          dropdownMenu: true
        });

        selectCell(1, 1);
        keyDownUp(['shift', 'alt', 'arrowdown']);

        const cell = getCell(-1, 1, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const cellOffset = $(cell).offset();
        const buttonOffset = $(cell.querySelector('.changeType')).offset();
        const buttonWidth = $(cell.querySelector('.changeType')).outerWidth();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
          main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
        });
        expect(menuOffset.left).toBeCloseTo(buttonOffset.left + buttonWidth - menuWidth, 0);
        expect(getSelectedRange()).toEqualCellRange(['highlight: 0,1 from: -1,1 to: 2,1']);
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
        keyDownUp(['shift', 'alt', 'arrowdown']);

        const cell = getCell(-1, lastColumn, true);
        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const cellOffset = $(cell).offset();
        const buttonOffset = $(cell.querySelector('.changeType')).offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(cellOffset.top + cell.clientHeight, 0);
          main.toBeCloseTo(cellOffset.top + cell.clientHeight - 1, 0);
        });
        expect(menuOffset.left).toBeCloseTo(buttonOffset.left, 0);
        expect(getSelectedRange()).toEqualCellRange([
          `highlight: -1,${lastColumn} from: -1,${lastColumn} to: 3,${lastColumn}`
        ]);
      });
    });
  });
});
