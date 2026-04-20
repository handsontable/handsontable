import ExcelJS from 'exceljs';

describe('ExportFile', () => {
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

  describe('context menu', () => {
    describe('submenu structure', () => {
      it('should show an "Export" parent item with a submenu when exportFile is configured', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        await contextMenu(getCell(1, 1));

        const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
          return $(this).text();
        }).get();

        expect(items).toContain('Export');
      });

      it('should hide the "Export" parent item when exportFile is not configured', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
        });

        await contextMenu(getCell(1, 1));

        const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
          return $(this).text();
        }).get();

        expect(items).not.toContain('Export');
      });

      it('should contain "To CSV" in the Export submenu', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        await contextMenu(getCell(1, 1));

        await openContextSubmenuOption('Export');
        await sleep(300);

        const submenuItems = $('.htContextMenuSub_Export tbody td').map(function() {
          return $(this).text();
        }).get();

        expect(submenuItems).toContain('To CSV');
      });

      it('should contain "To Excel" in the Export submenu when an engine is configured', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: { engines: { xlsx: ExcelJS } },
        });

        await contextMenu(getCell(1, 1));

        await openContextSubmenuOption('Export');
        await sleep(300);

        const submenuItems = $('.htContextMenuSub_Export tbody td').map(function() {
          return $(this).text();
        }).get();

        expect(submenuItems).toContain('To CSV');
        expect(submenuItems).toContain('To Excel');
      });

      it('should hide "To Excel" in the Export submenu when no engine is configured', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        await contextMenu(getCell(1, 1));

        await openContextSubmenuOption('Export');
        await sleep(300);

        const submenuItems = $('.htContextMenuSub_Export tbody tr:not(.htHidden) td').map(function() {
          return $(this).text();
        }).get();

        expect(submenuItems).toContain('To CSV');
        expect(submenuItems).not.toContain('To Excel');
      });
    });

    describe('export options', () => {
      it('should include colHeaders and rowHeaders when they are enabled', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          colHeaders: true,
          rowHeaders: true,
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await contextMenu(getCell(1, 1));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          colHeaders: true,
          rowHeaders: true,
        }));
      });

      it('should not include colHeaders or rowHeaders when they are not enabled', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await contextMenu(getCell(1, 1));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          colHeaders: false,
          rowHeaders: false,
        }));
      });
    });

    describe('selection range', () => {
      it('should export the entire table when a single cell is selected', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await selectCell(2, 2);
        await contextMenu(getCell(2, 2));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).not.toHaveBeenCalledWith('csv', jasmine.objectContaining({
          range: jasmine.anything(),
        }));
      });

      it('should export the selected range when multiple cells are selected', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await selectCell(1, 1, 3, 3);
        await contextMenu(getCell(2, 2));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          range: [1, 1, 3, 3],
        }));
      });

      it('should export the entire table when the corner is right-clicked', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await contextMenu(getCell(-1, -1));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          colHeaders: true,
          rowHeaders: true,
        }));
        expect(plugin.downloadFile).not.toHaveBeenCalledWith('csv', jasmine.objectContaining({
          range: jasmine.anything(),
        }));
      });

      it('should export the selected rows when a row header is right-clicked', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await selectRows(1, 3);
        await contextMenu(getCell(2, -1));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          range: [1, 0, 3, 4],
        }));
      });

      it('should export the selected columns when a column header is right-clicked', async() => {
        handsontable({
          data: createSpreadsheetData(5, 5),
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          exportFile: true,
        });

        const plugin = getPlugin('exportFile');

        spyOn(plugin, 'downloadFile');

        await selectColumns(1, 3);
        await contextMenu(getCell(-1, 2));
        await selectContextSubmenuOption('Export', 'To CSV');

        expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
          range: [0, 1, 4, 3],
        }));
      });
    });
  });
});
