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

  describe('insert_column', () => {
    it('should display a disabled entry for "Insert column right", when there\'s nothing selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        beforeContextMenuShow() {
          this.deselectCell();
        }
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Insert column right", when clicking on a row header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_left tbody tr').eq(0).find('th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Insert column right", when clicking on a corner header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(3);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Insert column left", when there\'s nothing selected', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        beforeContextMenuShow() {
          this.deselectCell();
        }
      });

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Insert column left", when clicking on a row header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_left tbody tr').eq(0).find('th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2);

      expect(item.hasClass('htDisabled')).toBe(true);
    });

    it('should display a disabled entry for "Insert column left", when clicking on a corner header', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100,
        colHeaders: true,
        rowHeaders: true
      });

      contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

      const item = $('.htContextMenu .ht_master .htCore').find('tbody td').not('.htSeparator').eq(2);

      expect(item.hasClass('htDisabled')).toBe(true);
    });
  });
});
