import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
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

  it('should return true for xlsx when the configured engine entry is null, through the built-in engine', () => {
    // `engines: { xlsx: null }` is what `xlsx: useExcelJs ? ExcelJS : null` writes. A nullish entry
    // is "no engine", the same as an absent key, and the export and the import read it that way.
    expect(ExportFile.prototype.supportsExportFormat.call(fakeCtx({ engines: { xlsx: null } }), 'xlsx')).toBe(true);
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
    ExportFile.prototype._createTypeFormatter.call(fakeCtx(exportFileSettings), 'xlsx', options).options.engine,
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

  it('should fall back to the built-in engine when the configured entry is null', () => {
    expect(resolvedKind({ engines: { xlsx: null } }, {})).toBe('native');
    expect(resolvedKind({ engines: { xlsx: null } }, { engine: null })).toBe('native');
    expect(resolvedKind({ engines: { xlsx: null } }, { engine: undefined })).toBe('native');
  });
});

describe('ExportFile export with a null engine entry', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(ExportFile);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should write the file through the built-in engine when `engines.xlsx` is null', async() => {
    hot = new Handsontable(container, {
      data: [['a', 1]],
      exportFile: { engines: { xlsx: null } },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('exportFile');

    // The predicate, the formatter and the export all have to give the same answer for this
    // configuration: a nullish entry selects the built-in engine.
    expect(plugin.supportsExportFormat('xlsx')).toBe(true);

    const buffer = await plugin._createTypeFormatter('xlsx').export();

    // A zip local file header starts with "PK".
    expect(buffer instanceof Uint8Array).toBe(true);
    expect(Array.from(buffer.subarray(0, 2))).toEqual([0x50, 0x4B]);
  });

  it('should still reject an entry that is present and does not duck-type', async() => {
    hot = new Handsontable(container, {
      data: [['a', 1]],
      exportFile: { engines: { xlsx: {} } },
      licenseKey: 'non-commercial-and-evaluation',
    });

    const plugin = hot.getPlugin('exportFile');

    expect(plugin.supportsExportFormat('xlsx')).toBe(false);
    await expect(plugin._createTypeFormatter('xlsx').export()).rejects.toThrow(/^Invalid xlsx engine module\./);
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

  it('should wait for the formatter promise when the global Promise is replaced, as Zone.js does', async() => {
    // Zone.js replaces the global `Promise`, so `instanceof Promise` was false for the native promise
    // the xlsx formatter returns, and the promise itself went into the blob: `[object Promise]`.
    const NativePromise = global.Promise;

    class ZoneAwarePromise extends NativePromise {}

    const formatter = {
      export: () => NativePromise.resolve(new Uint8Array([0x50, 0x4b, 0x03, 0x04])),
      options: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    };
    let result;

    global.Promise = ZoneAwarePromise;

    try {
      result = ExportFile.prototype._createBlob.call({}, formatter);
    } finally {
      global.Promise = NativePromise;
    }

    expect((await result).size).toBe(4);
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

describe('ExportFile downloads and the grid lifecycle', () => {
  let container;
  let hot;
  let createSpy;
  let revokeSpy;
  let clickSpy;
  let created;

  beforeAll(() => {
    registerPlugin(ExportFile);
  });

  beforeEach(() => {
    created = 0;
    container = document.createElement('div');
    document.body.appendChild(container);
    // jsdom implements neither, and a real click on the anchor would try to navigate.
    window.URL.createObjectURL = () => {};
    window.URL.revokeObjectURL = () => {};
    createSpy = jest.spyOn(window.URL, 'createObjectURL').mockImplementation(() => {
      created += 1;

      return `blob:test-${created}`;
    });
    revokeSpy = jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    clickSpy = jest.spyOn(window.HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(() => true);
    hot = new Handsontable(container, {
      data: [['a', 1], ['b', 2]],
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
    delete window.URL.createObjectURL;
    delete window.URL.revokeObjectURL;
  });

  it('should revoke the object URL of a download when the grid is destroyed before the revoke timeout', () => {
    // `destroy()` clears every `_registerTimeout`, so a grid torn down inside the 100 ms window used
    // to keep one blob alive per export until the tab closed.
    hot.getPlugin('exportFile').downloadFile('csv');

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).not.toHaveBeenCalled();

    hot.destroy();

    expect(revokeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:test-1');
  });

  it('should revoke the object URL once, on the timeout, when the grid outlives it', () => {
    jest.useFakeTimers();

    try {
      hot.getPlugin('exportFile').downloadFile('csv');
      jest.advanceTimersByTime(100);
    } finally {
      jest.useRealTimers();
    }

    expect(revokeSpy).toHaveBeenCalledTimes(1);

    hot.destroy();

    expect(revokeSpy).toHaveBeenCalledTimes(1);
  });

  it('should reject with a Handsontable error, not a TypeError, when the grid is destroyed mid-export', async() => {
    const pending = hot.getPlugin('exportFile').downloadFileAsync('xlsx');

    hot.destroy();

    await expect(pending).rejects.toThrow(/ExportFile: the Handsontable instance was destroyed/);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should name the destroyed instance, not throw a TypeError, for an export started after destroy()', async() => {
    // Every export entry point builds its formatter first, which read `this.hot.getSettings()` and
    // threw `Cannot read properties of undefined (reading 'getSettings')` on a destroyed grid.
    const plugin = hot.getPlugin('exportFile');

    hot.destroy();

    const destroyed = /ExportFile: the Handsontable instance is destroyed, so nothing can be exported/;

    expect(() => plugin.exportAsString('csv')).toThrow(destroyed);
    expect(() => plugin.exportAsBlob('csv')).toThrow(destroyed);
    expect(() => plugin.downloadFile('csv')).toThrow(destroyed);
    await expect(plugin.exportAsBlobAsync('xlsx')).rejects.toThrow(destroyed);
    await expect(plugin.downloadFileAsync('xlsx')).rejects.toThrow(destroyed);
  });
});

describe('DataProvider#getLayoutDirection', () => {
  it('should follow the direction the grid renders in, not the raw setting', () => {
    // `layoutDirection: 'inherit'` on a right-to-left page renders the grid right to left, and the
    // import already compares against `isRtl()`. Reading the setting exported an LTR sheet there.
    const provider = rtl => new DataProvider({ getSettings: () => ({ layoutDirection: 'inherit' }), isRtl: () => rtl });

    expect(provider(true).getLayoutDirection()).toBe('rtl');
    expect(provider(false).getLayoutDirection()).toBe('ltr');
  });
});
