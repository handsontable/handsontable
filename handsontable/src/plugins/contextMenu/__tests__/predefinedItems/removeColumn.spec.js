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
    it('should remove column of the clicked column header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, 1, true));

      const item = await selectContextMenuOption('Remove column');

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

    it('should not remove column when the menu is triggered by row header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(1, -1, true));

      const item = await selectContextMenuOption('Remove column');

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

    it('should not remove column when the menu is triggered by focused row header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should not remove column when the menu is triggered by focused corner', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });

    it('should remove column when the menu is triggered by focused column header', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 1);
      getPlugin('contextMenu').open({ top: 0, left: 0 });

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getDataAtRow(0)).toEqual(['A1', 'C1', 'D1', 'E1']);
    });

    it('should remove all columns when the menu is triggered by corner (dataset as an array of arrays)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([[null], [null], [null], [null], [null]]);
      expect(`
        |   |
        |===|
        |   |
        |   |
        |   |
        |   |
        |   |
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove all columns when the menu is triggered by corner (dataset as an array of objects)', async() => {
      handsontable({
        data: createSpreadsheetObjectData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

      const item = await selectContextMenuOption('Remove column');

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

    it('should remove all columns when the menu is triggered by corner and all rows are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        trimRows: [0, 1, 2, 3, 4],
      });

      await contextMenu(getCell(-1, -1, true));

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(false);
      expect(getData()).toEqual([]);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should not remove columns when the menu is triggered by corner and all columns are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(5, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

      const item = await selectContextMenuOption('Remove column');

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

    it('should not remove columns when the menu is triggered by corner and dataset is empty', async() => {
      handsontable({
        data: createSpreadsheetData(0, 0),
        dataSchema: [], // Unlocks adding new rows through the context menu.
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(-1, -1, true));

      const item = await selectContextMenuOption('Remove column');

      expect(item.hasClass('htDisabled')).toBe(true);
      expect(`
        |   |
        |===|
        `).toBeMatchToSelectionPattern();
    });

    it('should remove column from the single cell', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await contextMenu(getCell(1, 1));

      const item = await selectContextMenuOption('Remove column');

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

    it('should remove rows from the multiple selection range', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await selectCell(2, 2, 4, 4);
      await contextMenu(getCell(2, 2));

      const item = await selectContextMenuOption('Remove column');

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

    it('should remove columns from the non-contiques selection range', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
      });

      await mouseDown(getCell(0, 0));
      await mouseOver(getCell(1, 0));
      await mouseUp(getCell(1, 0));

      await keyDown('control/meta');

      await mouseDown(getCell(2, 1));
      await mouseOver(getCell(2, 1));
      await mouseUp(getCell(2, 1));

      await mouseDown(getCell(0, 3));
      await mouseOver(getCell(5, 3));
      await mouseUp(getCell(5, 3));

      await mouseDown(getCell(5, 0));
      await mouseOver(getCell(5, 4));
      await mouseUp(getCell(5, 4));

      await mouseDown(getCell(7, 4));
      await mouseOver(getCell(7, 4));
      await mouseUp(getCell(7, 4));

      await keyUp('control/meta');

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

      await contextMenu();

      const item = await selectContextMenuOption('Remove column');

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
