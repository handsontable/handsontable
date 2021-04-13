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
    it('should increase fixedColumnsLeft setting', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });
      const plugin = hot.getPlugin('manualColumnFreeze');

      plugin.freezeColumn(4);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
    });

    it('should freeze (make fixed) the column provided as an argument', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });

      const plugin = hot.getPlugin('manualColumnFreeze');

      plugin.freezeColumn(5);

      expect(hot.toPhysicalColumn(0)).toEqual(5);
    });

    it('should keep proper frozen column after updateSettings', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
      });

      getPlugin('manualColumnFreeze').freezeColumn(4);

      updateSettings({});

      expect(getDataAtCell(0, 0)).toBe('E1');
    });
  });

  describe('unfreezeColumn', () => {
    it('should decrease fixedColumnsLeft setting', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 1
      });
      const plugin = hot.getPlugin('manualColumnFreeze');

      plugin.unfreezeColumn(0);
      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);
    });

    it('should unfreeze (make non-fixed) the column provided as an argument', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 3
      });

      const plugin = hot.getPlugin('manualColumnFreeze');

      plugin.unfreezeColumn(1);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(hot.toPhysicalColumn(0)).toEqual(0);
      expect(hot.toPhysicalColumn(1)).toEqual(2);
      expect(hot.toPhysicalColumn(2)).toEqual(1);
      expect(hot.toPhysicalColumn(3)).toEqual(3);

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      expect(hot.toPhysicalColumn(0)).toEqual(2);
      expect(hot.toPhysicalColumn(1)).toEqual(0);
      expect(hot.toPhysicalColumn(2)).toEqual(1);
      expect(hot.toPhysicalColumn(3)).toEqual(3);

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);

      expect(hot.toPhysicalColumn(0)).toEqual(2);
      expect(hot.toPhysicalColumn(1)).toEqual(0);
      expect(hot.toPhysicalColumn(2)).toEqual(1);
      expect(hot.toPhysicalColumn(3)).toEqual(3);
    });

    it('should unfreeze the last column', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });

      const plugin = hot.getPlugin('manualColumnFreeze');

      plugin.freezeColumn(9);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      expect(hot.toPhysicalColumn(0)).toEqual(9);
      expect(hot.toPhysicalColumn(9)).toEqual(8);

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);
      expect(hot.toPhysicalColumn(0)).toEqual(9);
      expect(hot.toPhysicalColumn(1)).toEqual(0);
      expect(hot.toPhysicalColumn(2)).toEqual(1);
      expect(hot.toPhysicalColumn(9)).toEqual(8);
    });
  });

  describe('functionality', () => {

    it('should add a \'freeze column\' context menu entry for non-fixed columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true
      });

      selectCell(1, 1);
      contextMenu();

      const freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Freeze column';

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it('should add a \'unfreeze column\' context menu entry for fixed columns', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        contextMenu: true,
        fixedColumnsLeft: 2
      });

      selectCell(1, 1);
      contextMenu();

      const freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';

      });

      expect(freezeEntry.size()).toEqual(1);
    });

    it('should fix the desired column after clicking the \'freeze column\' context menu entry', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 1,
        contextMenu: true
      });

      selectCell(1, 3);

      const dataAtCell = hot.getDataAtCell(1, 3);

      contextMenu();

      const freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        if ($(this).text() === 'Freeze column') {
          return true;
        }

        return false;
      });

      expect(freezeEntry.size()).toEqual(1);
      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(hot.getDataAtCell(1, 1)).toEqual(dataAtCell);

    });

    it('should unfix the desired column (and place it on the first position after frozen columns) after clicking the \'unfreeze column\' context menu entry', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 3,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
        contextMenu: true,
        rowHeaders: true
      });

      expect(getDataAtRow(1)).toEqual(['A2', 'C2', 'F2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      selectCell(1, 1);
      contextMenu();

      let freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(getDataAtRow(1)).toEqual(['A2', 'F2', 'C2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      selectCell(1, 0);
      contextMenu();

      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        if ($(this).text() === 'Unfreeze column') {
          return true;
        }

        return false;
      });
      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      expect(getDataAtRow(1)).toEqual(['F2', 'A2', 'C2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      selectCell(1, 2);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Freeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(getDataAtRow(1)).toEqual(['F2', 'C2', 'A2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);

      selectCell(1, 0);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';
      });

      freezeEntry.eq(0).simulate('mousedown').simulate('mouseup');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      expect(getDataAtRow(1)).toEqual(['C2', 'F2', 'A2', 'D2', 'E2', 'B2', 'G2', 'H2', 'I2', 'J2']);
    });
  });

  describe('Cooperation with the `ManualColumnMove` plugin', () => {
    it('should not allow to move any column before the "freeze line" - moving already frozen column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
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

    it('should not allow to move any column before the "freeze line" - moving not frozen column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
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

    it('should not allow to move frozen column', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
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
