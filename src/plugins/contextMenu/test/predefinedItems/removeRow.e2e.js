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

  describe('remove rows', () => {
    it('should not remove row when the menu is triggered by column header', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
    });

    it('should remove row of the clicked row header', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A3', 'A4', 'A5']);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | * ║ A : 0 : 0 : 0 : 0 |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should remove all rows when the menu is triggered by corner', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([]);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove rows when the menu is triggered by corner and all rows are trimmed', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        `).toBeMatchToSelectionPattern();
    });

    it('should remove all rows when the menu is triggered by corner and all columns are trimmed', () => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([]);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove rows when the menu is triggered by corner and dataset is empty', () => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should remove row from the single cell', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A3', 'A4', 'A5']);
      expect(`
        |   ║   : - :   :   :   |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   : # :   :   :   |
        |   ║   :   :   :   :   |
        |   ║   :   :   :   :   |
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A1', 'A2']);
      expect(`
        |   ║   :   : - : - : - |
        |===:===:===:===:===:===|
        |   ║   :   :   :   :   |
        | - ║   :   : A : 0 : 0 |
        `).toBeMatchToSelectionPattern();
    });

    it('should remove rows from the non-contiques selection range', () => {
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
        .eq(4); // "Remove row"

      simulateClick(item);

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtCol(0)).toEqual(['A7']);
      expect(`
        |   ║   :   :   :   : - :   :   :   |
        |===:===:===:===:===:===:===:===:===|
        | - ║   :   :   :   : # :   :   :   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not shift invalid row when removing a single row', async() => {
      const hot = handsontable({
        data: [
          ['aaa', 2],
          ['bbb', 3],
          ['ccc', 4],
          ['ddd', 'string'],
          ['eee', 6],
        ],
        contextMenu: true,
        columns(column) {
          if (column === 1) {
            return {
              column,
              type: 'numeric'
            };
          }

          return {};
        }
      });

      hot.validateCells();

      await sleep(150);

      selectCell(1, 1);
      contextMenu();

      const item = $('.htContextMenu .ht_master .htCore tbody')
        .find('td')
        .not('.htSeparator')
        .eq(4); // "Remove row"

      simulateClick(item);

      expect($(hot.getCell(2, 1)).hasClass('htInvalid')).toBeTruthy();
    });
  });
});
