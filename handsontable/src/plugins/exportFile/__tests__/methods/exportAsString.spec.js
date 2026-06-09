import ExcelJS from 'exceljs';

describe('ExportFile `exportAsString` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should create formatter class and call `export` method on it', async() => {
    handsontable();
    const plugin = getPlugin('exportFile');
    const formatter = jasmine.createSpyObj('formatter', ['export']);

    formatter.export.and.returnValue('foo;bar');
    spyOn(plugin, '_createTypeFormatter').and.returnValue(formatter);

    const result = plugin.exportAsString('csv', { colHeaders: true });

    expect(plugin._createTypeFormatter).toHaveBeenCalledWith('csv', { colHeaders: true });
    expect(formatter.export).toHaveBeenCalled();
    expect(result).toBe('foo;bar');
  });

  it('should throw when called for the xlsx format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    expect(() => getPlugin('exportFile').exportAsString('xlsx')).toThrow();
  });
});
