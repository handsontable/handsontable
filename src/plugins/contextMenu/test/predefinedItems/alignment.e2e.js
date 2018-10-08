describe('ContextMenu', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('alignment', () => {
    it('should align text left', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);

      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);
      button.simulate('mousedown'); // Text left

      expect(getCellMeta(0, 0).className).toEqual('htLeft');
      expect(getCell(0, 0).className).toContain('htLeft');
    });

    it('should align text center', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

      button.simulate('mousedown'); // Text center
      expect(getCellMeta(0, 0).className).toEqual('htCenter');
      expect(getCell(0, 0).className).toContain('htCenter');
    });

    it('should align text right', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

      button.simulate('mousedown'); // Text right
      expect(getCellMeta(0, 0).className).toEqual('htRight');
      expect(getCell(0, 0).className).toContain('htRight');
    });

    it('should justify text', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);

      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

      button.simulate('mousedown'); // Text justify
      deselectCell();
      expect(getCellMeta(0, 0).className).toEqual('htJustify');
      expect(getCell(0, 0).className).toContain('htJustify');
    });

    it('should vertical align text top', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

      button.simulate('mousedown'); // Text top
      deselectCell();
      expect(getCellMeta(0, 0).className).toEqual('htTop');
      expect(getCell(0, 0).className).toContain('htTop');
    });

    it('should vertical align text middle', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(5);

      button.simulate('mousedown'); // Text middle
      deselectCell();
      expect(getCellMeta(0, 0).className).toEqual('htMiddle');
      expect(getCell(0, 0).className).toContain('htMiddle');
    });

    it('should vertical align text bottom', async() => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();
      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(6);
      button.simulate('mousedown'); // Text bottom
      deselectCell();
      expect(getCellMeta(0, 0).className).toEqual('htBottom');
      expect(getCell(0, 0).className).toContain('htBottom');
    });

    it('should trigger `afterSetCellMeta` callback after changing alignment by context menu', async() => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      selectCell(2, 3);
      contextMenu();
      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      await sleep(350);
      const contextSubMenu = $(`.htContextMenuSub_${item.text()}`);
      const button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);
      button.simulate('mousedown'); // Text bottom
      deselectCell();
      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'className', 'htRight', undefined, undefined);
    });
  });
});
