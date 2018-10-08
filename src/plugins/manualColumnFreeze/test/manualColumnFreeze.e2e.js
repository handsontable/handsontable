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
      const movePlugin = hot.getPlugin('manualColumnMove');

      plugin.freezeColumn(5);

      expect(movePlugin.columnsMapper.getValueByIndex(0)).toEqual(5);
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
      const movePlugin = hot.getPlugin('manualColumnMove');

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(movePlugin.columnsMapper.getValueByIndex(0)).toEqual(1);
      expect(movePlugin.columnsMapper.getValueByIndex(1)).toEqual(2);
      expect(movePlugin.columnsMapper.getValueByIndex(2)).toEqual(0);
    });

    it('should unfreeze the last column', () => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true
      });

      const plugin = hot.getPlugin('manualColumnFreeze');
      const movePlugin = hot.getPlugin('manualColumnMove');

      plugin.freezeColumn(9);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      expect(movePlugin.columnsMapper.getValueByIndex(0)).toEqual(9);
      expect(movePlugin.columnsMapper.getValueByIndex(9)).toEqual(8);

      plugin.unfreezeColumn(0);

      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);
      expect(movePlugin.columnsMapper.getValueByIndex(0)).toEqual(0);
      expect(movePlugin.columnsMapper.getValueByIndex(9)).toEqual(9);
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
      freezeEntry.eq(0).simulate('mousedown');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      expect(hot.getDataAtCell(1, 1)).toEqual(dataAtCell);

    });

    it('should unfix the desired column (and revert it to it\'s original position) after clicking the \'unfreeze column\' context menu entry', async() => {
      const hot = handsontable({
        data: Handsontable.helper.createSpreadsheetData(10, 10),
        manualColumnFreeze: true,
        fixedColumnsLeft: 3,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
        contextMenu: true,
        rowHeaders: true
      });

      let dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual('A2');
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual('C2');
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual('F2');

      selectCell(1, 1);
      contextMenu();

      let freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';

      });
      freezeEntry.eq(0).simulate('mousedown');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(2);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual('A2');
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual('F2');
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual('C2');

      selectCell(1, 1);
      contextMenu();

      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        if ($(this).text() === 'Unfreeze column') {
          return true;
        }
        return false;
      });
      freezeEntry.eq(0).simulate('mousedown');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual('A2');
      dataAtCell = hot.getDataAtCell(1, 1);
      expect(dataAtCell).toEqual('C2');
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual('D2');

      dataAtCell = hot.getDataAtCell(1, 5);
      expect(dataAtCell).toEqual('F2');

      // Use the modified columns position.
      hot.updateSettings({
        fixedColumnsLeft: 0,
        manualColumnMove: [0, 2, 5, 3, 4, 1, 6, 7, 8, 9],
      });

      await sleep(300);

      hot.getSettings().fixedColumnsLeft = 0;

      selectCell(1, 2);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Freeze column';
      });

      freezeEntry.eq(0).simulate('mousedown');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(1);
      dataAtCell = hot.getDataAtCell(1, 0);
      expect(dataAtCell).toEqual('F2');

      selectCell(1, 0);
      contextMenu();
      freezeEntry = $(hot.getPlugin('contextMenu').menu.container).find('div').filter(function() {
        return $(this).text() === 'Unfreeze column';
      });

      freezeEntry.eq(0).simulate('mousedown');

      expect(hot.getSettings().fixedColumnsLeft).toEqual(0);
      dataAtCell = hot.getDataAtCell(1, 2);
      expect(dataAtCell).toEqual('F2');
    });
  });

});
