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

  describe('insert column right', () => {
    it('should insert column on the right through column header when all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
      });

      contextMenu(getCell(-1, 1));

      {
        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(3); // "Insert column right"

        simulateClick(item);
      }

      expect(getColHeader()).toEqual([1, 2, 'C', 3, 4, 5]);

      contextMenu(getCell(-1, 5));

      {
        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(3); // "Insert column right"

        simulateClick(item);
      }

      expect(getColHeader()).toEqual([1, 2, 'C', 3, 4, 5, 'G']);
    });

    it('should insert column on the right through corner header when all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
      });

      contextMenu(getCell(-1, -1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(3); // "Insert column right"

      simulateClick(item);

      expect(getColHeader()).toEqual(['A', 1, 2, 3, 4, 5]);
    });

    it('should insert column on the right of the clicked column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(3); // "Insert column right"

      simulateClick(item);

      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
    });

    it('should insert column on the right of the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(3); // "Insert column right"

      simulateClick(item);

      expect(getDataAtRow(0)).toEqual(['A1', 'B1', null, 'C1', 'D1', 'E1']);
    });

    it('should insert column on the right of the clicked corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(3); // "Insert column right"

      simulateClick(item);

      expect(getDataAtRow(0)).toEqual([null, 'A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║ * : * : * : * : * : * |
        |===:===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
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
          .eq(3); // "Insert column right"

        expect(item.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when clicking on a row header', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(4, 4),
          contextMenu: true,
          height: 100,
          colHeaders: true,
          rowHeaders: true
        });

        contextMenu(spec().$container.find('.ht_clone_left tbody tr').eq(0).find('th').eq(0));

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(3); // "Insert column right"

        expect(item.hasClass('htDisabled')).toBe(true);
      });

      it('should display an enabled entry, when clicking on a corner header', () => {
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
          .eq(3); // "Insert column right"

        expect(item.hasClass('htDisabled')).toBe(false);
      });

      it('should display an enabled entry, when clicking on a corner header when there are no cells visible', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(0, 0),
          contextMenu: true,
          height: 100,
          colHeaders: true,
          rowHeaders: true,
          dataSchema: [],
        });

        contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(3); // "Insert column right"

        expect(item.hasClass('htDisabled')).toBe(false);
      });
    });
  });
});
