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

  describe('read only', () => {
    it('should make a single selected cell read-only', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');
      expect(getCellMeta(0, 0).readOnly).toBe(false);

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(getCellMeta(0, 0).readOnly).toBe(true);
    });

    it('should make a single selected cell writable, when it\'s set to read-only', () => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0);

      expect(getDataAtCell(0, 0)).toEqual('A1');

      getCellMeta(0, 0).readOnly = true;

      selectCell(0, 0);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(getCellMeta(0, 0).readOnly).toBe(false);
    });

    it('should make a range of selected cells read-only, if all of them are writable', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      expect(hot.getCellMeta(0, 0).readOnly).toEqual(false);
      expect(hot.getCellMeta(0, 1).readOnly).toEqual(false);
      expect(hot.getCellMeta(1, 0).readOnly).toEqual(false);
      expect(hot.getCellMeta(1, 1).readOnly).toEqual(false);

      selectCell(0, 0, 2, 2);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(hot.getCellMeta(0, 0).readOnly).toEqual(true);
      expect(hot.getCellMeta(0, 1).readOnly).toEqual(true);
      expect(hot.getCellMeta(1, 0).readOnly).toEqual(true);
      expect(hot.getCellMeta(1, 1).readOnly).toEqual(true);
      expect(getSelected()).toEqual([[0, 0, 2, 2]]);
    });

    it('should make a multiple of selected cells read-only, if all of them are writable', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

      selectCell(0, 0, 2, 2);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(true);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(true);
    });

    it('should make a group of selected cells read-only, if all of them are writable (reverse selection)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

      selectCell(2, 2, 0, 0);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(true);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(true);
    });

    it('should make a group of selected cells writable if at least one of them is read-only', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

      hot.getCellMeta(1, 1).readOnly = true;

      selectCell(0, 0, 2, 2);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);
    });

    it('should make a group of selected cells writable if at least one of them is read-only (reverse selection)', () => {
      const hot = handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);

      hot.getCellMeta(1, 1).readOnly = true;

      selectCell(2, 2, 0, 0);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(0, 1).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 0).readOnly).toBe(false);
      expect(hot.getCellMeta(1, 1).readOnly).toBe(false);
    });

    it('should trigger `afterSetCellMeta` callback after changing cell to read only by context menu', () => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
      const rows = 5;
      const columns = 5;

      handsontable({
        data: Handsontable.helper.createSpreadsheetData(rows, columns),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      selectCell(2, 3);
      contextMenu();
      selectContextMenuOption('Read only');

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'readOnly', true);
    });

    it('should not change readOnly property to true after changing cell to read only by context menu, if `beforeSetCellMeta` returned false', () => {
      handsontable({
        data: Handsontable.helper.createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        beforeSetCellMeta: () => false
      });

      selectCell(2, 3);
      contextMenu();

      const changeToReadOnlyButton = $('.htItemWrapper').filter(function() {
        return this.textContent === 'Read only';
      })[0];

      $(changeToReadOnlyButton).simulate('mousedown').simulate('mouseup');

      expect(getCellMeta(2, 3).readOnly).toBe(false);
    });

    describe('UI', () => {
      it('should enable the item when all rows are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          contextMenu: true,
          hiddenRows: { // The HidingMap should be used instead of the plugin.
            rows: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
      });

      it('should enable the item when all columns are hidden', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          contextMenu: true,
          hiddenColumns: { // The HidingMap should be used instead of the plugin.
            columns: [0, 1, 2, 3, 4],
          },
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
      });

      it('should disable the item when the row header is focused', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          navigableHeaders: true,
        });

        selectCell(1, -1);
        getPlugin('contextMenu').open({ top: 0, left: 0 });

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when the column header is focused', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          navigableHeaders: true,
        });

        selectCell(-1, 1);
        getPlugin('contextMenu').open({ top: 0, left: 0 });

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when the corner is focused', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          navigableHeaders: true,
        });

        selectCell(-1, -1);
        getPlugin('contextMenu').open({ top: 0, left: 0 });

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all rows are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          contextMenu: true,
          trimRows: [0, 1, 2, 3, 4], // The TrimmingMap should be used instead of the plugin.
        });

        contextMenu(getCell(-1, 1)); // Column header "B"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should disable the item when all columns are trimmed', () => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          contextMenu: true,
          columns: [], // The TrimmingMap should be used instead of the `columns` option.
        });

        contextMenu(getCell(1, -1)); // Row header "2"

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Read only';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
