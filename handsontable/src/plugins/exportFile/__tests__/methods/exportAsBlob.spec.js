import ExcelJS from 'exceljs';

describe('ExportFile `exportAsBlob` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should create formatter class and create blob object contains exported value', async() => {
    handsontable();
    const plugin = getPlugin('exportFile');
    const formatter = jasmine.createSpy('formatter');

    formatter.binary = false;
    spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);
    spyOn(plugin, '_createBlob').and.returnValue('blob');

    const result = plugin.exportAsBlob('csv', { colHeaders: true });

    expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', { colHeaders: true });
    expect(plugin._createBlob).toHaveBeenCalledWith(formatter);
    expect(result).toBe('blob');
  });

  it('should return a Blob for CSV', async() => {
    handsontable({ data: createSpreadsheetData(3, 3) });
    const result = getPlugin('exportFile').exportAsBlob('csv');

    expect(result).toEqual(jasmine.any(Blob));
  });

  it('should throw when called with a binary format', async() => {
    handsontable();
    const plugin = getPlugin('exportFile');
    const formatter = { binary: true };

    spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);

    expect(() => {
      plugin.exportAsBlob('xlsx');
    }).toThrowError(/exportAsBlobAsync/);
  });

  it('should throw when called with a binary format (xlsx with engine)', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    expect(() => getPlugin('exportFile').exportAsBlob('xlsx')).toThrowError(/exportAsBlobAsync/);
  });
});
