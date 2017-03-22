describe('ContextMenu', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('alignment', function() {
    it('should align text left', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(0);
        button.simulate('mousedown'); // Text left

        expect(getCellMeta(0, 0).className).toEqual('htLeft');
        expect(getCell(0, 0).className).toContain('htLeft');
        done();
      }, 350);
    });

    it('should align text center', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(1);

        button.simulate('mousedown'); // Text center
        expect(getCellMeta(0, 0).className).toEqual('htCenter');
        expect(getCell(0, 0).className).toContain('htCenter');
        done();
      }, 350);
    });

    it('should align text right', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);

        button.simulate('mousedown'); // Text right
        expect(getCellMeta(0, 0).className).toEqual('htRight');
        expect(getCell(0, 0).className).toContain('htRight');
        done();
      }, 350);
    });

    it('should justify text', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(3);

        button.simulate('mousedown'); // Text justify
        deselectCell();
        expect(getCellMeta(0, 0).className).toEqual('htJustify');
        expect(getCell(0, 0).className).toContain('htJustify');
        done();
      }, 350); // menu opens after 300ms
    });

    it('should vertical align text top', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(4);

        button.simulate('mousedown'); // Text top
        deselectCell();
        expect(getCellMeta(0, 0).className).toEqual('htTop');
        expect(getCell(0, 0).className).toContain('htTop');
        done();
      }, 350); // menu opens after 300ms
    });

    it('should vertical align text middle', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(5);

        button.simulate('mousedown'); // Text middle
        deselectCell();
        expect(getCellMeta(0, 0).className).toEqual('htMiddle');
        expect(getCell(0, 0).className).toContain('htMiddle');
        done();
      }, 350); // menu opens after 300ms
    });

    it('should vertical align text bottom', function (done) {
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();
      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(6);
        button.simulate('mousedown'); // Text bottom
        deselectCell();
        expect(getCellMeta(0, 0).className).toEqual('htBottom');
        expect(getCell(0, 0).className).toContain('htBottom');
        done();
      }, 350); // menu opens after 300ms
    });

    it('should trigger `afterSetCellMeta` callback after changing alignment by context menu', function (done) {
      var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      var hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      selectCell(2, 3);
      contextMenu();
      var item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(9);
      item.simulate('mouseover');

      setTimeout(function () {
        var contextSubMenu = $('.htContextMenuSub_' + item.text());
        var button = contextSubMenu.find('.ht_master .htCore tbody td').not('.htSeparator').eq(2);
        button.simulate('mousedown'); // Text bottom
        deselectCell();
        expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'className', 'htRight', undefined, undefined);
        done();
      }, 350); // menu opens after 300ms
    });
  });
});
