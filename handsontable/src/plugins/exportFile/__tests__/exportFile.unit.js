import { ExportFile } from '../exportFile';
import DataProvider from '../dataProvider';
import BaseType from '../types/_base';
import { normalizeExportOptions } from '../utils';
import { detectXlsxEngine } from '../../../utils/xlsxEngine/detect';
import { _resetDeprecationWarnings } from '../../../helpers/console';

beforeEach(() => {
  // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
  // `columnHeaders` assertions below would depend on the order the specs run in.
  _resetDeprecationWarnings();
});

function fakeCtx(exportFileSettings) {
  return { hot: { getSettings: () => ({ exportFile: exportFileSettings }) } };
}

// `detectXlsxEngine` duck-types on a `Workbook` constructor, so this stands in for the real
// ExcelJS module. This file runs under jsdom, which ExcelJS itself cannot be loaded in.
const ExcelJS = { Workbook: class {} };

describe('ExportFile#supportsExportFormat', () => {
  it('should return true for csv regardless of settings', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(undefined), 'csv')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), 'csv')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'csv')).toBe(true);
  });

  it('should return true for xlsx without any engine configured, through the built-in engine', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(undefined), 'xlsx')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(true), 'xlsx')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), 'xlsx')).toBe(true);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: {} }), 'xlsx')).toBe(true);
  });

  it('should return false for an unknown format', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx(undefined), 'pdf')).toBe(false);
  });

  it('should return true for xlsx when an xlsx engine is configured', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: ExcelJS } }), 'xlsx')).toBe(true);
  });

  it('should return false for xlsx when the configured engine does not duck-type', () => {
    // The export would reject such a configuration with `Invalid xlsx engine module.`, so the
    // predicate has to answer `false` for it — which is what `supportsImportFormat` already does.
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'xlsx')).toBe(false);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: 42 } }), 'xlsx')).toBe(false);
  });

  it('should return false for an unknown format even with engines configured', () => {
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: {} } }), 'pdf')).toBe(false);
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({}), '')).toBe(false);
  });
});

describe('ExportFile#_createTypeFormatter engine resolution', () => {
  // The exporter resolves what it was handed exactly as `Xlsx#export` does, so the kind this
  // reports is the engine the export would have run on.
  const resolvedKind = (exportFileSettings, options) => detectXlsxEngine(
    ExportFile.prototype._createTypeFormatter.call(fakeCtx(exportFileSettings), 'xlsx', options).options.engine
      ?? undefined,
    'exportFile'
  ).kind;

  it('should use the configured engine when the call passes no engine key', () => {
    expect(resolvedKind({ engines: { xlsx: ExcelJS } }, {})).toBe('exceljs');
    expect(resolvedKind({ engines: { xlsx: ExcelJS } }, undefined)).toBe('exceljs');
  });

  it('should keep the configured engine when the call passes engine: null or undefined', () => {
    // `null`/`undefined` mean "no override", so they must not silently downgrade a grid that
    // configured ExcelJS to the built-in engine — which is what spreading the options over the
    // settings default used to do.
    expect(resolvedKind({ engines: { xlsx: ExcelJS } }, { engine: null })).toBe('exceljs');
    expect(resolvedKind({ engines: { xlsx: ExcelJS } }, { engine: undefined })).toBe('exceljs');
  });

  it('should let a real per-call engine win over the configured one', () => {
    expect(resolvedKind({ engines: { xlsx: {} } }, { engine: ExcelJS })).toBe('exceljs');
  });

  it('should fall back to the built-in engine when neither the call nor the settings name one', () => {
    expect(resolvedKind(undefined, {})).toBe('native');
    expect(resolvedKind(true, {})).toBe('native');
    expect(resolvedKind({ engines: {} }, {})).toBe('native');
    expect(resolvedKind({ engines: { csv: ExcelJS } }, {})).toBe('native');
    expect(resolvedKind({ engines: {} }, { engine: null })).toBe('native');
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
