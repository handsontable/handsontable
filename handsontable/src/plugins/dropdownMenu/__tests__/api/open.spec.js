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
      it('should open dropdown menu by default on the right-bottom position', () => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
          colHeaders: true,
        });

        selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it('should open dropdown menu by default on the right-bottom position (including offset)', () => {
        handsontable({
          layoutDirection,
          dropdownMenu: true,
        });

        selectCell(0, 0);

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
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1 + 40, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left + 20, 0);
      });

      it.forTheme('classic')('should open dropdown menu on the right-top position if on the left ' +
        'and bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it.forTheme('main')('should open dropdown menu on the right-top position if on the left and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it.forTheme('classic')('should open dropdown menu on the right-top position if on the left ' +
        'and bottom there is no space left (including offset)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

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
        expect(menuBoundingClientRect.y).toBeCloseTo(cellOffset.top - menuHeight + 30, 0);
        expect(menuBoundingClientRect.x).toBeCloseTo(cellOffset.left + 20, 0);
      });

      it.forTheme('main')('should open dropdown menu on the right-top position if on the left and ' +
        'bottom there is no space left (including offset)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), 4),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        selectCell(countRows() - 1, 0);

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
        expect(menuBoundingClientRect.y).toBeCloseTo(cellOffset.top - menuHeight + 30, 0);
        expect(menuBoundingClientRect.x).toBeCloseTo(cellOffset.left + 20, 0);
      });

      it('should open dropdown menu on the left-bottom position if on the right there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuBoundingClientRect = $dropdownMenu[0].getBoundingClientRect();
        const menuWidth = $dropdownMenu.outerWidth();

        expect($dropdownMenu.length).toBe(1);
        expect(menuBoundingClientRect.y).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuBoundingClientRect.x).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it('should open dropdown menu on the left-bottom position if on the right there is no space left (including offset)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        selectCell(0, countCols() - 1);

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
        expect(menuBoundingClientRect.y).toBeCloseTo(cellOffset.top + 1 + 40, 0);
        expect(menuBoundingClientRect.x).toBeCloseTo(cellOffset.left - menuWidth + 10, 0);
      });

      it.forTheme('classic')('should open dropdown menu on the left-top position if on the right and' +
        ' bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it.forTheme('main')('should open dropdown menu on the left-top position if on the right and ' +
        'bottom there is no space left', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('dropdownMenu').open(cellOffset);

        const $dropdownMenu = $(document.body).find('.htDropdownMenu:visible');
        const menuOffset = $dropdownMenu.offset();
        const menuWidth = $dropdownMenu.outerWidth();
        const menuHeight = $dropdownMenu.outerHeight();

        expect($dropdownMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it.forTheme('classic')('should open dropdown menu on the left-top position if on the right ' +
        'and bottom there is no space left (including offset)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

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
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight + 30, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + 10, 0);
      });

      it.forTheme('main')('should open dropdown menu on the left-top position if on the right and ' +
        'bottom there is no space left (including offset)', () => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), Math.floor(window.innerWidth / 50)),
          dropdownMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        selectCell(countRows() - 1, countCols() - 1);

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
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight + 30, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + 10, 0);
      });
    });
  });
});
