describe('ExportFile `exportAsBlobAsync` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return a Promise that resolves to a Blob for CSV', async() => {
    handsontable({ data: createSpreadsheetData(3, 3) });
    const plugin = getPlugin('exportFile');
    const result = plugin.exportAsBlobAsync('csv');

    expect(result).toEqual(jasmine.any(Promise));

    const blob = await result;

    expect(blob).toEqual(jasmine.any(Blob));
    expect(blob.type).toContain('text/csv');
  });

  it('should return a Promise that resolves to a Blob for binary formats', async() => {
    handsontable({ data: createSpreadsheetData(3, 3) });
    const plugin = getPlugin('exportFile');
    const xlsxMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const fakeBlob = new Blob(['binary'], { type: xlsxMimeType });
    const formatter = jasmine.createSpy('formatter');

    formatter.binary = true;
    spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);
    spyOn(plugin, '_createBlob').and.returnValue(Promise.resolve(fakeBlob));

    const result = plugin.exportAsBlobAsync('xlsx');

    expect(result).toEqual(jasmine.any(Promise));

    const blob = await result;

    expect(blob).toBe(fakeBlob);
  });

  it('should forward options to the formatter', async() => {
    handsontable({ data: createSpreadsheetData(3, 3) });
    const plugin = getPlugin('exportFile');
    const formatter = jasmine.createSpyObj('formatter', ['export']);

    formatter.export.and.returnValue('a,b,c');
    formatter.binary = false;
    formatter.options = { mimeType: 'text/csv', encoding: 'utf-8' };
    spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);

    await plugin.exportAsBlobAsync('csv', { colHeaders: true });

    expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', { colHeaders: true });
  });
});
