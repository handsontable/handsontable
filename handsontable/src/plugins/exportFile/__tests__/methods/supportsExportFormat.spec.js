import ExcelJS from 'exceljs';

describe('ExportFile `supportsExportFormat` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return true for `csv` with no engine configured', async() => {
    handsontable();

    expect(getPlugin('exportFile').supportsExportFormat('csv')).toBe(true);
  });

  it('should return false for `xlsx` when no engine is configured', async() => {
    handsontable();

    expect(getPlugin('exportFile').supportsExportFormat('xlsx')).toBe(false);
  });

  it('should return true for `xlsx` when an xlsx engine is configured in settings', async() => {
    handsontable({ exportFile: { engines: { xlsx: ExcelJS } } });

    expect(getPlugin('exportFile').supportsExportFormat('xlsx')).toBe(true);
  });

  it('should return false for an unknown format', async() => {
    handsontable();

    expect(getPlugin('exportFile').supportsExportFormat('ods')).toBe(false);
  });
});
