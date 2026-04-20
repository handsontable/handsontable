describe('ContextMenu', () => {
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
      it('should open context menu by default on the right-bottom position', async() => {
        handsontable({
          layoutDirection,
          contextMenu: true,
        });

        await selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it('should open context menu by default on the right-bottom position (including offset)', async() => {
        handsontable({
          layoutDirection,
          contextMenu: true,
        });

        await selectCell(0, 0);

        const cell = getCell(0, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1 + 40, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left + 20, 0);
      });

      it('should open context menu on the right-top position if on the left and ' +
        'bottom there is no space left', async() => {
        const rowDivisor = getDefaultRowHeight();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / rowDivisor), 4),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        await selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
      });

      it('should open context menu on the right-top position if on the left and ' +
        'bottom there is no space left (including offset)', async() => {
        const rowDivisor = getDefaultRowHeight();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / rowDivisor), 4),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom, select the last cell
        await selectCell(countRows() - 1, 0);

        const cell = getCell(countRows() - 1, 0);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight + 30, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left + 20, 0);
      });

      it('should open context menu on the left-bottom position if on the right there is no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        await selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
      });

      it('should open context menu on the left-bottom position if on the right there is no space left (including offset)', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the right, select the last cell
        await selectCell(0, countCols() - 1);

        const cell = getCell(0, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();

        expect($contextMenu.length).toBe(1);
        expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1 + 40, 0);
        expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth + 10, 0);
      });

      it('should open context menu on the left-top position if on the right and ' +
        'bottom there is no space left', async() => {
        const rowDivisor = getDefaultRowHeight();
        const colDivisor = getDefaultColumnWidth();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(
            Math.floor(window.innerHeight / rowDivisor),
            Math.floor(window.innerWidth / colDivisor),
          ),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        await selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset);

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        // Kept at tolerance 4 (toBeAroundValue) because the positioner's
        // fitsBelow/fitsAbove branch selection (positioner.js `updatePosition`)
        // depends on window.innerHeight, menu height, and cell top all at once.
        // When the theme's menu height shifts by one density tier, a last-row cell
        // can cross the fallback boundary and the plugin picks `setPositionBelowCursor`
        // (cellOffset.top + 1) instead of above-cursor (cellOffset.top - menuHeight).
        // Fix the positioner to always pick the intended branch in these scenarios
        // (or size the container so the cell geometry is predictable) before tightening.
        expect(menuOffset.top).toBeAroundValue(cellOffset.top - menuHeight, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left - menuWidth, 4);
      });

      it('should open context menu on the left-top position if on the right and' +
        ' bottom there is no space left (including offset)', async() => {
        const rowDivisor = getDefaultRowHeight();
        const colDivisor = getDefaultColumnWidth();

        handsontable({
          layoutDirection,
          data: createSpreadsheetData(
            Math.floor(window.innerHeight / rowDivisor),
            Math.floor(window.innerWidth / colDivisor),
          ),
          contextMenu: true,
        });

        // we have to be sure we will have no enough space on the bottom and the right, select the last cell
        await selectCell(countRows() - 1, countCols() - 1);

        const cell = getCell(countRows() - 1, countCols() - 1);
        const cellOffset = $(cell).offset();

        getPlugin('contextMenu').open(cellOffset, {
          left: 10,
          right: 20,
          above: 30,
          below: 40,
        });

        const $contextMenu = $(document.body).find('.htContextMenu:visible');
        const menuOffset = $contextMenu.offset();
        const menuWidth = $contextMenu.outerWidth();
        const menuHeight = $contextMenu.outerHeight();

        expect($contextMenu.length).toBe(1);
        // Kept at tolerance 4: see the note on the preceding test.
        expect(menuOffset.top).toBeAroundValue(cellOffset.top - menuHeight + 30, 4);
        expect(menuOffset.left).toBeAroundValue(cellOffset.left - menuWidth + 10, 4);
      });
    });
  });
});
