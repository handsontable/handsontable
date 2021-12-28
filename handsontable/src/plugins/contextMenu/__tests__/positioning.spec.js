describe('ContextMenu', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('.jasmine_html-reporter').hide();
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('.jasmine_html-reporter').show();

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
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

    it('should render context menu by default on the right-bottom position', () => {
      handsontable({
        contextMenu: true,
      });

      selectCell(0, 0);

      const cell = getCell(0, 0);
      const cellOffset = $(cell).offset();

      contextMenu(cell);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');
      const menuOffset = $contextMenu.offset();

      expect($contextMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
    });

    it('should render context menu on the right-top position if on the left and bottom there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), 4),
        contextMenu: true,
      });

      // we have to be sure we will have no enough space on the bottom, select the last cell
      selectCell(countRows() - 1, 0);

      const cell = getCell(countRows() - 1, 0);
      const cellOffset = $(cell).offset();

      contextMenu(cell);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');
      const menuOffset = $contextMenu.offset();
      const menuHeight = $contextMenu.outerHeight();

      expect($contextMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left, 0);
    });

    it('should render context menu on the left-bottom position if on the right there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(4, Math.floor(window.innerWidth / 50)),
        contextMenu: true,
      });

      // we have to be sure we will have no enough space on the right, select the last cell
      selectCell(0, countCols() - 1);

      const cell = getCell(0, countCols() - 1);
      const cellOffset = $(cell).offset();

      contextMenu(cell);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');
      const menuOffset = $contextMenu.offset();
      const menuWidth = $contextMenu.outerWidth();

      expect($contextMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top + 1, 0);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
    });

    it('should render context menu on the left-top position if on the right and bottom there is no space left', () => {
      handsontable({
        data: createSpreadsheetData(Math.floor(window.innerHeight / 23), Math.floor(window.innerWidth / 50)),
        contextMenu: true,
      });

      // we have to be sure we will have no enough space on the bottom and the right, select the last cell
      selectCell(countRows() - 1, countCols() - 1);

      const cell = getCell(countRows() - 1, countCols() - 1);
      const cellOffset = $(cell).offset();

      contextMenu(cell);

      const $contextMenu = $(document.body).find('.htContextMenu:visible');
      const menuOffset = $contextMenu.offset();
      const menuWidth = $contextMenu.outerWidth();
      const menuHeight = $contextMenu.outerHeight();

      expect($contextMenu.length).toBe(1);
      expect(menuOffset.top).toBeCloseTo(cellOffset.top - menuHeight, 0);
      expect(menuOffset.left).toBeCloseTo(cellOffset.left - menuWidth, 0);
    });
  });

  describe('subMenu opening', () => {
    it('should open subMenu by default on the right-bottom position of the main menu', async() => {
      handsontable({
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

      expect(subMenuOffset.top).toBeCloseTo(subMenuItemOffset.top - 1, 0);
      expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth(), 0);
    });

    it('should open subMenu on the right-top of the main menu if on the left and bottom there\'s no space left', async() => {
      handsontable({
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
      expect(subMenuOffset.left)
        .toBeCloseTo(contextMenuOffset.left + contextMenuRoot.outerWidth(), 0);
    });

    it('should open subMenu on the left-bottom of the main menu if on the right there\'s no space left', async() => {
      handsontable({
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
      expect(subMenuOffset.left).toBeCloseTo(contextMenuOffset.left - contextMenuRoot.outerWidth(), 0);
    });

    it('should open subMenu on the left-top of the main menu if on the right and bottom there\'s no space left', async() => {
      handsontable({
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
  });
});
