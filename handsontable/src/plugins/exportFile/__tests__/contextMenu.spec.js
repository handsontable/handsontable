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
    it('should not add export items to the context menu when `contextMenu` is not set in exportFile settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: true,
      });

      await contextMenu(getCell(1, 1));

      const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
        return $(this).text();
      }).get();

      expect(items).not.toContain('Export to CSV');
      expect(items).not.toContain('Export to Excel');
    });

    it('should not add export items to the context menu when exportFile is not configured', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
      });

      await contextMenu(getCell(1, 1));

      const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
        return $(this).text();
      }).get();

      expect(items).not.toContain('Export to CSV');
      expect(items).not.toContain('Export to Excel');
    });

    it('should add an "Export to CSV" item when `contextMenu: true` is set in exportFile settings', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      await contextMenu(getCell(1, 1));

      const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
        return $(this).text();
      }).get();

      expect(items).toContain('Export to CSV');
    });

    it('should place the export items after a separator at the bottom of the context menu', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      await contextMenu(getCell(1, 1));

      const cells = $('.htContextMenu tbody tr:not(.htHidden) td');
      const lastTwo = cells.slice(-2);

      expect(lastTwo.eq(0).hasClass('htSeparator')).toBe(true);
      expect(lastTwo.eq(1).text()).toBe('Export to CSV');
    });

    it('should hide "Export to Excel" when no ExcelJS engine is configured', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      await contextMenu(getCell(1, 1));

      const items = $('.htContextMenu tbody tr:not(.htHidden) td').map(function() {
        return $(this).text();
      }).get();

      expect(items).toContain('Export to CSV');
      expect(items).not.toContain('Export to Excel');
    });

    it('should show "Export to Excel" when an ExcelJS engine is configured', async() => {
      const mockEngine = {};

      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { engine: mockEngine, contextMenu: true },
      });

      await contextMenu(getCell(1, 1));

      const items = $('.htContextMenu tbody tr:not(.htSeparator) td').map(function() {
        return $(this).text();
      }).get();

      expect(items).toContain('Export to CSV');
      expect(items).toContain('Export to Excel');
    });

    it('should include columnHeaders and rowHeaders in export options when they are enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        colHeaders: true,
        rowHeaders: true,
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      const plugin = getPlugin('exportFile');

      spyOn(plugin, 'downloadFile');

      await contextMenu(getCell(1, 1));
      $('.htContextMenu tbody td').filter(function() {
        return $(this).text() === 'Export to CSV';
      }).simulate('mousedown').simulate('mouseup');

      expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
        columnHeaders: true,
        rowHeaders: true,
      }));
    });

    it('should not include columnHeaders or rowHeaders when they are not enabled', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      const plugin = getPlugin('exportFile');

      spyOn(plugin, 'downloadFile');

      await contextMenu(getCell(1, 1));
      $('.htContextMenu tbody td').filter(function() {
        return $(this).text() === 'Export to CSV';
      }).simulate('mousedown').simulate('mouseup');

      expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
        columnHeaders: false,
        rowHeaders: false,
      }));
    });

    it('should include the selected range in export options when a data cell is right-clicked', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      const plugin = getPlugin('exportFile');

      spyOn(plugin, 'downloadFile');

      await selectCell(1, 1, 3, 3);
      await contextMenu(getCell(2, 2));
      $('.htContextMenu tbody td').filter(function() {
        return $(this).text() === 'Export to CSV';
      }).simulate('mousedown').simulate('mouseup');

      expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
        range: [1, 1, 3, 3],
      }));
    });

    it('should not include a range in export options when the corner is right-clicked', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        exportFile: { contextMenu: true },
      });

      const plugin = getPlugin('exportFile');

      spyOn(plugin, 'downloadFile');

      await contextMenu(getCell(-1, -1));
      $('.htContextMenu tbody td').filter(function() {
        return $(this).text() === 'Export to CSV';
      }).simulate('mousedown').simulate('mouseup');

      expect(plugin.downloadFile).toHaveBeenCalledWith('csv', jasmine.objectContaining({
        columnHeaders: true,
        rowHeaders: true,
      }));
      expect(plugin.downloadFile).not.toHaveBeenCalledWith('csv', jasmine.objectContaining({
        range: jasmine.anything(),
      }));
    });
  });
});
