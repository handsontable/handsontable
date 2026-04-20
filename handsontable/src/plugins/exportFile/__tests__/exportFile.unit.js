import { ExportFile } from '../exportFile';
import DataProvider from '../dataProvider';

function fakeCtx(exportFileSettings) {
  return { hot: { getSettings: () => ({ exportFile: exportFileSettings }) } };
}

describe('ExportFile#supportsExportFormat', () => {
  it('should return true for csv regardless of settings', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(undefined), 'csv')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), 'csv')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'csv')).toBe(true);
  });

  it('should return false for xlsx when no engines are configured', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(undefined), 'xlsx')).toBe(false);
  });

  it('should return false for xlsx when exportFile settings is not an object', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(true), 'xlsx')).toBe(false);
  });

  it('should return false for xlsx when engines map is missing', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), 'xlsx')).toBe(false);
  });

  it('should return false for xlsx when engines map does not contain an xlsx entry', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: {} }), 'xlsx')).toBe(false);
  });

  it('should return true for xlsx when an xlsx engine is configured', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'xlsx')).toBe(true);
  });

  it('should return false for an unknown format', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'pdf')).toBe(false);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), '')).toBe(false);
  });
});

describe('ExportFile#_createBlob', () => {
  it('should throw with a clear message when Blob is not available', () => {
    const savedBlob = global.Blob;

    delete global.Blob;

    try {
      expect(() => {
        ExportFile.prototype._createBlob.call({}, {
          export() { return ''; },
          options: { mimeType: 'text/csv', encoding: 'utf-8' },
        });
      }).toThrow(/Blob/);
    } finally {
      global.Blob = savedBlob;
    }
  });
});

describe('DataProvider#setOptions', () => {
  it('should support the deprecated `columnHeaders` alias', () => {
    const dataProvider = new DataProvider({});

    dataProvider.setOptions({ columnHeaders: true });

    expect(dataProvider.options.colHeaders).toBe(true);
  });

  it('should prefer `colHeaders` when both aliases are provided', () => {
    const dataProvider = new DataProvider({});

    dataProvider.setOptions({ columnHeaders: true, colHeaders: false });

    expect(dataProvider.options.colHeaders).toBe(false);
  });
});
