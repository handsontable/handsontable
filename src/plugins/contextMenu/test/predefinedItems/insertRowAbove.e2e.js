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

  describe('insert row above', () => {
    it('should insert row above through row header when all columns are trimmed (using columns option)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: ['A', 'B', 'C', 'D', 'E'],
        contextMenu: true,
        columns: [], // The TrimmingMap should be used instead of the `columns` option.
      });

      contextMenu(getCell(1, -1));

      {
        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(0); // "Insert row above"

        simulateClick(item);
      }

      // Currently HoT doesn't support row headers shift as it support columns.
      // Should be `['A', 2, 'B', 'C', 'D', 'E']`.
      expect(getRowHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 6]);

      contextMenu(getCell(5, -1));

      {
        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(0); // "Insert row above"

        simulateClick(item);
      }

      // Currently HoT doesn't support row headers shift as it support columns.
      // Should be `['A', 2, 'B', 'C', 'D', 6, 'E']`.
      expect(getRowHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 6, 7]);
    });

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
          .eq(0); // "Insert row above"

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
          .eq(0); // "Insert row above"

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
          .eq(0); // "Insert row above"

        simulateClick(item);

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
