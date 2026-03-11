describe('exportExcel', () => {
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

  it('should have prepared default options', async() => {
    handsontable();

    const xlsx = getPlugin('exportExcel')._createFormatter();

    expect(xlsx.options.filename).toMatch(/Handsontable \d+-\d+-\d+/);
    expect(xlsx.options.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(xlsx.options.fileExtension).toBe('xlsx');
    expect(xlsx.options.columnHeaders).toBe(false);
    expect(xlsx.options.rowHeaders).toBe(false);
    expect(xlsx.options.exportHiddenColumns).toBe(false);
    expect(xlsx.options.exportHiddenRows).toBe(false);
    expect(xlsx.options.range).toEqual([]);
    expect(xlsx.options.formulas).toBe(false);
    expect(xlsx.options.sheetName).toBe('Sheet1');
  });

  it('should create formatter class and call `export` method through `exportAsBlob`', async() => {
    handsontable();
    const plugin = getPlugin('exportExcel');
    const formatter = jasmine.createSpy('formatter');

    formatter.options = { mimeType: 'application/foo' };
    spyOn(plugin, '_createFormatter').and.returnValue(formatter);
    spyOn(plugin, '_createBlob').and.returnValue('blob');

    const result = plugin.exportAsBlob({ columnHeaders: true });

    expect(plugin._createFormatter).toHaveBeenCalledWith({ columnHeaders: true });
    expect(plugin._createBlob).toHaveBeenCalledWith(formatter);
    expect(result).toBe('blob');
  });

  it('should create blob object that contains XLSX bytes', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
    });
    const plugin = getPlugin('exportExcel');
    const formatter = plugin._createFormatter();
    const blob = plugin._createBlob(formatter);

    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(0);
  });
});
