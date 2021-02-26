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

  describe('remove columns', () => {
    it('should remove column of the clicked column header', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║   : * :   :   |
        |===:===:===:===:===|
        | - ║   : A :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        | - ║   : 0 :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove column when the menu is triggered by row header', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should remove all columns when the menu is triggered by corner (dataset as an array of arrays)', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([]);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove all columns when the menu is triggered by corner (dataset as an array of objects)', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
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

    it('should remove all columns when the menu is triggered by corner and all rows are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([]);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove columns when the menu is triggered by corner and all columns are trimmed', () => {
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
        .eq(5); // "Remove column"

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

    it('should not remove columns when the menu is triggered by corner and dataset is empty', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should remove column from the single cell', () => {
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
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'C1', 'D1', 'E1']);
      expect(`
        |   ║   : - :   :   |
        |===:===:===:===:===|
        |   ║   :   :   :   |
        | - ║   : # :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        |   ║   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should remove rows from the multiple selection range', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      selectCell(2, 2, 4, 4);
      contextMenu(getCell(2, 2));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1']);
      expect(`
        |   ║   : - |
        |===:===:===|
        |   ║   :   |
        |   ║   :   |
        | - ║   : A |
        | - ║   : 0 |
        | - ║   : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should remove columns from the non-contiques selection range', () => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      $(getCell(0, 0)).simulate('mousedown');
      $(getCell(1, 0)).simulate('mouseover');
      $(getCell(1, 0)).simulate('mouseup');

      keyDown('ctrl');

      $(getCell(2, 1)).simulate('mousedown');
      $(getCell(2, 1)).simulate('mouseover');
      $(getCell(2, 1)).simulate('mouseup');

      $(getCell(0, 3)).simulate('mousedown');
      $(getCell(5, 3)).simulate('mouseover');
      $(getCell(5, 3)).simulate('mouseup');

      $(getCell(5, 0)).simulate('mousedown');
      $(getCell(5, 4)).simulate('mouseover');
      $(getCell(5, 4)).simulate('mouseup');

      $(getCell(7, 4)).simulate('mousedown');
      $(getCell(7, 4)).simulate('mouseover');
      $(getCell(7, 4)).simulate('mouseup');

      expect(`
        |   ║ - : - : - : - : - :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║ 0 :   :   : 0 :   :   :   :   |
        | - ║ 0 :   :   : 0 :   :   :   :   |
        | - ║   : 0 :   : 0 :   :   :   :   |
        | - ║   :   :   : 0 :   :   :   :   |
        | - ║   :   :   : 0 :   :   :   :   |
        | - ║ 0 : 0 : 0 : 1 : 0 :   :   :   |
        |   ║   :   :   :   :   :   :   :   |
        | - ║   :   :   :   : A :   :   :   |
        `).toBeMatchToSelectionPattern();

      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(5); // "Remove column"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['F1', 'G1', 'H1']);
      expect(`
        |   ║   :   : - |
        |===:===:===:===|
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        |   ║   :   :   |
        | - ║   :   : # |
        `).toBeMatchToSelectionPattern();
    });
  });
});
