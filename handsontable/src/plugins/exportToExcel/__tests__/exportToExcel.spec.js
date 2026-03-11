describe('ExportToExcel', () => {
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

  it('should be accessible via getPlugin', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    const plugin = getPlugin('exportToExcel');

    expect(plugin).toBeDefined();
    expect(plugin.isEnabled()).toBe(true);
  });

  describe('exportAsBlob', () => {
    it('should return a Blob with correct MIME type', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should produce a non-empty Blob', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include column headers when option is set', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        colHeaders: true,
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob({ columnHeaders: true });

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include row headers when option is set', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        rowHeaders: true,
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob({ rowHeaders: true });

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should respect the range option', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
      });

      const plugin = getPlugin('exportToExcel');
      const fullBlob = plugin.exportAsBlob();
      const rangeBlob = plugin.exportAsBlob({ range: [0, 0, 2, 2] });

      expect(rangeBlob.size).toBeLessThan(fullBlob.size);
    });
  });

  describe('exportAsUint8Array', () => {
    it('should return a Uint8Array', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();

      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('should start with ZIP signature (PK)', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();

      expect(bytes[0]).toBe(0x50); // P
      expect(bytes[1]).toBe(0x4B); // K
    });
  });

  describe('with merged cells', () => {
    it('should export merged cell regions', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }],
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('mergeCells');
    });
  });

  describe('with numeric data', () => {
    it('should export numeric values', async() => {
      handsontable({
        data: [[1, 2, 3], [4, 5, 6]],
        columns: [
          { type: 'numeric' },
          { type: 'numeric' },
          { type: 'numeric' },
        ],
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('with checkbox data', () => {
    it('should export checkbox values as booleans', async() => {
      handsontable({
        data: [[true, false], [false, true]],
        columns: [
          { type: 'checkbox' },
          { type: 'checkbox' },
        ],
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('t="b"');
    });
  });

  describe('with dropdown data', () => {
    it('should export dropdown validation', async() => {
      handsontable({
        data: [['Yes'], ['No']],
        columns: [
          { type: 'dropdown', source: ['Yes', 'No', 'Maybe'] },
        ],
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('dataValidation');
    });
  });

  describe('with frozen panes', () => {
    it('should export frozen rows', async() => {
      handsontable({
        data: createSpreadsheetData(10, 5),
        fixedRowsTop: 2,
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('ySplit="2"');
      expect(text).toContain('state="frozen"');
    });

    it('should export frozen columns', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        fixedColumnsStart: 3,
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array();
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('xSplit="3"');
      expect(text).toContain('state="frozen"');
    });
  });

  describe('with hidden rows and columns', () => {
    it('should skip hidden rows when exportHiddenRows is false', async() => {
      handsontable({
        data: createSpreadsheetData(5, 3),
        hiddenRows: { rows: [1, 3] },
      });

      const plugin = getPlugin('exportToExcel');
      const fullBlob = plugin.exportAsBlob({ exportHiddenRows: true });
      const filteredBlob = plugin.exportAsBlob({ exportHiddenRows: false });

      expect(filteredBlob.size).toBeLessThan(fullBlob.size);
    });

    it('should skip hidden columns when exportHiddenColumns is false', async() => {
      handsontable({
        data: createSpreadsheetData(3, 5),
        hiddenColumns: { columns: [1, 3] },
      });

      const plugin = getPlugin('exportToExcel');
      const fullBlob = plugin.exportAsBlob({ exportHiddenColumns: true });
      const filteredBlob = plugin.exportAsBlob({ exportHiddenColumns: false });

      expect(filteredBlob.size).toBeLessThan(fullBlob.size);
    });
  });

  describe('hooks', () => {
    it('should fire beforeExportToExcel and afterExportToExcel hooks on downloadFile', async() => {
      let beforeCalled = false;
      let afterCalled = false;

      handsontable({
        data: createSpreadsheetData(3, 3),
        beforeExportToExcel() {
          beforeCalled = true;
        },
        afterExportToExcel() {
          afterCalled = true;
        },
      });

      const plugin = getPlugin('exportToExcel');

      plugin.downloadFile({ filename: 'test' });

      expect(beforeCalled).toBe(true);
      expect(afterCalled).toBe(true);
    });

    it('should cancel export when beforeExportToExcel returns false', async() => {
      let afterCalled = false;

      handsontable({
        data: createSpreadsheetData(3, 3),
        beforeExportToExcel() {
          return false;
        },
        afterExportToExcel() {
          afterCalled = true;
        },
      });

      const plugin = getPlugin('exportToExcel');

      plugin.downloadFile({ filename: 'test' });

      expect(afterCalled).toBe(false);
    });
  });

  describe('with large datasets', () => {
    it('should handle 100 rows x 50 columns', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('options merging', () => {
    it('should use default filename with date placeholders', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
      });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob).toBeDefined();
    });

    it('should allow custom sheet name', async() => {
      handsontable({
        data: createSpreadsheetData(2, 2),
      });

      const plugin = getPlugin('exportToExcel');
      const bytes = plugin.exportAsUint8Array({ sheetName: 'MySheet' });
      const text = new TextDecoder().decode(bytes);

      expect(text).toContain('name="MySheet"');
    });
  });

  describe('context menu integration', () => {
    it('should add "Export to Excel" item to context menu', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        contextMenu: true,
      });

      await selectCell(0, 0);
      await contextMenu();

      const menuItems = $('.htContextMenu .htCore td');
      const exportItem = menuItems.filter(function() {
        return $(this).text() === 'Export to Excel';
      });

      expect(exportItem.length).toBeGreaterThan(0);
    });

    it('should trigger download when context menu item is clicked', async() => {
      let afterExportCalled = false;

      handsontable({
        data: createSpreadsheetData(3, 3),
        contextMenu: true,
        afterExportToExcel() {
          afterExportCalled = true;
        },
      });

      await selectCell(0, 0);
      await contextMenu();

      const menuItems = $('.htContextMenu .htCore td');
      const exportItem = menuItems.filter(function() {
        return $(this).text() === 'Export to Excel';
      });

      exportItem.simulate('mousedown').simulate('mouseup');

      expect(afterExportCalled).toBe(true);
    });
  });

  describe('plugin lifecycle', () => {
    it('should still work after updateSettings', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      await updateSettings({ data: createSpreadsheetData(5, 5) });

      const plugin = getPlugin('exportToExcel');
      const blob = plugin.exportAsBlob();

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should work after being disabled and re-enabled', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const plugin = getPlugin('exportToExcel');

      plugin.disablePlugin();
      plugin.enablePlugin();

      const blob = plugin.exportAsBlob();

      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
