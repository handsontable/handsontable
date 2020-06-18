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

  describe('insert row below', () => {
    describe('UI', () => {
      it('should display a disabled entry, when there\'s nothing selected', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        contextMenu();

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(1); // "Insert row below"

        simulateClick(item);

        expect(item.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when clicking on a column header', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          colHeaders: true,
          rowHeaders: true
        });

        contextMenu(spec().$container.find('.ht_clone_top thead th').eq(1));

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(1); // "Insert row below"

        simulateClick(item);

        expect(item.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when clicking on a corner header', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          colHeaders: true,
          rowHeaders: true
        });

        contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(1); // "Insert row below"

        simulateClick(item);

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
