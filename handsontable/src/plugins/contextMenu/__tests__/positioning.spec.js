describe('ContextMenu', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  using('configuration object', [
    { htmlDir: 'ltr', layoutDirection: 'inherit' },
    { htmlDir: 'rtl', layoutDirection: 'ltr' },
  ], ({ htmlDir, layoutDirection }) => {
    beforeEach(() => {
      $('html').attr('dir', htmlDir);
    });

    afterEach(() => {
      $('html').attr('dir', 'ltr');
    });

    describe('menu opening', () => {
      it('should open context menu in proper position in iframe', async() => {
        const iframeOutside = $('<iframe/>').css({ width: '500px', height: '500px' }).appendTo(spec().$container);
        const docOutside = iframeOutside[0].contentDocument;

        docOutside.open('text/html', 'replace');
        docOutside.write(`
          <!doctype html>
          <head>
            <link type="text/css" rel="stylesheet" href="../dist/handsontable.full.min.css">
          </head>`);
        docOutside.close();

        const iframeInside = $('<iframe/>')
          .css({ margin: '250px 500px 500px 250px', width: '500px', height: '500px' }).appendTo(docOutside.body);
        const docInside = iframeInside[0].contentDocument;

        docInside.open('text/html', 'replace');
        docInside.write(`
          <!doctype html>
          <head>
            <link type="text/css" rel="stylesheet" href="../dist/handsontable.full.min.css">
          </head>`);
        docInside.close();

        const uiContainer = $('<div/>').addClass('uiContainer').appendTo(docOutside.body);
        const container = $('<div/>').css({ marginTop: '500px', marginLeft: '500px' }).appendTo(docInside.body);

        const hot = container.handsontable({
          layoutDirection,
          contextMenu: {
            uiContainer: uiContainer[0],
          },
        }).handsontable('getInstance');

        docOutside.documentElement.scrollTop = 500;
        docOutside.documentElement.scrollLeft = 500;
        docInside.documentElement.scrollTop = 500;
        docInside.documentElement.scrollLeft = 500;

        await sleep(400);

        const cell = hot.getCell(2, 2);

        contextMenu(cell, hot);

        const contextMenuElem = $(docOutside.body).find('.htContextMenu');
        const contextMenuOffset = contextMenuElem.offset();
        const { top: cellTop, left: cellLeft } = cell.getBoundingClientRect();
        const { top: iframeTop, left: iframeLeft } = iframeInside.offset()
        ;
        const cellOffsetTop = cellTop + iframeTop;
        const cellOffsetLeft = cellLeft + iframeLeft;

        expect(contextMenuOffset.top).toBeAroundValue(cellOffsetTop);
        expect(contextMenuOffset.left).toBeAroundValue(cellOffsetLeft);

        container.handsontable('destroy');
      });
    });

    describe('subMenu opening', () => {
      it('should open subMenu by default on the right-bottom position of the main menu', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(0, 0);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore  td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).forThemes(({ classic, main }) => {
          classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
        });
        expect(subMenuOffset.left).forThemes(({ classic, main }) => {
          // 3px comes from borders
          classic.toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() + 3, 0);

          // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
          main.toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() - 1, 0);
        });
      });

      it.forTheme('classic')('should open subMenu on the right-top of the main menu if on the left ' +
        'and bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
          contextMenu: true,
        });

        selectCell(countRows() - 1, 0);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // 3px comes from bottom borders
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() + 3, 0);
        // 3px comes from right borders
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() + 3, 0);
      });

      it.forTheme('main')('should open subMenu on the right-top of the main menu if on the left and ' +
        'bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), 4),
          contextMenu: true,
        });

        selectCell(countRows() - 1, 0);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() + -5, 0);
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() - 1, 0);
      });

      it.forTheme('classic')('should open subMenu on the left-bottom of the main menu if on the right ' +
        'there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(0, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
        // 3px comes from right borders
        expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);
      });

      it.forTheme('main')('should open subMenu on the left-bottom of the main menu if on the right ' +
        'there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(0, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 9, 0);
        // 3px comes from right borders
        expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth() + 1, 0);
      });

      it.forTheme('classic')('should open subMenu on the left-top of the main menu if on the right ' +
        'and bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(countRows() - 1, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // 3px comes from bottom borders
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() + 3, 0);
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);
      });

      it.forTheme('main')('should open subMenu on the left-top of the main menu if on the right and ' +
        'bottom there\'s no space left', async() => {
        handsontable({
          layoutDirection,
          data: createSpreadsheetData(Math.floor(window.innerHeight / 29), Math.floor(window.innerWidth / 50)),
          contextMenu: true,
        });

        selectCell(countRows() - 1, countCols() - 1);
        openContextSubmenuOption('Alignment');

        await sleep(350);

        const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
        const subMenuItemOffset = subMenuItem.offset();
        const contextMenuRoot = $('.htContextMenu');
        const contextMenuOffset = contextMenuRoot.offset();
        const subMenuRoot = $('.htContextMenuSub_Alignment');
        const subMenuOffset = subMenuRoot.offset();

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        expect(subMenuOffset.top)
          .toBeCloseTo(subMenuItemOffset.top - subMenuRoot.outerHeight() + subMenuItem.outerHeight() - 5, 0);
        expect(subMenuOffset.left)
          .toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth() + 1, 0);
      });
    });

    it('should show tick from "Read only" element at proper place', () => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        readOnly: true,
      });

      selectCell(0, 0);

      const cell = getCell(0, 0);

      contextMenu(cell);

      const $readOnlyItem = $('.htContextMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = $contextMenuRoot.offset();

      expect(tickItemOffset.top).forThemes(({ classic, main }) => {
        classic.toBe(216);
        main.toBe(247);
      });
      expect(tickItemOffset.left).forThemes(({ classic, main }) => {
        classic.toBe(contextMenuOffset.left + 4);
        main.toBe(contextMenuOffset.left + 1);
      });
    });
  });

  describe('subMenu opening', () => {
    it('should open subMenu by default on the right-bottom position of the main menu (scrolled viewport) #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        contextMenu: true,
      });

      scrollViewportTo(0, 99);

      await sleep(50);

      selectCell(0, 80);
      openContextSubmenuOption('Alignment');

      await sleep(350);

      const subMenuItem = $('.htContextMenu .ht_master .htCore  td:contains(Alignment)');
      const subMenuItemOffset = subMenuItem.offset();
      const contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = contextMenuRoot.offset();
      const subMenuRoot = $('.htContextMenuSub_Alignment');
      const subMenuOffset = subMenuRoot.offset();

      // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
      expect(subMenuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);
        main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
      });
      expect(subMenuOffset.left).forThemes(({ classic, main }) => {
        // 3px comes from right borders
        classic.toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() + 3, 0);
        main.toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth() - 1, 0);
      });
    });

    it('should open subMenu on the left-bottom of the main menu if on the right there\'s no space left (scrolled viewport)' +
      ' #dev-1895', async() => {
      handsontable({
        data: createSpreadsheetData(4, 100),
        contextMenu: true,
      });

      selectCell(0, countCols() - 1);
      openContextSubmenuOption('Alignment');

      await sleep(350);

      const subMenuItem = $('.htContextMenu .ht_master .htCore td:contains(Alignment)');
      const subMenuItemOffset = subMenuItem.offset();
      const contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = contextMenuRoot.offset();
      const subMenuRoot = $('.htContextMenuSub_Alignment');
      const subMenuOffset = subMenuRoot.offset();

      expect(subMenuOffset.top).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(subMenuItemOffset.top - 1, 0);

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBeCloseTo(subMenuItemOffset.top - 9, 0);
      });
      expect(subMenuOffset.left).forThemes(({ classic, main }) => {
        classic.toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);

        // https://github.com/handsontable/dev-handsontable/issues/2205#issuecomment-2612363401
        main.toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth() + 1, 0);
      });
    });
  });
});
