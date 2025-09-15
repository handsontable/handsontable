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

    // all other E2E tests are moved to visual tests. See ./visual-tests/tests/js-only/context-menu/

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

        setCurrentHotInstance(hot);

        await contextMenu(cell, hot);

        const contextMenuElem = $(docOutside.body).find('.htContextMenu');
        const contextMenuOffset = contextMenuElem.offset();
        const { top: cellTop, left: cellLeft } = cell.getBoundingClientRect();
        const { top: iframeTop, left: iframeLeft } = iframeInside.offset();
        const cellOffsetTop = cellTop + iframeTop;
        const cellOffsetLeft = cellLeft + iframeLeft;

        expect(contextMenuOffset.top).toBeAroundValue(cellOffsetTop);
        expect(contextMenuOffset.left).toBeAroundValue(cellOffsetLeft);

        container.handsontable('destroy');
      });
    });

    it('should show tick from "Read only" element at proper place', async() => {
      handsontable({
        layoutDirection,
        data: createSpreadsheetData(10, 10),
        contextMenu: true,
        readOnly: true,
      });

      await selectCell(0, 0);

      const cell = getCell(0, 0);

      await contextMenu(cell);

      const $readOnlyItem = $('.htContextMenu .ht_master .htCore td:contains(Read only)');
      const $tickItem = $readOnlyItem.find('span.selected');
      const tickItemOffset = $tickItem.offset();
      const $contextMenuRoot = $('.htContextMenu');
      const contextMenuOffset = $contextMenuRoot.offset();

      expect(tickItemOffset.top).forThemes(({ classic, main, horizon }) => {
        classic.toBe(216);
        main.toBe(246);
        horizon.toBe(313);
      });
      expect(tickItemOffset.left).forThemes(({ classic, main, horizon }) => {
        classic.toBe(contextMenuOffset.left + 4);
        main.toBe(contextMenuOffset.left + 1);
        horizon.toBe(contextMenuOffset.left);
      });
    });
  });
});
