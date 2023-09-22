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

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

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

    it('should not remove column when the menu is triggered by focused row header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not remove column when the menu is triggered by focused corner', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should remove column when the menu is triggered by focused column header', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      selectCell(-1, 1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'C1', 'D1', 'E1']);
    });

    it('should remove all columns when the menu is triggered by corner (dataset as an array of arrays)', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      contextMenu(getCell(-1, -1, true));

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   ║ - : - : - : - : - |
        |===:===:===:===:===:===|
        | - ║ A : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
        | - ║ 0 : 0 : 0 : 0 : 0 |
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

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

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

      const item = selectContextMenuOption('Remove column');

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

      mouseDown(getCell(0, 0));
      mouseOver(getCell(1, 0));
      mouseUp(getCell(1, 0));

      keyDown('control/meta');

      mouseDown(getCell(2, 1));
      mouseOver(getCell(2, 1));
      mouseUp(getCell(2, 1));

      mouseDown(getCell(0, 3));
      mouseOver(getCell(5, 3));
      mouseUp(getCell(5, 3));

      mouseDown(getCell(5, 0));
      mouseOver(getCell(5, 4));
      mouseUp(getCell(5, 4));

      mouseDown(getCell(7, 4));
      mouseOver(getCell(7, 4));
      mouseUp(getCell(7, 4));

      keyUp('control/meta');

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

      const item = selectContextMenuOption('Remove column');

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
