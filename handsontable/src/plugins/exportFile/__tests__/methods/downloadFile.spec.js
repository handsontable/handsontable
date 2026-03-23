import ExcelJS from 'exceljs';

describe('ExportFile `downloadFile` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should throw when called with a binary format', async() => {
    handsontable({
      data: [['A1']],
      exportFile: { engines: { xlsx: ExcelJS } },
    });

    expect(() => getPlugin('exportFile').downloadFile('xlsx')).toThrow();
  });
});
