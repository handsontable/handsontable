describe('manualColumnFreeze', () => {
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

  describe('freezeColumn', () => {
    it('should not throw an exception when the "fixedColumnsLeft" option is used', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        fixedColumnsLeft: 2,
        manualColumnFreeze: true
      });
      const plugin = getPlugin('manualColumnFreeze');

      expect(() => {
        plugin.freezeColumn(4);
      }).not.toThrowWithCause(undefined, { handsontable: true });
    });

    it('should increase fixedColumnsStart setting', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });
      const plugin = getPlugin('manualColumnFreeze');

      plugin.freezeColumn(4);

      expect(getSettings().fixedColumnsStart).toEqual(1);
    });

    it('should freeze (make fixed) the column provided as an argument', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });

      const plugin = getPlugin('manualColumnFreeze');

      plugin.freezeColumn(5);

      expect(toPhysicalColumn(0)).toEqual(5);
    });

    it('should keep proper frozen column after updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
      });

      getPlugin('manualColumnFreeze').freezeColumn(4);

      await updateSettings({});

      expect(getDataAtCell(0, 0)).toBe('E1');
    });
  });

  describe('unfreezeColumn', () => {
    it('should not throw an exception when the "fixedColumnsLeft" option is used', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        fixedColumnsLeft: 2,
        manualColumnFreeze: true
      });
      const plugin = getPlugin('manualColumnFreeze');

      expect(() => {
        plugin.unfreezeColumn(0);
      }).not.toThrowWithCause(undefined, { handsontable: true });
    });

    it('should decrease fixedColumnsStart setting', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsStart: 1
      });
      const plugin = getPlugin('manualColumnFreeze');

      plugin.unfreezeColumn(0);

      expect(getSettings().fixedColumnsStart).toEqual(0);
    });

    it('should unfreeze (make non-fixed) the column provided as an argument', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsStart: 3
      });

      const plugin = getPlugin('manualColumnFreeze');

      plugin.unfreezeColumn(1);

      expect(getSettings().fixedColumnsStart).toEqual(2);
      expect(toPhysicalColumn(0)).toEqual(0);
      expect(toPhysicalColumn(1)).toEqual(2);
      expect(toPhysicalColumn(2)).toEqual(1);
      expect(toPhysicalColumn(3)).toEqual(3);

      plugin.unfreezeColumn(0);

      expect(getSettings().fixedColumnsStart).toEqual(1);
      expect(toPhysicalColumn(0)).toEqual(2);
      expect(toPhysicalColumn(1)).toEqual(0);
      expect(toPhysicalColumn(2)).toEqual(1);
      expect(toPhysicalColumn(3)).toEqual(3);

      plugin.unfreezeColumn(0);

      expect(getSettings().fixedColumnsStart).toEqual(0);

      expect(toPhysicalColumn(0)).toEqual(2);
      expect(toPhysicalColumn(1)).toEqual(0);
      expect(toPhysicalColumn(2)).toEqual(1);
      expect(toPhysicalColumn(3)).toEqual(3);
    });

    it('should unfreeze the last column', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });

      const plugin = getPlugin('manualColumnFreeze');

      plugin.freezeColumn(9);

      expect(getSettings().fixedColumnsStart).toEqual(1);
      expect(toPhysicalColumn(0)).toEqual(9);
      expect(toPhysicalColumn(9)).toEqual(8);

      plugin.unfreezeColumn(0);

      expect(getSettings().fixedColumnsStart).toEqual(0);
      expect(toPhysicalColumn(0)).toEqual(9);
      expect(toPhysicalColumn(1)).toEqual(0);
      expect(toPhysicalColumn(2)).toEqual(1);
      expect(toPhysicalColumn(9)).toEqual(8);
    });
  });

  describe('functionality', () => {
    it('should add a \'freeze column\' context menu entry for non-fixed columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true
      });

      await selectCell(1, 1);
      await contextMenu();

      const freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Freeze column';

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it('should add a \'unfreeze column\' context menu entry for fixed columns', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true,
        fixedColumnsStart: 2
      });

      await selectCell(1, 1);
      await contextMenu();

      const freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it('should fix the desired column after clicking the \'freeze column\' context menu entry', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsStart: 1,
        contextMenu: true
      });

      await selectCell(1, 3);

      const dataAtCell = getDataAtCell(1, 3);

      await contextMenu();

      const freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        if ($(this).text() === 'Freeze column') {
          return true;
        }

        return false;
      });

      expect(freezeEntry.size()).toEqual(1);
      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(getSettings().fixedColumnsStart).toEqual(2);
      expect(getDataAtCell(1, 1)).toEqual(dataAtCell);

    });

    it('should unfix the desired column (and place it on the first position after frozen columns) after clicking the \'unfreeze column\' context menu entry', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsStart: 3,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
        contextMenu: true,
        rowHeaders: true
      });

      expect(getDataAtRow(1)).toEqual(['A2', 'C2', 'F2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      await selectCell(1, 1);
      await contextMenu();

      let freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(getSettings().fixedColumnsStart).toEqual(2);
      expect(getDataAtRow(1)).toEqual(['A2', 'F2', 'C2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      await selectCell(1, 0);
      await contextMenu();

      freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        if ($(this).text() === 'Unfreeze column') {
          return true;
        }

        return false;
      });
      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(getSettings().fixedColumnsStart).toEqual(1);
      expect(getDataAtRow(1)).toEqual(['F2', 'A2', 'C2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      await selectCell(1, 2);
      await contextMenu();
      freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Freeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(getSettings().fixedColumnsStart).toEqual(2);
      expect(getDataAtRow(1)).toEqual(['F2', 'C2', 'A2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      await selectCell(1, 0);
      await contextMenu();
      freezeEntry = $(getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(getSettings().fixedColumnsStart).toEqual(1);
      expect(getDataAtRow(1)).toEqual(['C2', 'F2', 'A2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);
    });
  });

  describe('Cooperation with the `ManualColumnMove` plugin', () => {
    it('should not allow to move any column before the "freeze line" - moving already frozen column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        manualColumnFreeze: true,
        manualColumnMove: true
      });

      const data = getData();
      const manualColumnFreezePlugin = getPlugin('manualColumnFreeze');

      manualColumnFreezePlugin.freezeColumn(0);
      manualColumnFreezePlugin.freezeColumn(1);

      const manualColumnMovePlugin = getPlugin('manualColumnMove');

      manualColumnMovePlugin.moveColumn(1, 0);

      expect(getData()).toEqual(data);
    });

    it('should not allow to move any column before the "freeze line" - moving not frozen column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        manualColumnFreeze: true,
        manualColumnMove: true
      });

      const data = getData();
      const manualColumnFreezePlugin = getPlugin('manualColumnFreeze');

      manualColumnFreezePlugin.freezeColumn(0);
      manualColumnFreezePlugin.freezeColumn(1);

      const manualColumnMovePlugin = getPlugin('manualColumnMove');

      manualColumnMovePlugin.moveColumn(3, 0);

      expect(getData()).toEqual(data);
    });

    it('should not allow to move frozen column', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        manualColumnFreeze: true,
        manualColumnMove: true
      });

      const data = getData();
      const manualColumnFreezePlugin = getPlugin('manualColumnFreeze');

      manualColumnFreezePlugin.freezeColumn(0);
      manualColumnFreezePlugin.freezeColumn(1);

      const manualColumnMovePlugin = getPlugin('manualColumnMove');

      manualColumnMovePlugin.moveColumn(0, 3);

      expect(getData()).toEqual(data);
    });
  });
});
