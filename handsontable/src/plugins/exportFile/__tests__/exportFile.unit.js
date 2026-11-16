import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { ExportFile } from '../exportFile';
import { Dialog } from '../../dialog/dialog';
import ExportDataProvider from '../dataProvider';
import BaseType from '../types/_base';
import { detectXlsxEngine } from '../../../utils/xlsxEngine/detect';
import { ALL_XLSX_TOKENS } from '../../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import {
  resetTierKeys,
  tierKeyWith,
  tierKeyWithout,
} from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';
import XLSX_FEATURES from '../../../utils/xlsxEngine/features.json';
import { SUBSCRIPTION_KEY } from '../../../utils/entitlementLicenseKey/__tests__/fixtures';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { _resetDeprecationWarnings } from '../../../helpers/console';

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
      licenseKey: TEST_LICENSE_KEY,
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
      licenseKey: TEST_LICENSE_KEY,
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

describe('BaseType#_mergeOptions', () => {
  it('should keep the default `colHeaders` when none is passed', () => {
    const merged = BaseType.prototype._mergeOptions.call({ constructor: BaseType }, {});

    expect(merged.colHeaders).toBe(false);
  });
});

describe('ExportFile removed `columnHeaders` option', () => {
  const REMOVED_MESSAGE = 'The `columnHeaders` export option was removed in Handsontable 19.0.0 and is ignored. '
    + 'Use `colHeaders` instead.';
  let container;
  let hot;
  let warnSpy;

  beforeAll(() => {
    registerPlugin(ExportFile);
  });

  beforeEach(() => {
    // The warning prints once per page, so each case starts with a clean record.
    _resetDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [['a', 1], ['b', 2]],
      colHeaders: ['X', 'Y'],
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
    warnSpy.mockRestore();
  });

  const removedWarnings = () => warnSpy.mock.calls.filter(([message]) => message === REMOVED_MESSAGE);

  it('should ignore `columnHeaders` and warn once that it was removed', () => {
    const plugin = hot.getPlugin('exportFile');

    expect(plugin.exportAsString('csv', { columnHeaders: true })).toBe('\uFEFFa,1\r\nb,2');
    expect(removedWarnings()).toHaveLength(1);

    plugin.exportAsString('csv', { columnHeaders: true });

    expect(removedWarnings()).toHaveLength(1);
  });

  it('should not warn for `colHeaders`', () => {
    expect(hot.getPlugin('exportFile').exportAsString('csv', { colHeaders: true })).toBe('\uFEFF"X","Y"\r\na,1\r\nb,2');
    expect(removedWarnings()).toHaveLength(0);
  });

  it('should warn for `columnHeaders` on a `sheets` entry of an XLSX export', async() => {
    const writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());

    try {
      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', {
        sheets: [{ instance: hot, name: 'Sheet', columnHeaders: true }],
      });
    } finally {
      writeSpy.mockRestore();
    }

    expect(removedWarnings()).toHaveLength(1);
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
    registerPlugin(Dialog);
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
      licenseKey: TEST_LICENSE_KEY,
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

  it('should reject an export whose grid loads other data while the progress overlay is shown', async() => {
    hot.destroy();
    hot = new Handsontable(container, {
      data: [['a', 1], ['b', 2]],
      exportFile: true,
      dialog: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    const frames = [];

    jest.spyOn(hot.rootWindow, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);

      return frames.length;
    });

    const pending = hot.getPlugin('exportFile').downloadFileAsync('xlsx');

    hot.loadData([['other sheet', 3]]);

    while (frames.length > 0) {
      frames.shift()(0);
    }

    await expect(pending).rejects
      .toThrow(/ExportFile: the grid's data was replaced while the file was being exported/);
    expect(createSpy).not.toHaveBeenCalled();
    expect(hot.getPlugin('dialog').isVisible()).toBe(false);
  });

  it('should export when nothing replaces the data while the progress overlay is shown', async() => {
    hot.destroy();
    hot = new Handsontable(container, {
      data: [['a', 1], ['b', 2]],
      exportFile: true,
      dialog: true,
      licenseKey: TEST_LICENSE_KEY,
    });

    const frames = [];

    jest.spyOn(hot.rootWindow, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);

      return frames.length;
    });

    const pending = hot.getPlugin('exportFile').downloadFileAsync('xlsx');

    while (frames.length > 0) {
      frames.shift()(0);
    }

    await pending;

    expect(createSpy).toHaveBeenCalledTimes(1);
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

describe('ExportDataProvider#getLayoutDirection', () => {
  it('should follow the direction the grid renders in, not the raw setting', () => {
    // `layoutDirection: 'inherit'` on a right-to-left page renders the grid right to left, and the
    // import already compares against `isRtl()`. Reading the setting exported an LTR sheet there.
    const provider = rtl => new ExportDataProvider({
      getSettings: () => ({ layoutDirection: 'inherit' }),
      isRtl: () => rtl,
    });

    expect(provider(true).getLayoutDirection()).toBe('rtl');
    expect(provider(false).getLayoutDirection()).toBe('ltr');
  });
});

describe('ExportFile license capabilities', () => {
  let container;
  let hot;

  beforeAll(() => {
    // Registered here too, so the block also runs on its own (`-t`).
    registerPlugin(ExportFile);
  });

  const createGrid = (licenseKey) => {
    hot = new Handsontable(container, { data: [['a', 1]], exportFile: true, licenseKey });

    return hot.getPlugin('exportFile');
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    resetTierKeys();
  });

  /**
   * Builds a key that unlocks every plugin and, of the xlsx family, exactly `tokens`.
   *
   * @param {string[]} tokens The xlsx tokens the key unlocks.
   * @returns {string}
   */
  const xlsxKeyWith = tokens => tierKeyWithout(ALL_XLSX_TOKENS.filter(id => !tokens.includes(id)));

  it('exposes the license tokens it gates, each one features.json assigns to it', () => {
    expect(ExportFile.CAPABILITIES).toContain('xlsx:export');
    expect(ExportFile.CAPABILITIES).not.toContain('xlsx:import');
    ExportFile.CAPABILITIES.forEach((id) => {
      const entry = XLSX_FEATURES.capabilities.find(candidate => candidate.id === id);

      expect(entry.licensing).toBe('token');
      expect(entry.plugins).toContain('ExportFile');
    });
  });

  it('refuses an xlsx export and reports no xlsx support when the key lacks xlsx:export', async() => {
    const plugin = createGrid(xlsxKeyWith(['xlsx:import']));
    const message = 'ExportFile: the license does not unlock "xlsx:export".';

    expect(plugin.supportsExportFormat('xlsx')).toBe(false);
    expect(plugin.supportsExportFormat('csv')).toBe(true);
    expect(() => plugin.exportAsString('csv')).not.toThrow();
    expect(() => plugin.exportAsString('xlsx')).toThrow(message);
    expect(() => plugin.exportAsBlob('xlsx')).toThrow(message);
    await expect(plugin.exportAsBlobAsync('xlsx')).rejects.toThrow(message);
    await expect(plugin.downloadFileAsync('xlsx')).rejects.toThrow(message);
    expect(() => plugin.downloadFile('xlsx')).toThrow(message);
  });

  it('keeps xlsx support for a key with xlsx:export, a key with no xlsx token and an invalid key', () => {
    expect(createGrid(xlsxKeyWith(['xlsx:export'])).supportsExportFormat('xlsx')).toBe(true);
    hot.destroy();
    expect(createGrid(SUBSCRIPTION_KEY).supportsExportFormat('xlsx')).toBe(true);
    hot.destroy();
    expect(createGrid('non-commercial-and-evaluation').supportsExportFormat('xlsx')).toBe(true);
  });

  describe('on a key that unlocks only the features it names', () => {
    // The plugin's own token (`feat:export_file`) and the xlsx token are checked one after the other.
    const listedKey = tokens => tierKeyWith(tokens);
    const pluginMessage = 'The license key for Handsontable does not include these features: '
      + 'Export to file (feat:export_file).';
    const xlsxMessage = 'ExportFile: the license does not unlock "xlsx:export".';

    beforeEach(() => {
      // The plugin's license message is also printed to the console.
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('refuses an xlsx export with the plugin\'s license message first when the key lacks feat:export_file', async() => {
      const plugin = createGrid(listedKey(['xlsx:export']));

      expect(plugin.supportsExportFormat('xlsx')).toBe(false);
      expect(() => plugin.exportAsString('xlsx')).toThrow(pluginMessage);
      expect(() => plugin.exportAsBlob('xlsx')).toThrow(pluginMessage);
      await expect(plugin.exportAsBlobAsync('xlsx')).rejects.toThrow(pluginMessage);
    });

    it('refuses an xlsx export with the xlsx:export message when the key has feat:export_file only', async() => {
      const plugin = createGrid(listedKey(['feat:export_file']));

      expect(plugin.supportsExportFormat('xlsx')).toBe(false);
      expect(() => plugin.exportAsBlob('xlsx')).toThrow(xlsxMessage);
      await expect(plugin.exportAsBlobAsync('xlsx')).rejects.toThrow(xlsxMessage);
    });

    it('exports xlsx when the key has both feat:export_file and xlsx:export', async() => {
      const plugin = createGrid(listedKey(['feat:export_file', 'xlsx:export']));

      expect(plugin.supportsExportFormat('xlsx')).toBe(true);
      await expect(plugin.exportAsBlobAsync('xlsx')).resolves.toBeInstanceOf(Blob);
    });

    it('keeps CSV for a key with feat:export_file and no xlsx token', () => {
      const plugin = createGrid(listedKey(['feat:export_file']));

      expect(plugin.supportsExportFormat('csv')).toBe(true);
      // The CSV carries a byte order mark by default (`bom: true`).
      expect(plugin.exportAsString('csv')).toBe('\uFEFFa,1');
    });
  });
});
