describe('DropdownMenu', () => {
  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
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

    describe('`open()` method', () => {
      it('should open dropdown menu by default on the right-bottom position', async() => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
        });

        await selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeAroundValue(cellOffset.top + 1, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left, 4);
      });

      it('should open dropdown menu by default on the right-bottom position (including offset)', async() => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
        });

        await selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeAroundValue(cellOffset.top + 1 + 40, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left + 20, 4);
      });

      it('should open dropdown menu on the right-top position if on the left ' +
        'and bottom there is no space left', async() => {
        const rowDivisor = getDefaultRowHeight();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / rowDivisor), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        await selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeAroundValue(cellOffset.top - menuHeight, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left, 4);
      });

      it('should open dropdown menu on the right-top position if on the left ' +
        'and bottom there is no space left (including offset)', async() => {
        const rowDivisor = getDefaultRowHeight();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / rowDivisor), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        await selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuBoundingClientRect = $dropdownMenu[0].getBoundingClientRect();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuBoundingClientRect.y).toBeAroundValue(cellOffset.top - menuHeight + 30, 4);
        expect(menuBoundingClientRect.x).toBeAroundValue(cellOffset.left + 20, 4);
      });

      it('should open dropdown menu on the left-bottom position if on the right there is no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        await selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuBoundingClientRect = $dropdownMenu[0].getBoundingClientRect();
        const menuWidth = $dropdownMenu.outerWidth();

        expect($dropdownMenu.length).toBe(1);
        expect(menuBoundingClientRect.y).toBeAroundValue(cellOffset.top + 1, 4);
        expect(menuBoundingClientRect.x).toBeAroundValue(cellOffset.left - menuWidth, 4);
      });

      it('should open dropdown menu on the left-bottom position if on the right there is no space left (including offset)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        await selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuBoundingClientRect = $dropdownMenu[0].getBoundingClientRect();
        const menuWidth = $dropdownMenu.outerWidth();

        expect($dropdownMenu.length).toBe(1);
        expect(menuBoundingClientRect.y).toBeAroundValue(cellOffset.top + 1 + 40, 4);
        expect(menuBoundingClientRect.x).toBeAroundValue(cellOffset.left - menuWidth + 10, 4);
      });

      it('should open dropdown menu on the left-top position if on the right and' +
        ' bottom there is no space left', async() => {
        const rowDivisor = getDefaultRowHeight();
        const colDivisor = getDefaultColumnWidth();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(
            Math.floor(window.innerHeight / rowDivisor),
            Math.floor(window.innerWidth / colDivisor),
          ),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        await selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        // Derive expected from DOM state so horizontal/vertical scroll introduced
        // by denser themes is accounted for (the positioner's Cursor adds scrollX/scrollY
        // to the literal cell offset; when the grid overflows the body slightly, that
        // shifts the menu by the scroll amount).
        expect(menuOffset.top).toBeAroundValue(cellOffset.top - menuHeight + window.scrollY, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left - menuWidth + window.scrollX, 4);
      });

      it('should open dropdown menu on the left-top position if on the right ' +
        'and bottom there is no space left (including offset)', async() => {
        const rowDivisor = getDefaultRowHeight();
        const colDivisor = getDefaultColumnWidth();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(
            Math.floor(window.innerHeight / rowDivisor),
            Math.floor(window.innerWidth / colDivisor),
          ),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        await selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        // Derive expected from DOM state so horizontal/vertical scroll introduced
        // by denser themes is accounted for. See the preceding test for the note.
        expect(menuOffset.top).toBeAroundValue(cellOffset.top - menuHeight + 30 + window.scrollY, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left - menuWidth + 10 + window.scrollX, 4);
      });
    });
  });
});
