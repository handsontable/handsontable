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
    it('should insert row below through row header when all columns are trimmed (using columns option)', () => {
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
          .eq(1); // "Insert row below"

        simulateClick(item);
      }

      // Currently HoT doesn't support row headers shift as it support columns.
      // Should be `['A', 'B', 2, 'C', 'D', 'E']`.
      expect(getRowHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 6]);

      contextMenu(getCell(5, -1));

      {
        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(1); // "Insert row below"

        simulateClick(item);
      }

      // Currently HoT doesn't support row headers shift as it support columns.
      // Should be `['A', 'B', 2, 'C', 'D', 'E', 6]`.
      expect(getRowHeader()).toEqual(['A', 'B', 'C', 'D', 'E', 6, 7]);
    });

    it('should insert row below the clicked row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(1); // "Insert row below"

      simulateClick(item);

      expect(getDataAtCol(0)).toEqual(['A1', 'A2', null, 'A3', 'A4', 'A5']);
    });

    it('should insert row below the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(1); // "Insert row below"

      simulateClick(item);

      expect(getDataAtCol(0)).toEqual(['A1', 'A2', null, 'A3', 'A4', 'A5']);
    });

    it('should insert row below the clicked corner', () => {
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
        .eq(1); // "Insert row below"

      simulateClick(item);

      expect(getDataAtCol(0)).toEqual([null, 'A1', 'A2', 'A3', 'A4', 'A5']);
      expect(`
        |   ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
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
          .eq(1); // "Insert row below"

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
          .eq(1); // "Insert row below"

        expect(item.hasClass('htDisabled')).toBe(false);
      });

      it('should display an enabled entry, when clicking on a corner header when there are no cells visible', () => {
        handsontable({
          data: Handsontable.helper.createSpreadsheetData(0, 0),
          contextMenu: true,
          height: 100,
          colHeaders: true,
          rowHeaders: true,
        });

        contextMenu(spec().$container.find('.ht_clone_top_left_corner thead th').eq(0));

        const item = $('.htContextMenu .ht_master .htCore tbody')
          .find('td')
          .not('.htSeparator')
          .eq(1); // "Insert row below"

        expect(item.hasClass('htDisabled')).toBe(false);
      });
    });
  });
});
