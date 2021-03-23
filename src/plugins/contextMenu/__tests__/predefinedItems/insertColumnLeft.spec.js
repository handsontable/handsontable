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

  describe('insert column left', () => {
    it('should insert column on the left of the clicked column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║   :   : * :   :   :   |
        |===:===:===:===:===:===:===|
        | - ║   :   : A :   :   :   |
        | - ║   :   : 0 :   :   :   |
        | - ║   :   : 0 :   :   :   |
        | - ║   :   : 0 :   :   :   |
        | - ║   :   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column when the menu is triggered by row header for object-based dataset', () => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, 1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║   : * :   :   :   |
        |===:===:===:===:===:===|
        | - ║   : A :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        | - ║   : 0 :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column when the menu is triggered by row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should insert column on the left when the menu is triggered by corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
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

    it('should not insert column when the menu is triggered by corner for object-based dataset', () => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║ * : * : * : * : * |
        |===:===:===:===:===:===|
        | * ║ A : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        | * ║ 0 : 0 : 0 : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the left when the menu is triggered by corner and all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: [1, 2, 3, 4, 5],
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getColHeader()).toEqual(['A', 1, 2, 3, 4, 5]);
      expect(`
        |   ║ - : - : - : - : - : - |
        |===:===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column on the left when the menu is triggered by corner and all columns are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        | - |
        | - |
        | - |
        | - |
        | - |
        `).toBeMatchToSelectionPattern();
    });

    it('should not insert column on the left when the menu is triggered by corner and dataset is empty', () => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should insert column on the left of the clicked cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(1, 1));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(2); // "Insert column left"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', null, 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║   :   : - :   :   :   |
        |===:===:===:===:===:===:===|
        |   ║   :   :   :   :   :   |
        | - ║   :   : # :   :   :   |
        |   ║   :   :   :   :   :   |
        |   ║   :   :   :   :   :   |
        |   ║   :   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    describe('UI', () => {
      it('should display a disabled entry, when there\'s nothing selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
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
          .eq(2); // "Insert column left"

        expect(item.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
