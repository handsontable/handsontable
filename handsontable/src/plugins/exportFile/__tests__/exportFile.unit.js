import { ExportFile } from '../exportFile';
import DataProvider from '../dataProvider';
import BaseType from '../types/_base';
import { normalizeExportOptions } from '../utils';
import { _resetDeprecationWarnings } from '../../../helpers/console';

beforeEach(() => {
  // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
  // `columnHeaders` assertions below would depend on the order the specs run in.
  _resetDeprecationWarnings();
});

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
  it('should print a one-time deprecation warning when `columnHeaders` is used', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const dataProvider = new DataProvider({});

    dataProvider.setOptions({ columnHeaders: true });
    dataProvider.setOptions({ columnHeaders: false });

    const deprecationCalls = warnSpy.mock.calls
      .filter(([message]) => String(message).includes('`columnHeaders`'));

    expect(deprecationCalls.length).toBe(1);
    expect(deprecationCalls[0][0]).toMatch(/^Deprecated: .*`columnHeaders`.*`colHeaders`/);

    warnSpy.mockRestore();
  });

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

describe('normalizeExportOptions', () => {
  it('should print a one-time deprecation warning when `columnHeaders` is used', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    normalizeExportOptions({ columnHeaders: true });
    normalizeExportOptions({ columnHeaders: false });

    const deprecationCalls = warnSpy.mock.calls
      .filter(([message]) => String(message).includes('`columnHeaders`'));

    expect(deprecationCalls.length).toBe(1);
    expect(deprecationCalls[0][0]).toMatch(/^Deprecated: .*`columnHeaders`.*`colHeaders`/);

    warnSpy.mockRestore();
  });

  it('should not warn and not copy the object when `columnHeaders` is absent', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const options = { colHeaders: true };

    expect(normalizeExportOptions(options)).toBe(options);
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should promote `columnHeaders` to `colHeaders`', () => {
    expect(normalizeExportOptions({ columnHeaders: true }).colHeaders).toBe(true);
  });

  it('should prefer an explicit `colHeaders`', () => {
    expect(normalizeExportOptions({ columnHeaders: true, colHeaders: false }).colHeaders).toBe(false);
  });

  it('should tolerate a missing options object', () => {
    expect(normalizeExportOptions(undefined)).toBe(undefined);
  });
});

describe('BaseType#_mergeOptions', () => {
  it('should warn once and promote the deprecated `columnHeaders` alias', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const merged = BaseType.prototype._mergeOptions.call(
      { constructor: BaseType },
      { columnHeaders: true }
    );

    const deprecationCalls = warnSpy.mock.calls
      .filter(([message]) => String(message).includes('`columnHeaders`'));

    expect(deprecationCalls.length).toBe(1);
    expect(merged.colHeaders).toBe(true);

    warnSpy.mockRestore();
  });

  it('should keep the default `colHeaders` when neither alias is passed', () => {
    const merged = BaseType.prototype._mergeOptions.call({ constructor: BaseType }, {});

    expect(merged.colHeaders).toBe(false);
  });
});
