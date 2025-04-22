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

  describe('alignment', () => {
    it('should align single cell text left', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Left');

      expect(getCellMeta(0, 0).className).toEqual('htLeft');
      expect(getCell(0, 0).className).toContain('htLeft');
    });

    it('should align multiple cells text left (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Left');

      expect(getCellMeta(0, 0).className).toEqual('htLeft');
      expect(getCell(0, 0).className).toContain('htLeft');
      expect(getCellMeta(1, 1).className).toEqual('htLeft');
      expect(getCell(1, 1).className).toContain('htLeft');
    });

    it('should align multiple cells text left (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Left');

      expect(getCellMeta(0, 0).className).toEqual('htLeft');
      expect(getCell(0, 0).className).toContain('htLeft');
      expect(getCellMeta(1, 1).className).toEqual('htLeft');
      expect(getCell(1, 1).className).toContain('htLeft');
    });

    it('should align single cell text center', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Center');

      expect(getCellMeta(0, 0).className).toEqual('htCenter');
      expect(getCell(0, 0).className).toContain('htCenter');
    });

    it('should align multiple cells text center (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Center');

      expect(getCellMeta(0, 0).className).toEqual('htCenter');
      expect(getCell(0, 0).className).toContain('htCenter');
      expect(getCellMeta(1, 1).className).toEqual('htCenter');
      expect(getCell(1, 1).className).toContain('htCenter');
    });

    it('should align multiple cells text center (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Center');

      expect(getCellMeta(0, 0).className).toEqual('htCenter');
      expect(getCell(0, 0).className).toContain('htCenter');
      expect(getCellMeta(1, 1).className).toEqual('htCenter');
      expect(getCell(1, 1).className).toContain('htCenter');
    });

    it('should align single cell text right', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Right');

      expect(getCellMeta(0, 0).className).toEqual('htRight');
      expect(getCell(0, 0).className).toContain('htRight');
    });

    it('should align multiple cells text right (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Right');

      expect(getCellMeta(0, 0).className).toEqual('htRight');
      expect(getCell(0, 0).className).toContain('htRight');
      expect(getCellMeta(1, 1).className).toEqual('htRight');
      expect(getCell(1, 1).className).toContain('htRight');
    });

    it('should align multiple cells text right (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Right');

      expect(getCellMeta(0, 0).className).toEqual('htRight');
      expect(getCell(0, 0).className).toContain('htRight');
      expect(getCellMeta(1, 1).className).toEqual('htRight');
      expect(getCell(1, 1).className).toContain('htRight');
    });

    it('should justify single cell text', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Justify');

      expect(getCellMeta(0, 0).className).toEqual('htJustify');
      expect(getCell(0, 0).className).toContain('htJustify');
    });

    it('should justify multiple cells text (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Justify');

      expect(getCellMeta(0, 0).className).toEqual('htJustify');
      expect(getCell(0, 0).className).toContain('htJustify');
      expect(getCellMeta(1, 1).className).toEqual('htJustify');
      expect(getCell(1, 1).className).toContain('htJustify');
    });

    it('should justify multiple cells text (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Justify');

      expect(getCellMeta(0, 0).className).toEqual('htJustify');
      expect(getCell(0, 0).className).toContain('htJustify');
      expect(getCellMeta(1, 1).className).toEqual('htJustify');
      expect(getCell(1, 1).className).toContain('htJustify');
    });

    it('should vertical align text top of the single cell', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Top');

      expect(getCellMeta(0, 0).className).toEqual('htTop');
      expect(getCell(0, 0).className).toContain('htTop');
    });

    it('should vertical align text top of the multiple cells (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Top');

      expect(getCellMeta(0, 0).className).toEqual('htTop');
      expect(getCell(0, 0).className).toContain('htTop');
      expect(getCellMeta(1, 1).className).toEqual('htTop');
      expect(getCell(1, 1).className).toContain('htTop');
    });

    it('should vertical align text top of the multiple cells (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Top');

      expect(getCellMeta(0, 0).className).toEqual('htTop');
      expect(getCell(0, 0).className).toContain('htTop');
      expect(getCellMeta(1, 1).className).toEqual('htTop');
      expect(getCell(1, 1).className).toContain('htTop');
    });

    it('should vertical align text middle of the single cell', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Middle');

      expect(getCellMeta(0, 0).className).toEqual('htMiddle');
      expect(getCell(0, 0).className).toContain('htMiddle');
    });

    it('should vertical align text middle of the multiple cells (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Middle');

      expect(getCellMeta(0, 0).className).toEqual('htMiddle');
      expect(getCell(0, 0).className).toContain('htMiddle');
      expect(getCellMeta(1, 1).className).toEqual('htMiddle');
      expect(getCell(1, 1).className).toContain('htMiddle');
    });

    it('should vertical align text middle of the multiple cells (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Middle');

      expect(getCellMeta(0, 0).className).toEqual('htMiddle');
      expect(getCell(0, 0).className).toContain('htMiddle');
      expect(getCellMeta(1, 1).className).toEqual('htMiddle');
      expect(getCell(1, 1).className).toContain('htMiddle');
    });

    it('should vertical align text bottom of the single cell', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Bottom');

      expect(getCellMeta(0, 0).className).toEqual('htBottom');
      expect(getCell(0, 0).className).toContain('htBottom');
    });

    it('should vertical align text bottom of the multiple cells (selection from top-left to bottom-right)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(0, 0, 1, 1);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Bottom');

      expect(getCellMeta(0, 0).className).toEqual('htBottom');
      expect(getCell(0, 0).className).toContain('htBottom');
      expect(getCellMeta(1, 1).className).toEqual('htBottom');
      expect(getCell(1, 1).className).toContain('htBottom');
    });

    it('should vertical align text bottom of the multiple cells (selection from bottom-right to top-left)', async() => {
      handsontable({
        data: createSpreadsheetData(4, 4),
        contextMenu: true,
        height: 100
      });

      selectCell(1, 1, 0, 0);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Bottom');

      expect(getCellMeta(0, 0).className).toEqual('htBottom');
      expect(getCell(0, 0).className).toContain('htBottom');
      expect(getCellMeta(1, 1).className).toEqual('htBottom');
      expect(getCell(1, 1).className).toContain('htBottom');
    });

    it('should trigger `afterSetCellMeta` callback after changing alignment by context menu', async() => {
      const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');

      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        afterSetCellMeta: afterSetCellMetaCallback
      });

      selectCell(2, 3);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Right');

      expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'className', 'htRight');
    });

    it('should not add clasName to cell after changing alignment by context menu, if `beforeSetCellMeta` returned false', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        beforeSetCellMeta: () => false
      });

      selectCell(2, 3);
      contextMenu();

      await selectContextSubmenuOption('Alignment', 'Right');

      expect(getCellMeta(2, 3).className).toBe(undefined);
    });

    describe('UI', () => {
      it('should display a disabled entry, when there\'s nothing selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        contextMenu();

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when the column header is selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          rowHeaders: true,
          colHeaders: true,
          navigableHeaders: true,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        selectCell(-1, 1);
        contextMenu();

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when the row header is selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          rowHeaders: true,
          colHeaders: true,
          navigableHeaders: true,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        selectCell(1, -1);
        contextMenu();

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

      it('should display a disabled entry, when the corner is selected', () => {
        handsontable({
          data: createSpreadsheetData(4, 4),
          contextMenu: true,
          rowHeaders: true,
          colHeaders: true,
          navigableHeaders: true,
          beforeContextMenuShow() {
            this.deselectCell();
          }
        });

        selectCell(-1, -1);
        contextMenu();

        const readOnlyItem = $('.htContextMenu tbody tr td').filter(function() {
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });

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
          return this.textContent === 'Alignment';
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
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(false);
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
          return this.textContent === 'Alignment';
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
          return this.textContent === 'Alignment';
        });

        expect(readOnlyItem.hasClass('htDisabled')).toBe(true);
      });
    });
  });
});
