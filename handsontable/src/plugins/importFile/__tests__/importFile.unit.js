/**
 * @jest-environment node
 */
import { Blob } from 'node:buffer';
import ExcelJS from 'exceljs';
import { HyperFormula } from 'hyperformula';
import plPL from 'hyperformula/commonjs/i18n/languages/plPL';
import { ImportFile, PLUGIN_KEY, PLUGIN_PRIORITY } from '../importFile';
import { installImportedStyles } from '../applier';
import { mapWorkbook, resolveImportOptions, selectSheet } from '../mapper';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { excelJsAdapter } from '../../../utils/xlsxEngine/adapters/exceljs';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { SheetBuilder } from '../../../utils/xlsxEngine/builder';
import { MAX_FORMULA_LENGTH } from '../../../utils/xlsxEngine/limits';
import {
  createCellSnapshot,
  createSheetSnapshot,
  createWorkbookSnapshot,
} from '../../../utils/xlsxEngine/model';
import {
  loadFixture as fixture, rewriteArchive, toArrayBuffer,
} from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';
import * as consoleHelpers from '../../../helpers/console';
import { registerCellType } from '../../../cellTypes/registry';
import { registerPlugin } from '../../registry';
import { ALL_XLSX_TOKENS } from '../../../utils/entitlementLicenseKey/__tests__/xlsxLicenseKeys';
import {
  resetTierKeys,
  tierKeyWith,
  tierKeyWithout,
} from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';
import { registerAsRootInstance } from '../../../utils/rootInstance';
import XLSX_FEATURES from '../../../utils/xlsxEngine/features.json';
import { SUBSCRIPTION_KEY } from '../../../utils/entitlementLicenseKey/__tests__/fixtures';
import { UNRESTRICTED_XLSX_ENTITLEMENT } from '../../../utils/xlsxEngine/xlsxEntitlement';

/**
 * @param {HyperFormula} engine The engine.
 * @param {string} [sheetName] The sheet the grid is bound to.
 * @returns {object} A stub of a running Formulas plugin.
 */
function runningFormulasPlugin(engine, sheetName = 'Sheet1') {
  return { isEnabled: () => true, enabled: true, flushEngineEvaluation: () => {}, sheetName, engine };
}

function fakeCtx(importFileSettings) {
  return { hot: { getSettings: () => ({ importFile: importFileSettings }) } };
}

/**
 * A minimal document stand-in: this file runs under `@jest-environment node`, so no real DOM is
 * available. It implements the exact surface `installImportedStyles`/`removeImportedStyles` use —
 * `createElement`, attribute-matching `head.querySelector`, `head.appendChild`, element `remove()` —
 * so a test can prove an element was actually inserted/removed, not just that a function was called.
 */
function fakeDocument() {
  const elements = [];

  return {
    createElement: () => {
      const el = {
        textContent: '',
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        remove() {
          const index = elements.indexOf(el);

          if (index !== -1) {
            elements.splice(index, 1);
          }
        },
      };

      return el;
    },
    head: {
      appendChild: (el) => {
        elements.push(el);
      },
      prepend: (el) => {
        elements.unshift(el);
      },
      querySelector: (selector) => {
        const match = /data-hot-imported-styles="([^"]+)"/.exec(selector);
        const guid = match ? match[1] : null;

        return elements.find(el => el.attributes['data-hot-imported-styles'] === guid) ?? null;
      },
    },
  };
}

function pluginWithFakeHot(
  importFileSettings,
  { formulasEnabled = false, formulasRuns = formulasEnabled, rtl = false, licenseKey } = {},
) {
  const calls = [];
  const hooks = {};
  const listeners = {};
  const rootDocument = fakeDocument();
  const hot = {
    // The stylesheet is mounted in the wrapper element; the fake head stands in for it.
    rootWrapperElement: rootDocument.head,
    guid: 'hot-1',
    rootDocument,
    toVisualRow: row => row,
    toVisualColumn: col => col,
    // `BasePlugin`'s constructor registers three hooks straight on `hot` (not on itself), so a
    // real `new ImportFile(hot)` needs this stub. `loadData` below fires the `beforeLoadData` ones.
    addHook: (name, callback) => {
      listeners[name] = [...(listeners[name] ?? []), callback];
    },
    removeHook: (name, callback) => {
      listeners[name] = (listeners[name] ?? []).filter(listener => listener !== callback);
    },
    getSettings: () => ({ importFile: importFileSettings, licenseKey }),
    getPlugin: name => ({
      // `isEnabled()` reads the option, `enabled` says whether the plugin runs: a license key
      // can keep a plugin off while its option is on.
      formulas: { isEnabled: () => formulasEnabled, enabled: formulasRuns, flushEngineEvaluation: () => {} },
      comments: { isEnabled: () => false, enabled: false },
    })[name],
    runHooks: (name, ...args) => {
      calls.push([name, ...args]);

      return hooks[name] ? hooks[name](...args) : undefined;
    },
    batch: fn => fn(),
    // `layoutDirection` is resolved once at construction (`src/core.ts:545`), so the real grid
    // answers this from a closed-over value that `updateSettings` cannot change. The fake mirrors
    // that: the direction is fixed when the instance is built.
    isRtl: () => rtl,
    updateSettings: settings => calls.push(['updateSettings', settings]),
    loadData: (data, source = 'loadData') => {
      (listeners.beforeLoadData ?? []).forEach(listener => listener(data, false, source));
      calls.push(['loadData', data]);
    },
    setCellMetaObject: (...args) => calls.push(['setCellMetaObject', ...args]),
  };
  const plugin = new ImportFile(hot);

  // Core enables a plugin whose `isEnabled()` answers true during init; the fake does the same.
  if (plugin.isEnabled()) {
    plugin.enablePlugin();
  }

  return { plugin, calls, hooks, hot };
}

describe('ImportFile statics', () => {
  it('should expose its key and a priority right after exportFile', () => {
    expect(PLUGIN_KEY).toBe('importFile');
    expect(ImportFile.PLUGIN_KEY).toBe('importFile');
    expect(PLUGIN_PRIORITY).toBe(245);
    expect(ImportFile.SETTING_KEYS).toEqual(['importFile']);
  });
});

describe('ImportFile#inferColumnTypes', () => {
  const localeCtx = locale => ({ hot: { getSettings: () => ({ importFile: true, locale }) } });
  const rows = [['1.234', '12/03/2026'], ['5.678', '01/02/2026']];

  const infer = (locale, options) => ImportFile.prototype.inferColumnTypes.call(localeCtx(locale), rows, options);
  const inputFormats = result => result.columns.map(column => column.inputFormat);

  it('should read the grid locale and need no engine', () => {
    const result = infer('de-DE');

    expect(inputFormats(result)).toEqual([{ decimalSeparator: ',' }, { dateOrder: 'DMY' }]);
    expect(ImportFile.prototype.convertToInferredTypes.call(localeCtx('de-DE'), rows, result)).toEqual([
      [1234, '2026-03-12'],
      [5678, '2026-02-01'],
    ]);
  });

  it('should let an explicit locale option override the grid locale', () => {
    expect(inputFormats(infer('de-DE', { locale: 'en-US' }))).toEqual([
      { decimalSeparator: '.' },
      { dateOrder: 'MDY' },
    ]);
  });

  it('should accept null options', () => {
    expect(inputFormats(infer('de-DE', null))[0]).toEqual({ decimalSeparator: ',' });
  });

  it('should keep the grid locale when the locale option is undefined', () => {
    expect(inputFormats(infer('de-DE', { locale: undefined }))[0]).toEqual({ decimalSeparator: ',' });
  });

  it('should fall back to the grid locale for an empty locale option', () => {
    expect(inputFormats(infer('de-DE', { locale: '' }))[0]).toEqual({ decimalSeparator: ',' });
  });

  it('should pass the headerRow and stats options through', () => {
    const table = [['Price', 'Joined'], ...rows];
    const result = ImportFile.prototype.inferColumnTypes.call(localeCtx('de-DE'), table, {
      headerRow: 'auto',
      stats: true,
    });

    expect(result.headerRow).toBe(true);
    expect(result.columns.map(column => column.title)).toEqual(['Price', 'Joined']);
    expect(result.columns[0].stats).toEqual(expect.objectContaining({ count: 2, min: 1234, max: 5678 }));
    expect(ImportFile.prototype.convertToInferredTypes.call(localeCtx('de-DE'), table, result)).toHaveLength(2);
  });
});

describe('ImportFile#supportsImportFormat', () => {
  const supports = (settings, format) => ImportFile.prototype.supportsImportFormat.call(fakeCtx(settings), format);

  it('should answer true for xlsx through the built-in engine when nothing is configured', () => {
    expect(supports(undefined, 'xlsx')).toBe(true);
    expect(supports(true, 'xlsx')).toBe(true);
    expect(supports({}, 'xlsx')).toBe(true);
    expect(supports({ engines: {} }, 'xlsx')).toBe(true);
    // A map that names another format names no xlsx engine either, so xlsx still falls back.
    expect(supports({ engines: { csv: ExcelJS } }, 'xlsx')).toBe(true);
    expect(supports(undefined, 'xls')).toBe(false);
    expect(supports(undefined, 'csv')).toBe(false);
  });

  it('should return true for xlsx with ExcelJS and false for formats ExcelJS cannot read', () => {
    expect(supports({ engines: { xlsx: ExcelJS } }, 'xlsx')).toBe(true);
    expect(supports({ engines: { xlsx: ExcelJS } }, 'xls')).toBe(false);
    expect(supports({ engines: { xlsx: ExcelJS } }, 'csv')).toBe(false);
  });

  it('should answer true for xlsx when the configured entry is null, through the built-in engine', () => {
    // A nullish entry is "no engine", the same as an absent key, and the import reads it that way.
    expect(supports({ engines: { xlsx: null } }, 'xlsx')).toBe(true);
  });

  it('should return false, not throw, for an engine of unknown shape', () => {
    expect(supports({ engines: { xlsx: {} } }, 'xlsx')).toBe(false);
  });
});

describe('ImportFile#importFromArrayBuffer', () => {
  it('should read, map and apply a workbook through the configured engine', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    expect(result.colHeaders).toEqual(['Name', 'Amount', 'Active', 'Hired', 'Start', 'Ratio']);
    expect(result.data[0]).toEqual(['Ana García', 4200.5, true, '2024-01-01', '12:30:00', 0.034]);
    expect(result.engine).toEqual({ kind: 'exceljs', version: null });
    expect(calls.map(call => call[0]))
      .toEqual(['beforeImport', 'updateSettings', 'loadData', 'updateSettings', 'afterImport']);
  });

  it('should not touch the grid with apply: false', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });

    await plugin.importFromArrayBuffer('xlsx', fixture('values'), { apply: false });

    expect(calls).toEqual([]);
  });

  it('should let beforeImport cancel the apply and mutate the result', async() => {
    const { plugin, calls, hooks } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });

    hooks.beforeImport = (result) => {
      result.colHeaders = ['changed'];

      return false;
    };

    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    expect(result.colHeaders).toEqual(['changed']);
    expect(calls.map(call => call[0])).toEqual(['beforeImport']);
  });

  it('should honor a per-call engine override', async() => {
    const { plugin } = pluginWithFakeHot(undefined);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { engine: ExcelJS, apply: false });

    expect(result.engine.kind).toBe('exceljs');
  });

  it('should reject with a Handsontable error, not a TypeError, when the grid is destroyed mid-read', async() => {
    // A file read is the plugin's one async boundary. `BasePlugin#destroy` deletes `hot`, so
    // continuing into `this.hot.getPlugin(...)` used to surface as a raw
    // `Cannot read properties of undefined`.
    let plugin;
    const engine = {
      Workbook: class {
        constructor() {
          this.worksheets = [];
          this.xlsx = {
            load: async() => {
              plugin.destroy();
            },
          };
        }
      },
    };

    ({ plugin } = pluginWithFakeHot({ engines: { xlsx: engine } }));

    await expect(plugin.importFromArrayBuffer('xlsx', new ArrayBuffer(0))).rejects.toThrow(/destroyed/);
  });

  it('should reject unknown formats, missing engines and unreadable buffers with Handsontable errors', async() => {
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const noEngine = pluginWithFakeHot(undefined).plugin;

    // `engines` is keyed by format, so a format the map does not name falls back to the built-in
    // engine — the same thing `supportsImportFormat` predicts and `exportFile` does. The refusal
    // then comes from that engine's own format check and names it, so the message proves which
    // engine the fallback picked.
    await expect(plugin.importFromArrayBuffer('csv', fixture('values')))
      .rejects.toThrow(/The built-in xlsx engine cannot import "csv" files.*Supported formats: xlsx/);
    // A per-call engine still goes through the format check of the engine it detects.
    await expect(plugin.importFromArrayBuffer('csv', fixture('values'), { engine: ExcelJS }))
      .rejects.toThrow(/cannot import "csv".*xlsx/);
    // No `engines` at all means the built-in engine, so the import succeeds and names it.
    const viaNative = await noEngine.importFromArrayBuffer('xlsx', fixture('values'));

    expect(viaNative.engine).toEqual({ kind: 'native', version: null });
    await expect(plugin.importFromArrayBuffer('xlsx', new Uint8Array([1, 2]).buffer))
      .rejects.toThrow(/could not be parsed/);
  });

  it('should read, map and apply a workbook through the built-in engine when importFile is true', async() => {
    const { plugin, calls } = pluginWithFakeHot(true);
    // `values.xlsx`'s first sheet row is the header band; without promoting it, `data[0][0]` would
    // be the header label `'Name'` rather than the first data row's value, for any engine.
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    expect(result.engine).toEqual({ kind: 'native', version: null });
    expect(result.data[0][0]).toBe('Ana García');
    expect(calls.some(([method]) => method === 'updateSettings')).toBe(true);
  });

  it('should import through the built-in engine when engines is an empty map', async() => {
    const supports = ImportFile.prototype.supportsImportFormat.call(fakeCtx({ engines: {} }), 'xlsx');
    const { plugin } = pluginWithFakeHot({ engines: {} });
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    // The predicate and the import have to answer the same thing: an empty map injects nothing, so
    // both take the built-in engine.
    expect(supports).toBe(true);
    expect(result.engine.kind).toBe('native');
    expect(result.data[0][0]).toBe('Ana García');
  });

  it('should import through the built-in engine when engines names another format only', async() => {
    const supports = ImportFile.prototype.supportsImportFormat.call(fakeCtx({ engines: { csv: ExcelJS } }), 'xlsx');
    const { plugin } = pluginWithFakeHot({ engines: { csv: ExcelJS } });
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    // `engines` is keyed by format, so a map without `xlsx` leaves xlsx uninjected — the same
    // configuration `exportFile` falls back on, and the one the engine table documents.
    expect(supports).toBe(true);
    expect(result.engine.kind).toBe('native');
    expect(result.data[0][0]).toBe('Ana García');
  });

  it('should import through the built-in engine when the engines entry for the format is null', async() => {
    const supports = ImportFile.prototype.supportsImportFormat.call(fakeCtx({ engines: { xlsx: null } }), 'xlsx');
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: null } });
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });

    // `engines: { xlsx: null }` is what `xlsx: useExcelJs ? ExcelJS : null` writes. A nullish entry
    // is "no engine", the same as an absent key — and `exportFile` reads the same map the same way.
    expect(supports).toBe(true);
    expect(result.engine.kind).toBe('native');
    expect(result.data[0][0]).toBe('Ana García');
  });

  it('should still refuse an engine of unknown shape configured for the format', async() => {
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: {} } });

    // The fallback covers a MISSING entry only. An entry that is present and does not duck-type is
    // a configuration mistake, and it keeps throwing rather than silently exporting the built-in
    // engine's behavior.
    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values')))
      .rejects.toThrow(/Invalid xlsx engine module/);
  });

  it('should report layoutDirection as dropped when the grid direction disagrees with the sheet', async() => {
    const ltrGrid = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const rtlGrid = pluginWithFakeHot({ engines: { xlsx: ExcelJS } }, { rtl: true });

    const intoLtr = await ltrGrid.plugin.importFromArrayBuffer('xlsx', fixture('values'));
    const intoRtl = await rtlGrid.plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(intoLtr.layoutDirection).toBe('ltr');
    expect(intoLtr.dropped).not.toContain('layoutDirection');
    // The workbook is left-to-right and the grid is right-to-left: the grid cannot be turned around
    // after construction, so the disagreement is reported rather than silently ignored.
    expect(intoRtl.layoutDirection).toBe('ltr');
    expect(intoRtl.dropped).toContain('layoutDirection');
  });

  it('should not report a layout-direction mismatch when the result is not applied', async() => {
    const rtlGrid = pluginWithFakeHot({ engines: { xlsx: ExcelJS } }, { rtl: true });
    const result = await rtlGrid.plugin.importFromArrayBuffer('xlsx', fixture('values'), { apply: false });

    expect(result.layoutDirection).toBe('ltr');
    expect(result.dropped).not.toContain('layoutDirection');
  });
});

describe('ImportFile#importFromBlob', () => {
  it('should read the blob into a buffer and delegate', async() => {
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const blob = new Blob([new Uint8Array(fixture('values'))]);
    const result = await plugin.importFromBlob('xlsx', blob, { apply: false });

    expect(result.sheetNames).toEqual(['Values']);
  });
});

describe('ImportFile overlapping imports', () => {
  /**
   * A blob stand-in whose `arrayBuffer()` resolves only when the test calls `release()`, so the
   * order in which two reads finish is under the test's control.
   *
   * @param {ArrayBuffer} buffer The bytes the blob resolves with.
   * @returns {{ blob: object, release: Function }} The blob and the function that releases its read.
   */
  function deferredBlob(buffer) {
    let release;
    const ready = new Promise((resolve) => {
      release = () => resolve(buffer);
    });

    return { blob: { arrayBuffer: () => ready }, release };
  }

  const STALE = /a newer import started before this one finished, so its result was not applied/;

  it('should apply the import started last and reject the older one when the older one finishes last', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const slow = deferredBlob(fixture('values'));
    const fast = deferredBlob(fixture('values'));
    const older = plugin.importFromBlob('xlsx', slow.blob);
    const newer = plugin.importFromBlob('xlsx', fast.blob);

    fast.release();

    const newerResult = await newer;

    slow.release();

    await expect(older).rejects.toThrow(STALE);
    expect(calls.filter(([name]) => name === 'loadData')).toHaveLength(1);

    const afterImports = calls.filter(([name]) => name === 'afterImport');

    expect(afterImports).toHaveLength(1);
    expect(afterImports[0][1]).toBe(newerResult);
  });

  it('should reject an import when the grid loads other data while the file is being read', async() => {
    const { plugin, calls, hot } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const read = deferredBlob(fixture('values'));
    const pending = plugin.importFromBlob('xlsx', read.blob);

    hot.loadData([['other sheet']]);
    read.release();

    await expect(pending).rejects
      .toThrow(/the grid's data was replaced while the file was being read, so its result was not applied/);
    expect(calls.filter(([name]) => name === 'loadData')).toHaveLength(1);
    expect(calls.filter(([name]) => name === 'beforeImport' || name === 'afterImport')).toEqual([]);
  });

  it('should apply an import when a DataProvider fetch lands while the file is being read', async() => {
    const { plugin, calls, hot } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const read = deferredBlob(fixture('values'));
    const pending = plugin.importFromBlob('xlsx', read.blob);

    hot.loadData([['fetched page']], 'dataProvider');
    read.release();

    await pending;

    expect(calls.filter(([name]) => name === 'afterImport')).toHaveLength(1);
  });

  it('should apply an import whose beforeImport listener clears the grid with loadData()', async() => {
    const { plugin, calls, hooks, hot } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });

    hooks.beforeImport = () => {
      hot.loadData([]);
    };

    await plugin.importFromArrayBuffer('xlsx', fixture('values'));

    expect(calls.filter(([name]) => name === 'loadData')).toHaveLength(2);
    expect(calls.filter(([name]) => name === 'afterImport')).toHaveLength(1);
  });

  it('should keep rejecting an older import as stale when a newer import loads its data first', async() => {
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const slow = deferredBlob(fixture('values'));
    const fast = deferredBlob(fixture('values'));
    const older = plugin.importFromBlob('xlsx', slow.blob);
    const newer = plugin.importFromBlob('xlsx', fast.blob);

    fast.release();
    await newer;
    slow.release();

    await expect(older).rejects.toThrow(STALE);
  });

  it('should reject the older import even when it finishes first', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const first = deferredBlob(fixture('values'));
    const second = deferredBlob(fixture('values'));
    const older = plugin.importFromBlob('xlsx', first.blob);
    const newer = plugin.importFromBlob('xlsx', second.blob);

    first.release();
    await expect(older).rejects.toThrow(STALE);
    // Nothing reached the grid or fired a hook for the discarded import.
    expect(calls).toEqual([]);

    second.release();

    const newerResult = await newer;

    expect(calls.filter(([name]) => name === 'beforeImport')).toHaveLength(1);
    expect(calls.filter(([name]) => name === 'loadData')).toHaveLength(1);
    expect(calls[calls.length - 1]).toEqual(['afterImport', newerResult, 'xlsx']);
  });

  it('should order importFromArrayBuffer calls the same way', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const older = plugin.importFromArrayBuffer('xlsx', fixture('values'));
    const newer = plugin.importFromArrayBuffer('xlsx', fixture('values'));
    const [olderOutcome, newerOutcome] = await Promise.allSettled([older, newer]);

    expect(olderOutcome.status).toBe('rejected');
    expect(olderOutcome.reason.message).toMatch(STALE);
    expect(newerOutcome.status).toBe('fulfilled');
    expect(calls.filter(([name]) => name === 'afterImport')).toHaveLength(1);
  });

  it('should count a blob import against a later array-buffer import', async() => {
    const { plugin } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const slow = deferredBlob(fixture('values'));
    const older = plugin.importFromBlob('xlsx', slow.blob);
    const newer = plugin.importFromArrayBuffer('xlsx', fixture('values'));

    await newer;
    slow.release();

    await expect(older).rejects.toThrow(STALE);
  });

  it('should neither cancel nor be cancelled by an apply: false import', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const slowApply = deferredBlob(fixture('values'));
    const slowPeek = deferredBlob(fixture('values'));
    const applied = plugin.importFromBlob('xlsx', slowApply.blob);
    const peekAfter = plugin.importFromBlob('xlsx', slowPeek.blob, { apply: false });
    const peekBefore = plugin.importFromArrayBuffer('xlsx', fixture('values'), { apply: false });

    slowPeek.release();
    slowApply.release();

    await expect(applied).resolves.toBeDefined();
    await expect(peekAfter).resolves.toBeDefined();
    await expect(peekBefore).resolves.toBeDefined();
    expect(calls.filter(([name]) => name === 'afterImport')).toHaveLength(1);
  });

  it('should not let a call refused before its read cancel an import in flight', async() => {
    const { plugin, calls } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    const slow = deferredBlob(fixture('values'));
    const pending = plugin.importFromBlob('xlsx', slow.blob);

    await expect(plugin.importFromBlob('csv', slow.blob)).rejects.toThrow(/cannot import "csv"/);
    await expect(plugin.importFromArrayBuffer('csv', fixture('values'))).rejects.toThrow(/cannot import "csv"/);
    // An invalid option is refused before the read too, so it must not take the newest ticket.
    await expect(plugin.importFromBlob('xlsx', slow.blob, { headerRows: 0, colHeaders: 'firstRow' }))
      .rejects.toThrow(/"headerRows"/);
    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'), { range: [0, 0] }))
      .rejects.toThrow(/"range"/);

    slow.release();

    await expect(pending).resolves.toBeDefined();
    expect(calls.filter(([name]) => name === 'afterImport')).toHaveLength(1);
  });

  it('should reject the older import when a beforeImport handler starts a newer one', async() => {
    const { plugin, calls, hooks } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } });
    let newer;

    hooks.beforeImport = () => {
      hooks.beforeImport = undefined;
      newer = plugin.importFromArrayBuffer('xlsx', fixture('values'));
    };

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).rejects.toThrow(STALE);
    await newer;

    expect(calls.filter(([name]) => name === 'loadData')).toHaveLength(1);
  });
});

describe('ImportFile dropped-features warning', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(consoleHelpers, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should warn once per import that drops something, naming the features', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('lossy'), { apply: false });

    expect(result.dropped.length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    result.dropped.forEach(feature => expect(warnSpy.mock.calls[0][0]).toContain(feature));
  });

  it('should not warn for an import that drops nothing', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { apply: false });

    expect(result.dropped).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('ImportFile#isEnabled', () => {
  it('should honor importFile: false, like every other plugin option', () => {
    expect(pluginWithFakeHot(false).plugin.isEnabled()).toBe(false);
    expect(pluginWithFakeHot(undefined).plugin.isEnabled()).toBe(true);
    expect(pluginWithFakeHot({ engines: {} }).plugin.isEnabled()).toBe(true);
  });

  it('should reject an import on a disabled plugin without firing hooks or touching the grid', async() => {
    const { plugin, calls } = pluginWithFakeHot(false);

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'), { engine: ExcelJS }))
      .rejects.toThrow(/plugin is disabled/);
    await expect(plugin.importFromBlob('xlsx', new Blob([new Uint8Array(fixture('values'))]), { engine: ExcelJS }))
      .rejects.toThrow(/plugin is disabled/);
    expect(calls).toEqual([]);
  });
});

describe('ImportFile#disablePlugin', () => {
  it('should remove the imported stylesheet so its rules stop painting cells', () => {
    const { plugin, hot } = pluginWithFakeHot({});
    const selector = 'style[data-hot-imported-styles="hot-1"]';

    installImportedStyles(hot, { 'htImported-a': 'color:#ff0000' });
    plugin.disablePlugin();

    expect(hot.rootDocument.head.querySelector(selector)).toBeNull();
  });
});

describe('ImportFile#destroy', () => {
  it('should survive a second call after the base teardown deleted hot', () => {
    const { plugin } = pluginWithFakeHot({});

    plugin.destroy();

    expect(() => plugin.destroy()).not.toThrow();
  });

  it('should remove the imported stylesheet element before delegating to the base plugin teardown', () => {
    const { plugin, hot } = pluginWithFakeHot({});
    const selector = 'style[data-hot-imported-styles="hot-1"]';

    installImportedStyles(hot, { 'htImported-a': 'color:#ff0000' });

    expect(hot.rootDocument.head.querySelector(selector)).not.toBeNull();

    expect(() => plugin.destroy()).not.toThrow();

    expect(hot.rootDocument.head.querySelector(selector)).toBeNull();
  });
});

describe('mapWorkbook on a merge whose covered cells were never written', () => {
  /**
   * Builds `A1:B1` merged with only A1 carrying a value, writes it with the given engine, then
   * reads those bytes back with the same engine and maps them the way the plugin does.
   * @param adapter
   * @param engine
   */
  async function roundTrip(adapter, engine) {
    const snapshot = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 'master';
    sheet.cell(2, 1).value = 'below';
    sheet.merge(1, 1, 1, 2);
    snapshot.sheets.push(sheet.toSnapshot());

    const bytes = await adapter.write(snapshot, engine, new DroppedFeatures());
    const read = await adapter.read(toArrayBuffer(bytes), engine, new DroppedFeatures());

    return mapWorkbook(
      read,
      resolveImportOptions({ headerRows: 1 }),
      {
        formulasEnabled: false,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT
      },
      new DroppedFeatures(),
    );
  }

  it('should keep the merge on a native-written file, exactly as on an ExcelJS-written one', async() => {
    // The end-to-end consequence of the reader's merge-member materialization. `mapWorkbook` takes
    // the used column count from the widest row, so a reader that left the covered slot out
    // narrowed the sheet to one column and then dropped the merge entirely — the native engine's
    // own export/import round trip silently lost every merge whose covered cells carried no style.
    const viaNative = await roundTrip(nativeAdapter, undefined);
    const viaExcelJs = await roundTrip(excelJsAdapter, ExcelJS);

    expect(viaNative.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
    expect(viaNative.mergeCells).toEqual(viaExcelJs.mergeCells);
    expect(viaNative.colHeaders).toEqual(viaExcelJs.colHeaders);
    expect(viaNative.data).toEqual(viaExcelJs.data);
  });
});

describe('mapWorkbook on a protected sheet with an unlocked cell under a merge', () => {
  /**
   * Writes a protected sheet whose merge A1:B1 covers an UNLOCKED B1 with the given engine, reads
   * the bytes back with the same engine and maps them the way the plugin does.
   *
   * @param {object} adapter The engine adapter.
   * @param {object} engine The engine module, or `undefined` for the built-in one.
   * @returns {Promise<object>}
   */
  async function roundTrip(adapter, engine) {
    const snapshot = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 'merged';
    sheet.cell(1, 2).locked = false;
    sheet.cell(1, 3).value = 'locked';
    sheet.merge(1, 1, 1, 2);
    sheet.protect('');
    snapshot.sheets.push(sheet.toSnapshot());

    const bytes = await adapter.write(snapshot, engine, new DroppedFeatures());
    const read = await adapter.read(toArrayBuffer(bytes), engine, new DroppedFeatures());

    return mapWorkbook(
      read,
      resolveImportOptions({}),
      {
        formulasEnabled: false,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT
      },
      new DroppedFeatures(),
    );
  }

  /**
   * The `readOnly` a cell ends up with: its own `cellsMeta` entry first, then its column's.
   *
   * @param {object} result The mapped import result.
   * @param {number} row The 0-based row.
   * @param {number} col The 0-based column.
   * @returns {boolean}
   */
  function readOnlyAt(result, row, col) {
    const own = (result.cellsMeta ?? []).find(meta => meta.row === row && meta.col === col && 'readOnly' in meta);

    return own ? own.readOnly : (result.columns?.[col]?.readOnly ?? false);
  }

  it('should keep the covered cell editable, whichever engine read the file', async() => {
    // A merge member used to be blanked to `null` on read, losing its own `locked="0"`, and the
    // mapper imports a blank under sheet protection as read-only. It showed once the user unmerged.
    for (const [adapter, engine] of [[nativeAdapter, undefined], [excelJsAdapter, ExcelJS]]) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await roundTrip(adapter, engine);

      expect(result.mergeCells).toEqual([{ row: 0, col: 0, rowspan: 1, colspan: 2 }]);
      expect(readOnlyAt(result, 0, 1)).toBe(false);
      expect(readOnlyAt(result, 0, 0)).toBe(true);
      expect(readOnlyAt(result, 0, 2)).toBe(true);
    }
  });
});

describe('mapWorkbook on a formula Excel stored with a function prefix', () => {
  /**
   * Writes one `_xlfn.`-prefixed formula with the given engine, reads the bytes back with the same
   * engine and maps them with the Formulas plugin enabled, the way the plugin does.
   *
   * @param {object} adapter The engine adapter.
   * @param {object} engine The engine module, or `undefined` for the built-in one.
   * @returns {Promise<object>}
   */
  async function roundTrip(adapter, engine) {
    const snapshot = createWorkbookSnapshot();
    const sheet = new SheetBuilder('Sheet1');

    sheet.cell(1, 1).value = 1;
    sheet.cell(2, 1).value = 3;
    sheet.cell(1, 2).formula = { text: '_xlfn.STDEV.S(A1:A2)', result: 1.4142135623730951 };
    snapshot.sheets.push(sheet.toSnapshot());

    const bytes = await adapter.write(snapshot, engine, new DroppedFeatures());
    const read = await adapter.read(toArrayBuffer(bytes), engine, new DroppedFeatures());

    return mapWorkbook(
      read,
      resolveImportOptions({}),
      {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
      },
      new DroppedFeatures(),
    );
  }

  it('should hand HyperFormula the formula without the prefix, whichever engine read the file', async() => {
    // Excel writes every post-2007 function as `_xlfn.<NAME>` in `<f>`, and both readers hand the
    // stored text over verbatim. HyperFormula does not know `_xlfn.STDEV.S` and shows `#NAME?`.
    const viaNative = await roundTrip(nativeAdapter, undefined);
    const viaExcelJs = await roundTrip(excelJsAdapter, ExcelJS);

    expect(viaNative.data[0][1]).toBe('=STDEV.S(A1:A2)');
    expect(viaExcelJs.data[0][1]).toBe('=STDEV.S(A1:A2)');
  });
});

/**
 * Writes a one-sheet workbook with ExcelJS, reads it back with both engines and maps each read the
 * way the plugin does. ExcelJS writes the number format codes it is given verbatim, so a code a
 * spreadsheet app writes (LibreOffice's `\$#,##0.00`) reaches both readers as that app wrote it.
 *
 * @param {Function} build Fills the 1-based `SheetBuilder`.
 * @param {object} [options] The import options.
 * @param {object} [context] Overrides of the mapper context.
 * @param {'exceljs'|'native'} [writer='exceljs'] The engine that writes the file.
 * @returns {Promise<{native: object, exceljs: object}>}
 */
async function mapWithBothEngines(build, options = {}, context = {}, writer = 'exceljs') {
  const snapshot = createWorkbookSnapshot();
  const sheet = new SheetBuilder('Sheet1');

  build(sheet);
  snapshot.sheets.push(sheet.toSnapshot());

  const bytes = writer === 'native'
    ? await nativeAdapter.write(snapshot, undefined, new DroppedFeatures())
    : await excelJsAdapter.write(snapshot, ExcelJS, new DroppedFeatures());
  const mapped = {};

  for (const [kind, adapter, engine] of [['native', nativeAdapter, undefined], ['exceljs', excelJsAdapter, ExcelJS]]) {
    const dropped = new DroppedFeatures();
    // eslint-disable-next-line no-await-in-loop -- one engine at a time.
    const read = await adapter.read(toArrayBuffer(bytes), engine, dropped);
    const result = mapWorkbook(
      read,
      resolveImportOptions(options),
      {
        formulasEnabled: false,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
        ...context,
      },
      dropped,
    );

    mapped[kind] = { result, dropped: dropped.list() };
  }

  return mapped;
}

describe('mapWorkbook on number formats a spreadsheet app writes, whichever engine read the file', () => {
  it('should type a backslash-escaped currency column as a currency', async() => {
    // LibreOffice saves `"$"#,##0.00` as `\$#,##0.00`. The built-in engine read it as a plain
    // number and the column lost its symbol; ExcelJS unescapes the code before the inference sees it.
    const mapped = await mapWithBothEngines((sheet) => {
      sheet.cell(1, 1).value = 1234.5;
      sheet.cell(1, 1).numFmt = '\\$#,##0.00';
      sheet.cell(1, 2).value = 1234.5;
      sheet.cell(1, 2).numFmt = '\\£#,##0.00';
    });

    ['native', 'exceljs'].forEach((kind) => {
      const { result } = mapped[kind];

      expect(result.columns[0].numericFormat).toEqual(expect.objectContaining({ style: 'currency', currency: 'USD' }));
      expect(result.columns[1].numericFormat).toEqual(expect.objectContaining({ style: 'currency', currency: 'GBP' }));
    });
  });

  it('should keep the whole days of a duration past 24 hours, and report the format', async() => {
    // `[h]:mm` at 25:30 imported as `01:30:00` and 48:00 as `00:00:00`, so a re-export wrote
    // 0.0625 and 0 where the file had 1.0625 and 2, with nothing in `dropped`.
    const mapped = await mapWithBothEngines((sheet) => {
      [25.5 / 24, 0.5, 2].forEach((value, index) => {
        sheet.cell(index + 1, 1).value = value;
        sheet.cell(index + 1, 1).numFmt = '[h]:mm';
      });
    });

    ['native', 'exceljs'].forEach((kind) => {
      const { result, dropped } = mapped[kind];

      expect(result.data.map(row => row[0])).toEqual([25.5 / 24, '12:00:00', 2]);
      expect(dropped).toContain('numFmt:[h]:mm');
    });
  });

  it('should keep the time of a built-in id 22 date-time on both engines', async() => {
    // The native writer stores `m/d/yy h:mm` as built-in id 22 with no `<numFmt>` entry, the way
    // Excel stores a typed date-time. ExcelJS answers id 22 as `m/d/yy "h":mm`, which read as a date,
    // so the ExcelJS engine imported `2024-01-01` and the time was gone from the data.
    const mapped = await mapWithBothEngines((sheet) => {
      sheet.cell(1, 1).value = 45292.5625;
      sheet.cell(1, 1).numFmt = 'm/d/yy h:mm';
    }, {}, {}, 'native');

    ['native', 'exceljs'].forEach((kind) => {
      const { result } = mapped[kind];

      expect(result.data[0][0]).toBe('2024-01-01 13:30:00');
      expect(result.columns[0].type).toBe('intl-datetime');
    });
  });

  it('should import a falsy cached formula result on both engines, with the Formulas plugin off', async() => {
    const mapped = await mapWithBothEngines((sheet) => {
      sheet.cell(1, 1).value = 1;
      sheet.cell(1, 2).value = 2;
      sheet.cell(2, 1).formula = { text: 'A1>B1', result: false };
      sheet.cell(2, 2).formula = { text: 'A1-A1', result: 0 };
    });

    ['native', 'exceljs'].forEach((kind) => {
      expect(mapped[kind].result.data[1]).toEqual([false, 0]);
    });
  });

  it('should import the cached value of a formula over a defined name the Formulas engine lacks', async() => {
    // Neither reader carried `<definedNames>` and the mapper handed `=SUM(Sales)` to HyperFormula,
    // which showed `#NAME?` with nothing in `dropped`, while the file held 60 as the cached value.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');

    ws.getCell('B2').value = 10;
    ws.getCell('B3').value = 20;
    ws.getCell('B4').value = 30;
    ws.getCell('F1').value = 0.07;
    wb.definedNames.add('Data!$B$2:$B$4', 'Sales');
    wb.definedNames.add('Data!$F$1', 'Rate');
    ws.getCell('D2').value = { formula: 'SUM(Sales)', result: 60 };
    ws.getCell('D3').value = { formula: 'Rate*100', result: 7 };
    ws.getCell('D4').value = { formula: 'SUM(B2:B4)', result: 60 };

    const bytes = toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer()));

    for (const [adapter, engine] of [[nativeAdapter, undefined], [excelJsAdapter, ExcelJS]]) {
      const dropped = new DroppedFeatures();
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const read = await adapter.read(bytes, engine, dropped);

      expect(read.definedNames.map(({ name }) => name)).toEqual(expect.arrayContaining(['Sales', 'Rate']));

      const unknown = mapWorkbook(read, resolveImportOptions({}), {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
        formulaNamedExpressions: new Set(),
      }, dropped);

      expect(unknown.data.map(row => row[3])).toEqual([null, 60, 7, '=SUM(B2:B4)']);
      expect(dropped.list()).toContain('formula:definedName');

      const knownDropped = new DroppedFeatures();
      const known = mapWorkbook(read, resolveImportOptions({}), {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
        formulaNamedExpressions: new Set(['sales', 'rate']),
      }, knownDropped);

      if (adapter === nativeAdapter) {
        expect(known.data.map(row => row[3])).toEqual([null, '=SUM(Sales)', '=Rate*100', '=SUM(B2:B4)']);
        expect(knownDropped.list()).not.toContain('formula:definedName');
      } else {
        // ExcelJS flags every name it reads (it loses the scope), so an engine name spelled like it
        // never keeps the formulas live.
        expect(known.data.map(row => row[3])).toEqual([null, 60, 7, '=SUM(B2:B4)']);
        expect(knownDropped.list()).toContain('formula:definedName');
      }
    }
  });

  it('should not read a word of a quoted sheet name as a defined name', () => {
    // `'Sales Data'!A1` names a sheet. Its `Sales` used to match the workbook's defined name, so a
    // formula over a sheet the engine holds was imported as its cached value.
    const sheet = new SheetBuilder('Data');

    sheet.cell(1, 1).formula = { text: '\'Sales Data\'!A1+1', result: 2 };
    sheet.cell(1, 2).formula = { text: 'Sales+\'Sales Data\'!A1', result: 3 };

    const snapshot = createWorkbookSnapshot();

    snapshot.sheets.push(sheet.toSnapshot());
    snapshot.definedNames = [{ name: 'Sales', formula: 'Data!$B$2:$B$4', sheetName: null }];

    const dropped = new DroppedFeatures();
    const mapped = mapWorkbook(snapshot, resolveImportOptions({}), {
      formulasEnabled: true,
      commentsEnabled: false,
      customBordersEnabled: false,
      entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
      formulaSheetNames: new Set(['sales data']),
      formulaNamedExpressions: new Set(),
    }, dropped);

    expect(mapped.data[0]).toEqual(['=\'Sales Data\'!A1+1', 3]);
    expect(dropped.list()).toContain('formula:definedName');
  });

  it('should report cellStyles on values.xlsx through ExcelJS only, which pins the engines\' difference', async() => {
    // ExcelJS resolves a cell's default font and fill into a style object whenever the cell carries a
    // format index, so it reports styling the file never applied; the built-in reader does not. The
    // snapshot-level parity hides this (normalization #3), so the mapped result pins both values.
    const dropped = {};

    const legs = [['native', nativeAdapter, undefined], ['exceljs', excelJsAdapter, ExcelJS]];

    for (const [kind, adapter, engine] of legs) {
      const recorder = new DroppedFeatures();
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const read = await adapter.read(fixture('values'), engine, recorder);

      mapWorkbook(read, resolveImportOptions({}), {
        formulasEnabled: false,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
      }, recorder);
      dropped[kind] = recorder.list();
    }

    expect(dropped.native).not.toContain('cellStyles');
    expect(dropped.exceljs).toContain('cellStyles');
  });
});

describe('ImportFile on a modular bundle that registers only some modules', () => {
  beforeAll(() => {
    // Nothing in this file registers a cell type, so the registry is empty except for this one:
    // the setup the reviewer measured (`registerCellType` for a few types, not all).
    registerCellType('numeric', {});
  });

  it('should fall back to text for an inferred cell type that is not registered, and report it', async() => {
    // `values.xlsx` infers numeric, checkbox, date and time columns. Applying an unregistered type
    // used to throw from `getCellType` after `loadData`, leaving the grid half imported.
    const { plugin, calls } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { colHeaders: 'firstRow' });
    const types = result.columns.map(column => column.type);

    expect(types).toContain('numeric');
    expect(types).not.toContain('checkbox');
    expect(types).not.toContain('date');
    expect(types).not.toContain('time');
    expect(result.columns.some(column => column.dateFormat || column.timeFormat)).toBe(false);
    expect(result.columns.find(column => column.type === 'numeric').numericFormat).toBeDefined();
    expect(result.dropped).toEqual(expect.arrayContaining(['cellType:checkbox', 'cellType:date', 'cellType:time']));
    expect(result.dropped).not.toContain('cellType:numeric');

    const applied = calls.find(call => call[0] === 'updateSettings')[1];

    expect(applied.columns.every(column => column.type === undefined || column.type === 'text'
      || column.type === 'numeric')).toBe(true);
  });

  it('should fall back per cell, keeping the shared meta object of a registered type untouched', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');

    // A dropdown column with one numeric outlier, and the reverse, so both `columns` and `cellsMeta`
    // carry types.
    for (let row = 1; row <= 4; row++) {
      ws.getCell(row, 1).value = 'Red';
      ws.getCell(row, 1).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Red,Green"'] };
    }

    ws.getCell(4, 1).dataValidation = undefined;
    ws.getCell(4, 1).value = 5;
    ws.getCell(4, 1).numFmt = '0.00';

    const bytes = toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer()));
    const result = await plugin.importFromArrayBuffer('xlsx', bytes);
    const metas = [...(result.columns ?? []), ...(result.cellsMeta ?? []).map(entry => entry.meta)];

    expect(metas.some(meta => meta.type === 'dropdown')).toBe(false);
    expect(metas.some(meta => meta.source !== undefined)).toBe(false);
    expect(result.dropped).toContain('cellType:dropdown');
  });

  it('should leave the inferred types alone when the result is not applied', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('values'), { apply: false });

    expect(result.columns.map(column => column.type)).toContain('checkbox');
    expect(result.dropped.some(name => name.startsWith('cellType:'))).toBe(false);
  });

  it('should report merges and hidden rows and columns when their plugins are not registered', async() => {
    const { plugin, hot } = pluginWithFakeHot(true);
    const withoutPlugins = await plugin.importFromArrayBuffer('xlsx', fixture('layout'));

    expect(withoutPlugins.mergeCells?.length).toBeGreaterThan(0);
    expect(withoutPlugins.dropped).toContain('mergeCells');

    ['hiddenRows', 'hiddenColumns'].forEach((key) => {
      if (withoutPlugins[key]?.length > 0) {
        expect(withoutPlugins.dropped).toContain(key);
      } else {
        expect(withoutPlugins.dropped).not.toContain(key);
      }
    });

    const registered = { mergeCells: {}, hiddenRows: {}, hiddenColumns: {} };
    const original = hot.getPlugin;

    hot.getPlugin = name => registered[name] ?? original(name);

    const withPlugins = await plugin.importFromArrayBuffer('xlsx', fixture('layout'));

    expect(withPlugins.dropped).not.toContain('mergeCells');
    expect(withPlugins.dropped).not.toContain('hiddenRows');
    expect(withPlugins.dropped).not.toContain('hiddenColumns');
  });

  it('should not report a missing layout plugin when the result is not applied', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('layout'), { apply: false });

    expect(result.dropped).not.toContain('mergeCells');
  });
});

describe('ImportFile lifecycle guards around beforeImport', () => {
  it('should reject, and not apply, when the plugin was disabled while the file was being read', async() => {
    let plugin;
    const engine = {
      Workbook: class extends ExcelJS.Workbook {
        constructor() {
          super();

          const load = this.xlsx.load.bind(this.xlsx);

          this.xlsx.load = async(buffer) => {
            const loaded = await load(buffer);

            // What `updateSettings({ importFile: false })` does to the plugin mid-read.
            plugin.disablePlugin();

            return loaded;
          };
        }
      },
    };

    const fake = pluginWithFakeHot({ engines: { xlsx: engine } });

    ({ plugin } = fake);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).rejects.toThrow(/plugin is disabled/);
    expect(fake.calls.map(call => call[0])).toEqual([]);
    // Nothing reached the grid, so no dropped feature is reported for it (review round 12).
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject a read that a disable and re-enable crossed, though the plugin is on again', async() => {
    // `importFile: false` then `true` during the read (review round 12): the enabled check at apply
    // time saw the plugin on again, and the stale import ran `loadData` and `afterImport`.
    let plugin;
    const engine = {
      Workbook: class extends ExcelJS.Workbook {
        constructor() {
          super();

          const load = this.xlsx.load.bind(this.xlsx);

          this.xlsx.load = async(buffer) => {
            const loaded = await load(buffer);

            plugin.disablePlugin();
            plugin.enablePlugin();

            return loaded;
          };
        }
      },
    };

    const fake = pluginWithFakeHot({ engines: { xlsx: engine } });

    ({ plugin } = fake);

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values')))
      .rejects.toThrow(/the plugin was disabled while the file was being read/);
    expect(fake.calls.map(call => call[0])).toEqual([]);
  });

  it('should reject with a Handsontable error, not a TypeError, when beforeImport destroys the grid', async() => {
    const { plugin, hooks, calls } = pluginWithFakeHot(true);

    hooks.beforeImport = () => {
      plugin.destroy();
    };

    const rejection = plugin.importFromArrayBuffer('xlsx', fixture('values'));

    await expect(rejection).rejects.toThrow(/ImportFile: the Handsontable instance was destroyed/);
    await expect(rejection).rejects.not.toThrow(TypeError);
    expect(calls.map(call => call[0])).toEqual(['beforeImport']);
  });

  it('should say the grid was destroyed before the import was applied, not during the read', async() => {
    // The read has finished when `beforeImport` runs, so "while the workbook was being read" named
    // the wrong step.
    const { plugin, hooks } = pluginWithFakeHot(true);

    hooks.beforeImport = () => {
      plugin.destroy();
    };

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).rejects
      .toThrow('ImportFile: the Handsontable instance was destroyed before the import was applied.');

    const fromBlob = pluginWithFakeHot(true);

    fromBlob.hooks.beforeImport = () => {
      fromBlob.plugin.destroy();
    };

    await expect(fromBlob.plugin.importFromBlob('xlsx', new Blob([fixture('values')]))).rejects
      .toThrow('ImportFile: the Handsontable instance was destroyed before the import was applied.');
  });

  it('should say the instance is destroyed, not that the plugin is disabled, for an import after destroy()', async() => {
    // A destroyed plugin is also not `enabled`, so the call used to blame `importFile: false`.
    const { plugin } = pluginWithFakeHot(true);

    plugin.destroy();

    const rejection = plugin.importFromArrayBuffer('xlsx', fixture('values'));

    await expect(rejection).rejects
      .toThrow(/ImportFile: the Handsontable instance is destroyed, so nothing can be imported/);
    await expect(rejection).rejects.not.toThrow(/plugin is disabled/);
  });
});

describe('ImportFile#importFromArrayBuffer on an ArrayBuffer view', () => {
  it('should read a Uint8Array subarray of a larger buffer through the built-in engine', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const bytes = new Uint8Array(fixture('values'));
    // Another workbook follows the view, so a view read past its own end opens that one instead:
    // zero padding would hide it, because the ZIP reader tolerates trailing zeros.
    const trailing = new Uint8Array(fixture('layout'));
    const padded = new Uint8Array(8 + bytes.byteLength + trailing.byteLength);

    padded.set(bytes, 8);
    padded.set(trailing, 8 + bytes.byteLength);

    const view = padded.subarray(8, 8 + bytes.byteLength);
    const result = await plugin.importFromArrayBuffer('xlsx', view, { apply: false });

    expect(result.sheetNames).toEqual(['Values']);

    const fromDataView = await plugin.importFromArrayBuffer(
      'xlsx', new DataView(padded.buffer, 8, bytes.byteLength), { apply: false }
    );

    expect(fromDataView.sheetNames).toEqual(['Values']);
  });
});

describe('DroppedFeatures on a file-driven name', () => {
  it('should replace the bidi formatting controls, as it does the C0 and C1 controls', () => {
    const dropped = new DroppedFeatures();
    const controls = ['\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2066', '\u2067', '\u2068', '\u2069'];

    dropped.recordUnsupported('numFmt', `0.00E+00"${controls.join('')}evil"`);

    const [name] = dropped.list();

    controls.forEach(control => expect(name).not.toContain(control));
    expect(name).toBe(`numFmt:0.00E+00"${'\uFFFD'.repeat(controls.length)}evil"`);
    // The neighbors of both ranges are not controls and stay.
    dropped.recordUnsupported('numFmt', '\u2029\u202F\u2065\u206A');
    expect(dropped.list()[1]).toBe('numFmt:\u2029\u202F\u2065\u206A');
  });
});

describe('ImportFile and the Formulas engine\'s named expressions', () => {
  it('should keep a formula live over a name the engine defines and import the cached value otherwise', async() => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');

    ws.getCell('B2').value = 10;
    ws.getCell('B3').value = 20;
    ws.getCell('B4').value = 30;
    ws.getCell('F1').value = 0.07;
    wb.definedNames.add('Data!$B$2:$B$4', 'Sales');
    wb.definedNames.add('Data!$F$1', 'Rate');
    ws.getCell('D2').value = { formula: 'SUM(Sales)', result: 60 };
    ws.getCell('D3').value = { formula: 'Rate*100', result: 7 };

    const bytes = toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer()));
    const { plugin, hot } = pluginWithFakeHot(true);
    const listNamedExpressions = jest.fn(() => ['SALES']);

    hot.getPlugin = name => ({
      formulas: {
        isEnabled: () => true,
        enabled: true,
        flushEngineEvaluation: () => {},
        engine: { getSheetNames: () => ['Data'], listNamedExpressions },
      },
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(listNamedExpressions).toHaveBeenCalled();
    // `SALES` is matched case-insensitively and stays live; `Rate` is missing from the engine.
    expect(result.data[1][3]).toBe('=SUM(Sales)');
    expect(result.data[2][3]).toBe(7);
    expect(result.dropped).toContain('formula:definedName');
  });
});

describe('ImportFile and bare TRUE and FALSE in a real HyperFormula engine', () => {
  it('should evaluate imported booleans and a name defined as TRUE instead of showing #NAME?', async() => {
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Data');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ formula: { text: 'IF(TRUE,1,2)', result: 1 } }), at({ value: true })],
      [at({ formula: { text: 'AND(B1,FALSE)', result: false } })],
      [at({ formula: { text: 'IF(Flag,"yes","no")', result: 'yes' } })],
    ];
    snapshot.sheets.push(sheet);
    snapshot.definedNames = [{ name: 'Flag', formula: 'TRUE', sheetName: null }];

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(result.data.map(row => row[0])).toEqual(['=IF(TRUE(),1,2)', '=AND(B1,FALSE())', '=IF(Flag,"yes","no")']);
    expect(result.namedExpressions).toEqual([{ name: 'Flag', formula: 'TRUE()' }]);

    result.namedExpressions.forEach(({ name, formula }) => hf.addNamedExpression(name, `=${formula}`));
    hf.setSheetContent(0, result.data);

    expect([0, 1, 2].map(row => hf.getCellValue({ sheet: 0, row, col: 0 }))).toEqual([1, false, 'yes']);

    hf.destroy();
  });
});

describe('ImportFile and the workbook\'s defined names in a real HyperFormula engine', () => {
  /**
   * A `Data` workbook with a header row: `G2:G4` holds 10, 20, 30 under the names `Sales` (absolute)
   * and `Relative` (`Data!G2`, legal in Excel), `C2` sums `Sales` and `C3` reads `Relative`.
   *
   * @param {object[]} [names] The workbook's defined names.
   * @returns {Promise<ArrayBuffer>}
   */
  async function salesBytes(names = [
    { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null },
    { name: 'Relative', formula: 'Data!G2', sheetName: null },
  ]) {
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Data');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const row = (formula, amount) => [
      null, null, formula ? at({ formula }) : null, null, null, null, at({ value: amount }),
    ];

    sheet.rows = [
      [null, null, null, null, null, null, at({ value: 'Amount' })],
      row({ text: 'SUM(Sales)', result: 60 }, 10),
      row({ text: 'Relative*2', result: 20 }, 20),
      row(null, 30),
    ];
    snapshot.sheets.push(sheet);
    // Written by the built-in writer: ExcelJS turns `Data!G2` into `Data!$G$2` on the way out.
    snapshot.definedNames = names;

    return toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
  }

  it('should hand over names HyperFormula takes, and evaluate the imported formula over them', async() => {
    const bytes = await salesBytes();

    // ExcelJS 4.4's model does not hold the relative `Relative` at all, so the adapter reads the
    // names from the workbook part; like every name on that engine it is flagged, and both formulas
    // import their cached values. Its formula used to stay live and show `#NAME?`.
    for (const [kind, engine, relativeCell, relativeDropped, salesCell, names] of [
      ['native', undefined, 20, ['definedNames:unsupported', 'formula:definedName'], '=SUM(Sales)',
        [{ name: 'Sales', formula: 'Sheet1!$G$1:$G$3' }]],
      ['exceljs', ExcelJS, 20, ['definedNames:unsupported', 'formula:definedName'], 60, []],
    ]) {
      const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

      hf.addSheet('Sheet1');

      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, {
        apply: false, engine, colHeaders: 'firstRow',
      });

      // An unqualified `$G$1:$G$3` is relative to HyperFormula, so the name keeps the grid's sheet.
      expect([kind, result.namedExpressions ?? []]).toEqual([kind, names]);
      // `Data!G2` is relative: `isItPossibleToAddNamedExpression` answers false, nothing throws.
      expect([kind, result.dropped]).toEqual([kind, relativeDropped]);
      expect([kind, result.data[0][2], result.data[1][2]]).toEqual([kind, salesCell, relativeCell]);

      (result.namedExpressions ?? []).forEach(({ name, formula }) => hf.addNamedExpression(name, `=${formula}`));
      hf.setSheetContent(0, result.data);

      expect([kind, hf.getCellValue({ sheet: 0, row: 0, col: 2 })]).toEqual([kind, 60]);

      hf.destroy();
    }
  });

  it('should import the cached value of a formula over a whole-column name on the ExcelJS engine', async() => {
    // ExcelJS 4.4's model drops a whole-column name, so `=SUM(Sales)` imported live, showed `#NAME?`,
    // and nothing was reported. The built-in engine takes the name.
    const bytes = await salesBytes([{ name: 'Sales', formula: 'Data!$G:$G', sheetName: null }]);

    for (const [kind, engine, salesCell, dropped] of [
      ['native', undefined, '=SUM(Sales)', []],
      ['exceljs', ExcelJS, 60, ['definedNames:unsupported', 'formula:definedName']],
    ]) {
      const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

      hf.addSheet('Sheet1');

      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, {
        apply: false, engine, colHeaders: 'firstRow',
      });

      expect([kind, result.data[0][2], result.dropped]).toEqual([kind, salesCell, dropped]);

      hf.destroy();
    }
  });

  it('should import the cached value of a formula over a name too long to read or scoped to no sheet', async() => {
    // The native reader used to drop both names, so `=SUM(Sales)` and `=Relative*2` imported live and
    // showed `#NAME?`, losing the values the file holds.
    const tooLong = `IF(TRUE(),Data!$G$2:$G$4,"${'a'.repeat(MAX_FORMULA_LENGTH)}")`;
    const written = await salesBytes([
      { name: 'Sales', formula: tooLong, sheetName: null },
      { name: 'Relative', formula: 'Data!$G$2', sheetName: null },
    ]);
    const bytes = await rewriteArchive(written, (part, text) => (part === 'xl/workbook.xml'
      ? text.replace('<definedName name="Relative">', '<definedName name="Relative" localSheetId="7">')
      : text));
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false, colHeaders: 'firstRow' });

    expect(result.namedExpressions ?? []).toEqual([]);
    expect([result.data[0][2], result.data[1][2]]).toEqual([60, 20]);
    expect(result.formulas).toEqual(expect.arrayContaining([
      expect.objectContaining({ formula: 'SUM(Sales)' }),
      expect.objectContaining({ formula: 'Relative*2' }),
    ]));
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);

    hf.destroy();
  });

  it('should import the cached value of a formula over a name ExcelJS read, which loses the name\'s scope', async() => {
    // `Rate` is defined twice: workbook-wide over Sheet1's 1, and for Sheet2 over Sheet2's 42. ExcelJS
    // keeps only the Sheet2 one, as workbook-wide, so registering it made `=Rate*100` 4200, not 100.
    const snapshot = createWorkbookSnapshot();
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const first = createSheetSnapshot('Sheet1');
    const second = createSheetSnapshot('Sheet2');

    first.rows = [
      [at({ value: 'Rate' }), at({ value: 'Total' })],
      [at({ value: 1 }), at({ formula: { text: 'Rate*100', result: 100 } })],
    ];
    second.rows = [[at({ value: 'Rate' })], [at({ value: 42 })]];
    snapshot.sheets.push(first, second);
    snapshot.definedNames = [
      { name: 'Rate', formula: 'Sheet1!$A$2', sheetName: null },
      { name: 'Rate', formula: 'Sheet2!$A$2', sheetName: 'Sheet2' },
    ];

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));

    for (const [kind, engine, cell, names] of [
      ['native', undefined, '=Rate*100', [{ name: 'Rate', formula: 'Sheet1!$A$1' }]],
      ['exceljs', ExcelJS, 100, []],
    ]) {
      // The engine holds both sheets, as a shared engine does.
      const hf = HyperFormula.buildFromSheets({ Sheet1: [], Sheet2: [[42]] }, { licenseKey: 'gpl-v3' });
      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, {
        apply: false, engine, colHeaders: 'firstRow',
      });

      expect([kind, result.namedExpressions ?? []]).toEqual([kind, names]);
      expect([kind, result.data[0][1]]).toEqual([kind, cell]);

      if (kind === 'exceljs') {
        expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
      }

      hf.destroy();
    }
  });

  it('should import a formula over a name of several areas as its cached value, on both engines', async() => {
    // HyperFormula has no union reference, so the name cannot be registered; the formula must keep
    // the value the file holds. The ExcelJS reader used to leave the name out, and the formula then
    // imported live as `#NAME?`.
    const bytes = await salesBytes([{ name: 'Sales', formula: 'Data!$G$2,Data!$G$4', sheetName: null }]);

    for (const [kind, engine] of [['native', undefined], ['exceljs', ExcelJS]]) {
      const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

      hf.addSheet('Sheet1');

      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, {
        apply: false, engine, colHeaders: 'firstRow',
      });

      expect([kind, result.namedExpressions ?? []]).toEqual([kind, []]);
      expect([kind, result.data[0][2]]).toEqual([kind, 60]);
      expect([kind, result.dropped]).toEqual([kind, ['definedNames:unsupported', 'formula:definedName']]);

      hf.destroy();
    }
  });

  /**
   * Imports `bytes` with `apply: false` into a fake grid whose Formulas plugin holds `hf`.
   *
   * @param {object} hf The HyperFormula instance.
   * @param {ArrayBuffer} bytes The file.
   * @param {string} [sheetName] The engine's name for the grid's sheet.
   * @returns {Promise<object>} The import result.
   */
  function importInto(hf, bytes, sheetName = 'Sheet1') {
    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({ formulas: runningFormulasPlugin(hf, sheetName) })[name];

    return plugin.importFromArrayBuffer('xlsx', bytes, { apply: false, colHeaders: 'firstRow' });
  }

  it('should keep a re-imported name live when unchanged, and import its formulas cached when it changed', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const sales = formula => [{ name: 'Sales', formula, sheetName: null }];
    const first = await importInto(hf, await salesBytes(sales('Data!$G$2:$G$4')));

    // What the applier does: the names first, then the data.
    first.namedExpressions.forEach(({ name, formula }) => hf.addNamedExpression(name, `=${formula}`));
    hf.setSheetContent(0, first.data);

    // The same file again, its definition spelled differently: HyperFormula's normal form matches.
    const same = await importInto(hf, await salesBytes(sales('data!$g$2:$G$4')));

    expect(same.namedExpressions).toBeUndefined();
    expect(same.data[0][2]).toBe('=SUM(Sales)');
    expect(same.dropped).not.toContain('definedNames:unsupported');

    // An updated file whose `Sales` covers two rows: the engine's three-row `Sales` would read 60.
    const changed = await importInto(hf, await salesBytes(sales('Data!$G$2:$G$3')));

    expect(changed.namedExpressions).toBeUndefined();
    expect(changed.data[0][2]).toBe(60);
    expect(changed.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));

    hf.destroy();
  });

  it('should leave out a definition HyperFormula cannot parse, which isItPossibleToAddNamedExpression accepts', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    expect(hf.isItPossibleToAddNamedExpression('Broken', '=SUM(')).toBe(true);

    const result = await importInto(hf, await salesBytes([{ name: 'Broken', formula: 'SUM(', sheetName: null }]));

    expect(result.namedExpressions).toBeUndefined();
    expect(result.dropped).toContain('definedNames:unsupported');

    hf.destroy();
  });

  it('should keep a formula live over a name the engine holds as a constant equal to the file\'s', async() => {
    // `addNamedExpression('TaxRate', 0.07)` stores no formula (`getNamedExpressionFormula` answers
    // `undefined`), and the export writes the constant as the literal `0.07`. Re-importing that
    // file used to freeze every formula over the name to its cached value.
    const constantBytes = async(names) => {
      const snapshot = createWorkbookSnapshot();
      const sheet = createSheetSnapshot('Data');
      const at = overrides => ({ ...createCellSnapshot(), ...overrides });

      sheet.rows = [
        [at({ value: 'Amount' }), at({ value: 'Tax' }), at({ value: 'Label' }), at({ value: 'On' })],
        [at({ value: 100 }), at({ formula: { text: 'TaxRate*A2', result: 7 } }),
          at({ formula: { text: 'Label&"!"', result: 'net!' } }), at({ formula: { text: 'IF(Flag,1,0)', result: 1 } })],
      ];
      snapshot.sheets.push(sheet);
      snapshot.definedNames = names;

      return toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
    };
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');
    hf.addNamedExpression('TaxRate', 0.07);
    hf.addNamedExpression('Label', 'net');
    hf.addNamedExpression('Flag', true);

    expect(hf.getNamedExpressionFormula('TaxRate')).toBeUndefined();

    const same = await importInto(hf, await constantBytes([
      { name: 'TaxRate', formula: '0.07', sheetName: null },
      { name: 'Label', formula: '"net"', sheetName: null },
      { name: 'Flag', formula: 'TRUE()', sheetName: null },
    ]));

    expect(same.data[0].slice(1)).toEqual(['=TaxRate*A1', '=Label&"!"', '=IF(Flag,1,0)']);
    expect(same.namedExpressions).toBeUndefined();
    expect(same.dropped).toEqual([]);

    // A file whose constant changed: the engine's 0.07 would compute a tax the file does not hold.
    const changed = await importInto(hf, await constantBytes([
      { name: 'TaxRate', formula: '0.08', sheetName: null },
      { name: 'Label', formula: '"gross"', sheetName: null },
      { name: 'Flag', formula: 'TRUE()', sheetName: null },
    ]));

    expect(changed.data[0].slice(1)).toEqual([7, 'net!', '=IF(Flag,1,0)']);
    expect(changed.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));

    hf.destroy();
  });

  it('should leave out a definition nested too deep for HyperFormula instead of failing the import', async() => {
    // HyperFormula 3.3's parser overflows the stack (`RangeError`) on about 100 levels of nesting.
    const deep = `${'('.repeat(150)}1${')'.repeat(150)}`;
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    expect(() => hf.validateFormula(`=${deep}`)).toThrow(RangeError);

    const added = await importInto(hf, await salesBytes([
      { name: 'Deep', formula: deep, sheetName: null },
      { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null },
    ]));

    expect(added.namedExpressions).toEqual([{ name: 'Sales', formula: 'Sheet1!$G$1:$G$3' }]);
    expect(added.dropped).toEqual(['definedNames:unsupported']);

    // A name the engine already defines is compared with the file's definition.
    hf.addNamedExpression('Deep', '=1');

    const compared = await importInto(hf, await salesBytes([{ name: 'Deep', formula: deep, sheetName: null }]));

    expect(compared.dropped).toEqual(['definedNames:unsupported']);

    hf.destroy();
  });

  it('should leave out a name over the imported sheet when the engine has no name for the grid\'s sheet', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const result = await importInto(hf, await salesBytes(), null);

    // Without a qualifier the reference is relative to HyperFormula, which refuses it.
    expect(result.namedExpressions).toBeUndefined();
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));

    hf.destroy();
  });

  /**
   * Imports `salesBytes(names)` into a fresh engine and answers what `=SUM(Sales)` (C2) became.
   *
   * @param {object[]} names The workbook's defined names.
   * @returns {Promise<object>}
   */
  async function importSales(names) {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const result = await importInto(hf, await salesBytes(names));

    hf.destroy();

    return result;
  }

  /**
   * A defined name HyperFormula takes for each index: it refuses one that ends in a digit.
   *
   * @param {string} prefix The name's start.
   * @param {number} index The index.
   * @returns {string}
   */
  const nameAt = (prefix, index) => (
    `${prefix}${'abcdefghijklmnopqrstuvwxyz'[index % 26]}${'abc'[Math.floor(index / 26)]}`
  );

  it('should import the cached value of a formula over a definition longer than Excel allows', async() => {
    // HyperFormula parses a definition twice before taking it, at 9-27 ms per 32k characters in
    // Chrome, so 1,024 such names blocked the tab for 15-24 s. Excel caps a definition at 8,192.
    const long = (length) => {
      const head = 'IF(TRUE(),Data!$G$2:$G$4,"';

      return `${head}${'a'.repeat(length - head.length - 2)}")`;
    };
    const atCap = await importSales([{ name: 'Sales', formula: long(8192), sheetName: null }]);

    expect(atCap.data[0][2]).toBe('=SUM(Sales)');

    const tooLong = await importSales([{ name: 'Sales', formula: long(8193), sheetName: null }]);

    expect(tooLong.namedExpressions).toBeUndefined();
    expect(tooLong.data[0][2]).toBe(60);
    expect(tooLong.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
  });

  it('should import the cached values of formulas over the names past the definition budget', async() => {
    // 256 Ki characters of definitions per import: the names read first are handed over, `Sales`,
    // read once the budget is spent, is not, and its definition is never parsed.
    const filler = Array.from({ length: 40 }, (_, index) => ({
      name: nameAt('Filler', index), formula: `LEN("${'a'.repeat(7000)}")`, sheetName: null,
    }));
    const result = await importSales([...filler, { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null }]);
    const handedOver = Math.floor((256 * 1024) / filler[0].formula.length);

    expect(result.namedExpressions.map(({ name }) => name))
      .toEqual(filler.slice(0, handedOver).map(({ name }) => name));
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
  });

  it('should not charge the definition budget for the names over the per-definition cap', async() => {
    // A definition past `MAX_DEFINED_NAME_LENGTH` is never parsed, so it spends none of the budget:
    // 40 of them used to leave `Sales`, read after them, out.
    const filler = Array.from({ length: 40 }, (_, index) => ({
      name: nameAt('Filler', index), formula: `LEN("${'a'.repeat(8200)}")`, sheetName: null,
    }));
    const result = await importSales([...filler, { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null }]);

    expect(result.namedExpressions).toEqual([{ name: 'Sales', formula: 'Sheet1!$G$1:$G$3' }]);
    expect(result.data[0][2]).toBe('=SUM(Sales)');
    expect(result.dropped).toEqual(['definedNames:unsupported']);
  });

  it('should import the cached value of a formula over a name covering more cells than the cap', async() => {
    // `addNamedExpression` evaluates the definition at once: a 2 KB file whose one name sums
    // `$A$1:$ZZ$10000` (7 million cells) took 15-46 s and about 2 GB in Chrome.
    const within = await importSales([{ name: 'Sales', formula: 'SUM(Data!$A$2:$J$10001)', sheetName: null }]);

    expect(within.data[0][2]).toBe('=SUM(Sales)');

    for (const formula of [
      'SUM(Data!$A$2:$ZZ$10001)',
      'SUM(Data!$A$2:$J$10002)',
      // A range spelled with two qualified ends, or the corners the other way round, covers the same cells.
      'SUM(Data!$J$10002:Data!$A$2)',
    ]) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const over = await importSales([{ name: 'Sales', formula, sheetName: null }]);

      expect([formula, over.namedExpressions, over.data[0][2]]).toEqual([formula, undefined, 60]);
      expect(over.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
    }

    // A whole column costs HyperFormula the rows its sheet holds, so one column of a small sheet
    // stays well within the cap.
    for (const formula of ['Data!$G:$G', 'SUM(Data!$B:$B)']) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const column = await importSales([{ name: 'Sales', formula, sheetName: null }]);

      expect([formula, column.namedExpressions.map(({ name }) => name)]).toEqual([formula, ['Sales']]);
    }
  });

  it('should import the cached value of a formula over a name spanning every row or column of a sheet', async() => {
    // HyperFormula sizes a whole row to the sheet's columns and a whole column to its rows:
    // `SUM(Sheet1!$1:$1048576)` took 1.9 s and 1.3 GB on a 3x3 sheet, and `SUM(Sheet1!$A:$XFD)` ran
    // out of memory on 1,000 rows, while neither counted against the cap.
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Data');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ value: 'Amount' }), null, at({ value: 'Total' })],
      [at({ value: 1 }), at({ value: 2 }), at({ formula: { text: 'SUM(Sales)', result: 60 } })],
      ...Array.from({ length: 999 }, (_, index) => [at({ value: index }), at({ value: 1 })]),
    ];
    snapshot.sheets.push(sheet);

    const importOver = async(formula) => {
      const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

      hf.addSheet('Sheet1');
      snapshot.definedNames = [{ name: 'Sales', formula, sheetName: null }];

      const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
      const result = await importInto(hf, bytes);

      hf.destroy();

      return result;
    };

    // `Data!$1:...` reaches into the dropped header row and is left out for that, so the span starts below it.
    for (const formula of ['SUM(Data!$2:$1048576)', 'SUM(Data!$A:$XFD)']) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const over = await importOver(formula);

      expect([formula, over.namedExpressions, over.data[0][2]]).toEqual([formula, undefined, 60]);
      expect(over.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
    }

    // One column of the same 1,000 rows stays well within the cap.
    const column = await importOver('SUM(Data!$B:$B)');

    expect(column.namedExpressions).toEqual([{ name: 'Sales', formula: 'SUM(Sheet1!$B:$B)' }]);
    expect(column.data[0][2]).toBe('=SUM(Sales)');
  });

  it('should size a whole column in a name by the rows the grid\'s engine sheet holds before the import', async() => {
    // The engine evaluates the names before the imported data replaces the grid's sheet, so a whole
    // column costs the rows that sheet holds then (20,000), not the 3 rows of the file.
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');
    hf.setCellContents({ sheet: hf.getSheetId('Sheet1'), row: 19999, col: 9 }, 1);

    const names = [{ name: 'Sales', formula: 'SUM(Data!$A:$J)', sheetName: null }];
    const result = await importInto(hf, await salesBytes(names));

    expect(result.namedExpressions).toBeUndefined();
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);

    hf.destroy();
  });

  it('should size a whole column on another engine sheet by the rows that sheet holds', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');
    hf.addSheet('Other');
    hf.setCellContents({ sheet: hf.getSheetId('Other'), row: 29999, col: 0 }, 1);

    // 4 columns of 30,000 rows: past the cap, though the imported sheet holds 4 rows.
    const names = [{ name: 'Sales', formula: 'SUM(Other!$A:$D)', sheetName: null }];
    const result = await importInto(hf, await salesBytes(names));

    expect(result.namedExpressions).toBeUndefined();
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);

    hf.destroy();
  });

  it('should import the cached values of formulas over the names past the workbook\'s cell budget', async() => {
    // Each name within the per-name cap, but together past the budget of one import.
    const names = Array.from({ length: 12 }, (_, index) => ({
      name: nameAt('Block', index), formula: `SUM(Data!$A$${index + 2}:$J$${index + 10001})`, sheetName: null,
    }));
    const result = await importSales([...names, { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null }]);

    expect(result.namedExpressions.map(({ name }) => name)).toEqual(names.slice(0, 10).map(({ name }) => name));
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
  });

  it('should not charge the workbook\'s cell budget for the names the engine refuses', async() => {
    // HyperFormula refuses a name that reads like a cell (`Blocka1`) without evaluating it, so it
    // costs nothing: 11 of them over 100,000 cells each used to leave `Sales` out.
    const refused = Array.from({ length: 11 }, (_, index) => ({
      name: `Block${'abcdefghijk'[index]}1`, formula: 'SUM(Data!$A$2:$J$10001)', sheetName: null,
    }));
    const result = await importSales([...refused, { name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null }]);

    expect(result.namedExpressions).toEqual([{ name: 'Sales', formula: 'Sheet1!$G$1:$G$3' }]);
    expect(result.data[0][2]).toBe('=SUM(Sales)');
    expect(result.dropped).toEqual(['definedNames:unsupported']);
  });

  /**
   * A `Data` workbook with a header row, `C2` holding one formula over the given names.
   *
   * @param {string} text The formula, without `=`.
   * @param {*} cached Its cached value.
   * @param {object[]} names The workbook's defined names.
   * @returns {Promise<ArrayBuffer>}
   */
  async function formulaBytes(text, cached, names) {
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Data');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ value: 'A' }), at({ value: 'B' }), at({ value: 'C' })],
      [at({ value: 1 }), null, at({ formula: { text, result: cached } })],
    ];
    snapshot.sheets.push(sheet);
    snapshot.definedNames = names;

    return toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
  }

  it('should keep a formula live over an error constant the engine holds too, and cached when the error differs', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');
    hf.addNamedExpression('Missing', '#N/A');

    // An error is a fresh object on every read: it is compared by its code.
    const same = await importInto(hf, await formulaBytes('IFERROR(Missing,5)', 5, [
      { name: 'Missing', formula: '#N/A', sheetName: null },
    ]));

    expect(same.data[0][2]).toBe('=IFERROR(Missing,5)');
    expect(same.dropped).toEqual([]);

    const changed = await importInto(hf, await formulaBytes('IFERROR(Missing,5)', 5, [
      { name: 'Missing', formula: '#DIV/0!', sheetName: null },
    ]));

    expect(changed.data[0][2]).toBe(5);
    expect(changed.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);

    hf.destroy();
  });

  it('should compare a name the engine defines on the grid\'s sheet, which shadows the file\'s', async() => {
    // HyperFormula resolves a sheet-scoped name first, so `=SUM(Sales)` read the engine's `Sales`,
    // not the file's, and nothing was reported.
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');
    hf.addNamedExpression('Sales', '=Sheet1!$A$1', hf.getSheetId('Sheet1'));

    const names = [{ name: 'Sales', formula: 'Data!$G$2:$G$4', sheetName: null }];
    const differs = await importInto(hf, await salesBytes(names));

    expect(differs.namedExpressions).toBeUndefined();
    expect(differs.data[0][2]).toBe(60);
    expect(differs.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);

    hf.changeNamedExpression('Sales', '=Sheet1!$G$1:$G$3', hf.getSheetId('Sheet1'));

    const same = await importInto(hf, await salesBytes(names));

    expect(same.namedExpressions).toBeUndefined();
    expect(same.data[0][2]).toBe('=SUM(Sales)');
    expect(same.dropped).toEqual([]);

    hf.destroy();
  });

  it('should hand over a string constant with an escaped quote, and match it on a re-import', async() => {
    // Excel writes the text `a"b` as `"a""b"`, which HyperFormula's parser refuses (`validateFormula`
    // answers false), so the export's own `a"b` name froze its formulas on the way back.
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const bytes = await formulaBytes('LEN(Quote)', 3, [{ name: 'Quote', formula: '"a""b"', sheetName: null }]);
    const first = await importInto(hf, bytes);

    expect(first.namedExpressions).toEqual([{ name: 'Quote', formula: '"a""b"' }]);
    expect(first.data[0][2]).toBe('=LEN(Quote)');
    expect(first.dropped).toEqual([]);

    // What the applier adds: the text itself, a constant.
    hf.addNamedExpression('Quote', '\'a"b');

    expect(hf.getNamedExpressionValue('Quote')).toBe('a"b');

    const again = await importInto(hf, bytes);

    expect(again.namedExpressions).toBeUndefined();
    expect(again.data[0][2]).toBe('=LEN(Quote)');
    expect(again.dropped).toEqual([]);

    hf.destroy();
  });

  it('should import the cached value of a formula over a name calling a function HyperFormula lacks', async() => {
    // `=UNIQUE(...)` is common in Excel 365 names. Registered, it made `=SUM(Sales)` show `#NAME?`
    // while the file holds 60, with nothing reported.
    const result = await importSales([{ name: 'Sales', formula: '_xlfn.UNIQUE(Data!$G$2:$G$4)', sheetName: null }]);

    expect(result.namedExpressions).toBeUndefined();
    expect(result.data[0][2]).toBe(60);
    expect(result.dropped).toEqual(['definedNames:unsupported', 'formula:definedName']);
  });
});

describe('ImportFile and array formulas evaluated by HyperFormula', () => {
  it('should let a dynamic array spill without #SPILL!, whichever engine read the file', async() => {
    // The spilled cells used to import their cached values, so HyperFormula's spill of D1 collided
    // with those constants and D1 showed `#SPILL!`. The built-in reader keeps D1 dynamic; ExcelJS
    // reads every array as CSE, so D1 arrives as `=ARRAYFORMULA(SEQUENCE(3))`, which spills too.
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ value: 1 }), null, null,
        at({ formula: { text: 'SEQUENCE(3)', result: 1, array: { ref: 'D1:D3', dynamic: true } } }),
        at({ formula: { text: 'A1:A2*2', result: 2, array: { ref: 'E1:E2', dynamic: false } } })],
      [at({ value: 2 }), null, null, at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), null, null, at({ value: 3 }), null],
    ];
    snapshot.sheets.push(sheet);

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));

    for (const [kind, engine, d1] of [
      ['native', undefined, '=SEQUENCE(3)'],
      ['exceljs', ExcelJS, '=ARRAYFORMULA(SEQUENCE(3))'],
    ]) {
      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: {
          isEnabled: () => true,
          enabled: true,
          flushEngineEvaluation: () => {},
          sheetName: 'Sheet1',
          engine: { getSheetNames: () => ['Sheet1'], listNamedExpressions: () => [] },
        },
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false, engine });

      expect([kind, result.data[0][3]]).toEqual([kind, d1]);
      expect([kind, result.data[0][4]]).toEqual([kind, '=ARRAYFORMULA(A1:A2*2)']);

      const hf = HyperFormula.buildFromArray(result.data, { licenseKey: 'gpl-v3' });
      const values = hf.getSheetValues(0);

      expect([kind, hf.getCellValue({ sheet: 0, row: 1, col: 3 })]).toEqual([kind, 2]);
      expect([kind, values.map(row => row[3])]).toEqual([kind, [1, 2, 3]]);
      expect([kind, values.map(row => row[4] ?? null)]).toEqual([kind, [2, 4, null]]);
      expect([kind, values.flat().filter(value => value?.type === 'SPILL')]).toEqual([kind, []]);

      hf.destroy();
    }
  });

  it('should keep the cached spilled values of a master calling a function HyperFormula lacks', async() => {
    // HyperFormula 3.3 registers no UNIQUE, so B1 shows `#NAME?` and spills nothing. Importing B2
    // empty lost the 2 the file holds.
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ value: 1 }),
        at({ formula: { text: '_xlfn.UNIQUE(A1:A3)', result: 1, array: { ref: 'B1:B2', dynamic: true } } })],
      [at({ value: 1 }), at({ value: 2 })],
      [at({ value: 2 }), null],
    ];
    snapshot.sheets.push(sheet);

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));

    expect(HyperFormula.getRegisteredFunctionNames('enGB')).not.toContain('UNIQUE');

    for (const [kind, engine, b1] of [
      ['native', undefined, '=UNIQUE(A1:A3)'],
      ['exceljs', ExcelJS, '=ARRAYFORMULA(UNIQUE(A1:A3))'],
    ]) {
      // With array arithmetic, so the built-in reader's dynamic master stays unwrapped.
      const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3', useArrayArithmetic: true });

      hf.addSheet('Sheet1');

      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false, engine });

      expect([kind, result.data.map(row => row[1])]).toEqual([kind, [b1, 2, null]]);

      hf.setSheetContent(0, result.data);

      expect([kind, hf.getCellValue({ sheet: 0, row: 1, col: 1 })]).toEqual([kind, 2]);

      hf.destroy();
    }
  });

  it('should wrap a dynamic array in ARRAYFORMULA when the engine has no array arithmetic', async() => {
    // `HyperFormula.buildEmpty` leaves `useArrayArithmetic` off, which the Formulas guide
    // recommends for a shared engine. Such an engine evaluates `=A1:A3*2` as one value: B1 showed 2
    // and B2:B3 (imported empty under the spill) stayed empty.
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    sheet.rows = [
      [at({ value: 1 }), at({ formula: { text: 'A1:A3*2', result: 2, array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), at({ value: 6 })],
    ];
    snapshot.sheets.push(sheet);

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    expect(hf.getConfig().useArrayArithmetic).toBe(false);

    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(result.data.map(row => row[1])).toEqual(['=ARRAYFORMULA(A1:A3*2)', null, null]);

    hf.setSheetContent(0, result.data);

    expect(hf.getSheetValues(0).map(row => row[1])).toEqual([2, 4, 6]);

    hf.destroy();
  });

  /**
   * Imports a one-sheet workbook into a fake grid whose Formulas plugin holds a real HyperFormula
   * engine with array arithmetic (the Formulas plugin's default), without applying it.
   *
   * @param {Array[]} rows The sheet's cell snapshots.
   * @param {object} [engine] The ExcelJS module, or `undefined` for the built-in engine.
   * @param {object} [options] More import options.
   * @param {object[]} [definedNames] The workbook's defined names.
   * @param {object} [grid] The grid engine's extra config and its sheets (`{ Sheet1: [] }` by default).
   * @returns {Promise<{ result: object, hf: HyperFormula }>}
   */
  async function importArrays(rows, engine, options = {}, definedNames = [], grid = {}) {
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = rows;
    snapshot.sheets.push(sheet);
    snapshot.definedNames = definedNames;

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
    const config = { licenseKey: 'gpl-v3', useArrayArithmetic: true, ...grid.config };
    // `buildEmpty` unless the grid holds more sheets: some tests count the probe's `buildFromSheets`.
    const hf = grid.sheets ? HyperFormula.buildFromSheets(grid.sheets, config) : HyperFormula.buildEmpty(config);

    if (!grid.sheets) {
      hf.addSheet('Sheet1');
    }

    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { ...options, apply: false, engine });

    return { result, hf };
  }

  it('should let an OFFSET array spill, which the engine instance does not list as a function', async() => {
    // HyperFormula parses OFFSET into a reference, so an instance's `getRegisteredFunctionNames()`
    // leaves it out while the class's static list has it. B1 was read as calling an unregistered
    // function, B2:B3 kept their cached values, and the spill collided with them (`#SPILL!`).
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = (formula, results) => [
      [at({ value: 1 }),
        at({ formula: { text: formula, result: results[0], array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 2 }), at({ value: results[1] })],
      [at({ value: 3 }), at({ value: results[2] })],
    ];

    for (const [kind, engine, b1] of [
      ['native', undefined, '=OFFSET(A1,0,0,3,1)*2'],
      ['exceljs', ExcelJS, '=ARRAYFORMULA(OFFSET(A1,0,0,3,1)*2)'],
    ]) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const spilled = await importArrays(rows('OFFSET(A1,0,0,3,1)*2', [2, 4, 6]), engine);

      expect(spilled.hf.getRegisteredFunctionNames()).not.toContain('OFFSET');
      expect([kind, spilled.result.data.map(row => row[1])]).toEqual([kind, [b1, null, null]]);

      spilled.hf.setSheetContent(0, spilled.result.data);

      expect([kind, spilled.hf.getSheetValues(0).map(row => row[1])]).toEqual([kind, [2, 4, 6]]);

      spilled.hf.destroy();

      // A lone OFFSET is a reference, which HyperFormula shows as `#VALUE!`: the cached values stay.
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const cached = await importArrays(rows('OFFSET(A1,0,0,3,1)', [1, 2, 3]), engine);

      expect([kind, cached.result.data.map(row => row[1])]).toEqual([kind, [1, 2, 3]]);
      expect([kind, cached.result.dropped.includes('formula:arraySpill')]).toEqual([kind, true]);

      cached.hf.destroy();
    }
  });

  it('should take the cached value of a plain formula that is a whole array call the engine would spill', async() => {
    // The export writes a spill it cannot keep (`formula:arrayExcluded`) as a plain `<f>`, which Excel
    // intersects to one value. Live, `=SEQUENCE(3)` spilled over the cached 2 and 3 below it.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const plain = await importArrays([
      [at({ value: 1 }), at({ formula: { text: '_xlfn.SEQUENCE(3)', result: 1 } })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 3 })],
    ]);

    expect(plain.result.data.map(row => row[1])).toEqual([1, 2, 3]);
    expect(plain.result.formulas).toEqual([{ row: 0, col: 1, formula: 'SEQUENCE(3)' }]);
    expect(plain.result.dropped).toContain('formula:arraySpill');

    plain.hf.destroy();

    // One whose result is one cell stays live.
    const single = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'TRANSPOSE(A1)', result: 1 } })],
      [at({ value: 2 }), null],
    ]);

    expect(single.result.data.map(row => row[1])).toEqual(['=TRANSPOSE(A1)', null]);
    expect(single.result.dropped.includes('formula:arraySpill')).toBe(false);

    single.hf.destroy();
  });

  it('should leave a master over a name on another engine sheet as written, whatever it masks', async() => {
    // The scratch engine holds no `Rates`, so `Rate` is `#REF!` there and `IFERROR(Rate,0)` made the
    // master `#DIV/0!`: it imported its cached values while the grid's engine, which holds `Rates`,
    // evaluates it live.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const masked = await importArrays([
      [at({ value: 1 }), at({
        formula: { text: 'A1:A3/IFERROR(Rate,0)', result: 0.5, array: { ref: 'B1:B3', dynamic: true } },
      })],
      [at({ value: 2 }), at({ value: 1 })],
      [at({ value: 3 }), at({ value: 1.5 })],
    ], undefined, {}, [{ name: 'Rate', formula: 'Rates!$A$1', sheetName: null }],
    { sheets: { Sheet1: [], Rates: [[2]] } });

    expect(masked.result.data.map(row => row[1])).toEqual(['=A1:A3/IFERROR(Rate,0)', null, null]);
    expect(masked.result.dropped.includes('formula:arraySpill')).toBe(false);

    masked.hf.destroy();
  });

  it('should let a translated OFFSET spill on an engine of another language', async() => {
    // The engine lists OFFSET under its own name only through the class's translation: with the
    // English id, a `plPL` master read as calling an unregistered function, kept its covered cells
    // and showed `#ROZLANIE!`.
    if (!HyperFormula.getRegisteredLanguagesCodes().includes('plPL')) {
      HyperFormula.registerLanguage('plPL', plPL);
    }

    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const spilled = await importArrays([
      [at({ value: 1 }), at({
        formula: { text: 'PRZESUNIĘCIE(A1,0,0,3,1)*2', result: 2, array: { ref: 'B1:B3', dynamic: true } },
      })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), at({ value: 6 })],
    ], undefined, {}, [], { config: { language: 'plPL' } });

    expect(spilled.result.data.map(row => row[1])).toEqual(['=PRZESUNIĘCIE(A1,0,0,3,1)*2', null, null]);

    spilled.hf.destroy();
  });

  it('should take the cached values of a legacy array the engine spills right of its ref', async() => {
    // `{=TRANSPOSE(A1:A3)}` entered in B1 alone is one cell in Excel; live, it filled C1:D1 too.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const legacy = await importArrays([
      [at({ value: 1 }), at({
        formula: { text: 'TRANSPOSE(A1:A3)', result: 1, array: { ref: 'B1', dynamic: false } },
      }), null, null],
      [at({ value: 2 }), null, null, null],
      [at({ value: 3 }), null, null, null],
    ]);

    expect(legacy.result.data[0]).toEqual([1, 1]);
    expect(legacy.result.formulas).toEqual([{ row: 0, col: 1, formula: 'TRANSPOSE(A1:A3)' }]);
    expect(legacy.result.dropped).toContain('formula:arraySpill');

    legacy.hf.destroy();
  });

  it('should take the cached values of a master that shows #SPILL! though it reads another sheet', async() => {
    // The probe holds no `Other`, so `ISERROR(Other!A1)` is true there and `SEQUENCE(5)` is blocked
    // by the `x` in B4. `#SPILL!` settles before the read-outside rule, so the master does not stay
    // live with its covered cells emptied.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const master = await importArrays([
      [at({ value: 1 }), at({
        formula: {
          text: 'IF(ISERROR(Other!A1),SEQUENCE(5),SEQUENCE(3))',
          result: 1,
          array: { ref: 'B1:B3', dynamic: true },
        },
      })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 3 })],
      [at({ value: 4 }), at({ value: 'x' })],
    ], undefined, {}, [], { sheets: { Sheet1: [], Other: [[7]] } });

    expect(master.result.data.map(row => row[1])).toEqual([1, 2, 3, 'x']);
    expect(master.result.dropped).toContain('formula:arraySpill');

    master.hf.destroy();
  });

  it('should keep the cached covered cells of a master calling a function the engine\'s plugins leave out', async() => {
    // An engine built with `functionPlugins` registers only those plugins' functions: FILTER shows
    // `#NAME?` there. The class's static list (every plugin) counted FILTER as registered, so B2 was
    // imported empty under a master that spills nothing, and the 3 the file holds was lost.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const grid = { config: { functionPlugins: [HyperFormula.getFunctionPlugin('SUM')] } };
    const filter = await importArrays([
      [at({ value: 1 }),
        at({ formula: {
          text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>1)', result: 2, array: { ref: 'B1:B2', dynamic: true },
        } })],
      [at({ value: 2 }), at({ value: 3 })],
      [at({ value: 3 }), null],
    ], undefined, {}, [], grid);

    expect(filter.hf.getRegisteredFunctionNames()).not.toContain('FILTER');
    expect(filter.result.data.map(row => row[1])).toEqual(['=FILTER(A1:A3,A1:A3>1)', 3, null]);

    filter.hf.destroy();

    // OFFSET is HyperFormula's own, whatever plugins the engine loads: its array still spills.
    const offset = await importArrays([
      [at({ value: 1 }),
        at({ formula: { text: 'OFFSET(A1,0,0,3,1)*2', result: 2, array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), at({ value: 6 })],
    ], undefined, {}, [], grid);

    expect(offset.result.data.map(row => row[1])).toEqual(['=OFFSET(A1,0,0,3,1)*2', null, null]);

    offset.hf.setSheetContent(0, offset.result.data);

    expect(offset.hf.getSheetValues(0).map(row => row[1])).toEqual([2, 4, 6]);

    offset.hf.destroy();
  });

  it('should keep the cached covered cells of an array master that itself uses the spill operator', async() => {
    // `=B1#*2` is stored as `_xlfn.ANCHORARRAY(B1)*2`, in any case; HyperFormula has no ANCHORARRAY.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });

    for (const text of ['_xlfn.ANCHORARRAY(B1)*2', '_xlfn.anchorarray(B1)*2']) {
      const rows = [
        [at({ value: 1 }),
          at({ formula: { text: '_xlfn.SEQUENCE(3)', result: 1, array: { ref: 'B1:B3', dynamic: true } } }),
          at({ formula: { text, result: 2, array: { ref: 'C1:C3', dynamic: true } } })],
        [at({ value: 2 }), at({ value: 2 }), at({ value: 4 })],
        [at({ value: 3 }), at({ value: 3 }), at({ value: 6 })],
      ];

      for (const [kind, engine] of [['native', undefined], ['exceljs', ExcelJS]]) {
        const label = [kind, text];
        // eslint-disable-next-line no-await-in-loop -- one import at a time.
        const { result, hf } = await importArrays(rows, engine);

        expect([label, result.data.map(row => row[2])]).toEqual([label, [2, 4, 6]]);
        expect([label, result.formulas]).toEqual([label, [{ row: 0, col: 2, formula: text.replace('_xlfn.', '') }]]);
        expect([label, result.dropped.includes('formula:spillReference')]).toEqual([label, true]);

        hf.destroy();
      }
    }
  });

  it('should leave out a defined name over the spill operator', async() => {
    // `Spill` refers to `Sheet1!$B$1#`, stored as `_xlfn.ANCHORARRAY(Sheet1!$B$1)`. HyperFormula
    // has no ANCHORARRAY, so the name would be `#NAME?` and `COUNTA(Spill)` would count it as 1.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const names = [{ name: 'Spill', formula: '_xlfn.ANCHORARRAY(Sheet1!$B$1)', sheetName: null }];
    const { result, hf } = await importArrays([
      [at({ value: 1 }),
        at({ formula: { text: '_xlfn.SEQUENCE(3)', result: 1, array: { ref: 'B1:B3', dynamic: true } } }),
        at({ formula: { text: 'COUNTA(Spill)', result: 3 } })],
      [at({ value: 2 }), at({ value: 2 }), null],
      [at({ value: 3 }), at({ value: 3 }), null],
    ], undefined, {}, names);

    expect(result.namedExpressions).toBeUndefined();
    expect(result.data[0][2]).toBe(3);
    expect(result.formulas).toEqual([{ row: 0, col: 2, formula: 'COUNTA(Spill)' }]);
    expect(result.dropped).toContain('definedNames:unsupported');

    hf.destroy();
  });

  it('should import the cached value of a formula using the spill operator or implicit intersection', async() => {
    // Excel stores `=SUM(B1#)` as `SUM(_xlfn.ANCHORARRAY(B1))` and `=@A1:A3` as `_xlfn.SINGLE(A1:A3)`.
    // HyperFormula has neither function: C1 and D1 showed `#NAME?`, and `COUNTA(ANCHORARRAY(B1))`
    // counted the error as one value, 1 where the file holds 3, with nothing reported.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = [
      [at({ value: 1 }),
        at({ formula: { text: '_xlfn.SEQUENCE(3)', result: 1, array: { ref: 'B1:B3', dynamic: true } } }),
        at({ formula: { text: 'SUM(_xlfn.ANCHORARRAY(B1))', result: 6 } }),
        at({ formula: { text: '_xlfn.SINGLE(A1:A3)', result: 1 } }),
        at({ formula: { text: 'COUNTA(_xlfn.ANCHORARRAY(B1))', result: 3 } })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 3 })],
    ];

    for (const [kind, engine] of [['native', undefined], ['exceljs', ExcelJS]]) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const { result, hf } = await importArrays(rows, engine);

      expect([kind, result.data[0].slice(2)]).toEqual([kind, [6, 1, 3]]);
      expect([kind, result.formulas]).toEqual([kind, [
        { row: 0, col: 2, formula: 'SUM(ANCHORARRAY(B1))' },
        { row: 0, col: 3, formula: 'SINGLE(A1:A3)' },
        { row: 0, col: 4, formula: 'COUNTA(ANCHORARRAY(B1))' },
      ]]);
      expect([kind, result.dropped.includes('formula:spillReference')]).toEqual([kind, true]);

      hf.destroy();
    }
  });

  it('should import the cached values of a dynamic array HyperFormula cannot spill', async() => {
    // HyperFormula sizes FILTER by its input (three rows), Excel by its result (two rows): the
    // spill hits the text in B3 and B1 showed `#SPILL!`, and B2's cached 3 was lost.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const buildFromSheets = jest.spyOn(HyperFormula, 'buildFromSheets');
    const destroy = jest.spyOn(HyperFormula.prototype, 'destroy');

    try {
      const { result, hf } = await importArrays([
        [at({ value: 1 }),
          at({ formula: {
            text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>1)', result: 2, array: { ref: 'B1:B2', dynamic: true },
          } })],
        [at({ value: 2 }), at({ value: 3 })],
        [at({ value: 3 }), at({ value: 'x' })],
      ]);

      expect(result.data.map(row => row[1])).toEqual([2, 3, 'x']);
      expect(result.formulas).toEqual([{ row: 0, col: 1, formula: 'FILTER(A1:A3,A1:A3>1)' }]);
      expect(result.dropped).toContain('formula:arraySpill');
      // One scratch engine, built and destroyed; the grid's own engine is left alone.
      expect(buildFromSheets).toHaveBeenCalledTimes(1);
      expect(destroy).toHaveBeenCalledTimes(1);
      expect(hf.getSheetNames()).toEqual(['Sheet1']);

      hf.setSheetContent(0, result.data);

      expect(hf.getSheetValues(0).flat().filter(value => value?.type === 'SPILL')).toEqual([]);
      expect(hf.getSheetValues(0).map(row => row[1])).toEqual([2, 3, 'x']);

      hf.destroy();
    } finally {
      buildFromSheets.mockRestore();
      destroy.mockRestore();
    }
  });

  it('should keep the cached values a one-value legacy array covers', async() => {
    // `{=A1*2}` entered over B1:B3 shows 2 in each cell in Excel. HyperFormula evaluates it as one
    // value in B1, so B2:B3, imported empty under the array, stayed empty.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = [
      [at({ value: 1 }), at({ formula: { text: 'A1*2', result: 2, array: { ref: 'B1:B3', dynamic: false } } })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 2 })],
    ];

    for (const [kind, engine] of [['native', undefined], ['exceljs', ExcelJS]]) {
      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const { result, hf } = await importArrays(rows, engine);

      expect([kind, result.data.map(row => row[1])]).toEqual([kind, ['=ARRAYFORMULA(A1*2)', 2, 2]]);
      expect([kind, result.dropped.includes('formula:arraySpill')]).toEqual([kind, false]);

      hf.setSheetContent(0, result.data);

      expect([kind, hf.getSheetValues(0).map(row => row[1])]).toEqual([kind, [2, 2, 2]]);

      hf.destroy();
    }
  });

  it('should still import empty the cells a spilling dynamic array covers', async() => {
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const { result, hf } = await importArrays([
      [at({ value: 'a' }),
        at({ formula: { text: '_xlfn.SEQUENCE(3)', result: 1, array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 'b' }), at({ value: 2 })],
      [at({ value: 'c' }), at({ value: 3 })],
    ]);

    expect(result.data.map(row => row[1])).toEqual(['=SEQUENCE(3)', null, null]);
    expect(result.formulas).toBeUndefined();
    expect(result.dropped).not.toContain('formula:arraySpill');

    hf.setSheetContent(0, result.data);

    expect(hf.getSheetValues(0).map(row => row[1])).toEqual([1, 2, 3]);

    hf.destroy();
  });

  it('should leave an array as written when its master is #REF! or #NAME? in the probe, or the probe throws', () => {
    // The probe holds one sheet, so a master reading another engine sheet is `#REF!` there although
    // the grid spills it, and it lacks the engine's sheet-scoped names (`#NAME?`): its covered cells
    // are not judged.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const workbook = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [at({ value: 1 }), at({ formula: { text: 'SEQUENCE(2)', result: 1, array: { ref: 'B1:B2', dynamic: true } } })],
      [at({ value: 2 }), at({ value: 2 })],
    ];
    workbook.sheets.push(sheet);

    for (const masterState of [() => 'REF', () => 'NAME', () => { throw new Error('probe'); }]) {
      const destroy = jest.fn();
      const isPartOfArray = jest.fn(() => false);
      const dropped = new DroppedFeatures();
      const mapped = mapWorkbook(workbook, resolveImportOptions({}), {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
        probeLiveArrays: () => ({ masterState, isPartOfArray, destroy }),
      }, dropped);

      expect(mapped.data.map(row => row[1])).toEqual(['=SEQUENCE(2)', null]);
      expect(mapped.formulas).toBeUndefined();
      expect(dropped.list()).not.toContain('formula:arraySpill');
      expect(isPartOfArray).not.toHaveBeenCalled();
      expect(destroy).toHaveBeenCalledTimes(1);
    }
  });

  it('should import the cached value of a CSE master the engine spills past its ref', async() => {
    // Excel never resizes a CSE ref: `{=A1:A3*2}` with `ref="B1"` shows one cell, A1*2. Wrapped in
    // `ARRAYFORMULA`, HyperFormula spills it into the empty B2:B3, values the file does not have.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const past = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'A1:A3*2', result: 2, array: { ref: 'B1', dynamic: false } } })],
      [at({ value: 2 }), null],
      [at({ value: 3 }), null],
    ]);

    expect(past.result.data).toEqual([[1, 2], [2, null], [3, null]]);
    expect(past.result.formulas).toEqual([{ row: 0, col: 1, formula: 'A1:A3*2' }]);
    expect(past.result.dropped).toContain('formula:arraySpill');

    past.hf.destroy();

    // The same formula over its whole spill stays live.
    const whole = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'A1:A3*2', result: 2, array: { ref: 'B1:B3', dynamic: false } } })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), at({ value: 6 })],
    ]);

    expect(whole.result.data).toEqual([[1, '=ARRAYFORMULA(A1:A3*2)'], [2, null], [3, null]]);
    expect(whole.result.dropped.includes('formula:arraySpill')).toBe(false);

    whole.hf.destroy();

    // A `range` that cuts the ref short is not a spill past it: the ref goes on below the window.
    const cut = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'A1:A3*2', result: 2, array: { ref: 'B1:B3', dynamic: false } } })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), at({ value: 6 })],
    ], undefined, { range: [0, 0, 1, 1] });

    expect(cut.result.data).toEqual([[1, '=ARRAYFORMULA(A1:A3*2)'], [2, null]]);
    expect(cut.result.dropped.includes('formula:arraySpill')).toBe(false);

    cut.hf.destroy();

    // The ExcelJS reader reads every array as CSE. The empty room HyperFormula reserves past a
    // `FILTER` result (4 rows for 2) is not a spill past the ref Excel saved.
    const filter = await importArrays([
      [at({ value: 1 }), at({
        formula: { text: '_xlfn._xlws.FILTER(A1:A4,A1:A4>2)', result: 3, array: { ref: 'B1:B2', dynamic: false } },
      })],
      [at({ value: 2 }), at({ value: 4 })],
      [at({ value: 3 }), null],
      [at({ value: 4 }), null],
    ]);

    expect(filter.result.data.map(row => row[1]))
      .toEqual(['=ARRAYFORMULA(FILTER(A1:A4,A1:A4>2))', null, null, null]);
    expect(filter.result.dropped.includes('formula:arraySpill')).toBe(false);

    filter.hf.destroy();

    // A dynamic master is resized by Excel too, so it spills past its ref live.
    const dynamic = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'A1:A3*2', result: 2, array: { ref: 'B1', dynamic: true } } })],
      [at({ value: 2 }), null],
      [at({ value: 3 }), null],
    ]);

    expect(dynamic.result.data).toEqual([[1, '=A1:A3*2'], [2, null], [3, null]]);
    expect(dynamic.result.dropped.includes('formula:arraySpill')).toBe(false);

    dynamic.hf.destroy();
  });

  it('should import the cached value of a dynamic master whose error the engine spills past its ref', async() => {
    // A `FILTER` that matches nothing, as Excel Online saves it: one `#CALC!` cell, cached as
    // `#VALUE!` (the rich-value error code is not read yet). HyperFormula fills the 3 rows it
    // reserved for the input with `#N/A`, two cells Excel shows empty.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const empty = await importArrays([
      [at({ value: 1 }), at({
        formula: {
          text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>10)',
          result: '#VALUE!',
          resultIsError: true,
          array: { ref: 'B1', dynamic: true },
        },
      })],
      [at({ value: 2 }), null],
      [at({ value: 3 }), null],
    ]);

    expect(empty.result.data).toEqual([[1, '#VALUE!'], [2, null], [3, null]]);
    expect(empty.result.formulas).toEqual([{ row: 0, col: 1, formula: 'FILTER(A1:A3,A1:A3>10)' }]);
    expect(empty.result.dropped).toContain('formula:arraySpill');

    empty.hf.destroy();

    // A one-cell error stays live: nothing reaches past the ref.
    const single = await importArrays([
      [at({ value: 1 }), at({
        formula: {
          text: '1/0',
          result: '#DIV/0!',
          resultIsError: true,
          array: { ref: 'B1', dynamic: true },
        },
      })],
      [at({ value: 2 }), null],
    ]);

    expect(single.result.data).toEqual([[1, '=1/0'], [2, null]]);
    expect(single.result.dropped.includes('formula:arraySpill')).toBe(false);

    single.hf.destroy();
  });

  it('should keep a blocked spill live when the file caches an error for it', async() => {
    // Excel 365 saves a blocked spill as `<c t="e" cm="1" vm="1"><v>#VALUE!</v>`. Put back, the cell
    // held a frozen `#VALUE!` and lost its formula; live, it shows `#SPILL!` as Excel does and keeps
    // the formula.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const blocked = await importArrays([
      [at({ value: 1 }), at({
        formula: {
          text: '_xlfn.SEQUENCE(3)',
          result: '#VALUE!',
          resultIsError: true,
          array: { ref: 'B1', dynamic: true },
        },
      })],
      [at({ value: 2 }), at({ value: 5 })],
    ]);

    expect(blocked.result.data).toEqual([[1, '=SEQUENCE(3)'], [2, 5]]);
    expect(blocked.result.formulas).toBeUndefined();
    expect(blocked.result.dropped.includes('formula:arraySpill')).toBe(false);

    blocked.hf.destroy();

    // A `FILTER` that matches nothing, blocked by a value in its reserved rows, stays live too.
    const filter = await importArrays([
      [at({ value: 1 }), at({
        formula: {
          text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>10)',
          result: '#VALUE!',
          resultIsError: true,
          array: { ref: 'B1', dynamic: true },
        },
      })],
      [at({ value: 2 }), at({ value: 5 })],
      [at({ value: 3 }), null],
    ]);

    expect(filter.result.data.map(row => row[1])).toEqual(['=FILTER(A1:A3,A1:A3>10)', 5, null]);
    expect(filter.result.dropped.includes('formula:arraySpill')).toBe(false);

    filter.hf.destroy();
  });

  it('should settle the arrays of a window that does not start at A1 at their window positions', async() => {
    // The probe holds the mapped data, so it answers in window coordinates: the header row
    // `colHeaders: 'firstRow'` drops, and the row and column a `range` skips, shift every master.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const filter = await importArrays([
      [at({ value: 'n' }), at({ value: 'f' })],
      [at({ value: 1 }),
        at({ formula: {
          text: '_xlfn._xlws.FILTER(A2:A4,A2:A4>1)', result: 2, array: { ref: 'B2:B3', dynamic: true },
        } })],
      [at({ value: 2 }), at({ value: 3 })],
      [at({ value: 3 }), at({ value: 'x' })],
    ], undefined, { colHeaders: 'firstRow' });

    expect(filter.result.colHeaders).toEqual(['n', 'f']);
    expect(filter.result.data).toEqual([[1, 2], [2, 3], [3, 'x']]);
    expect(filter.result.formulas).toEqual([{ row: 0, col: 1, formula: 'FILTER(A2:A4,A2:A4>1)' }]);
    expect(filter.result.dropped).toContain('formula:arraySpill');

    filter.hf.destroy();

    const legacy = await importArrays([
      [at({ value: 'skip' }), null, null],
      [at({ value: 'skip' }), at({ value: 1 }),
        at({ formula: { text: 'B2*2', result: 2, array: { ref: 'C2:C4', dynamic: false } } })],
      [null, at({ value: 2 }), at({ value: 2 })],
      [null, at({ value: 3 }), at({ value: 2 })],
    ], undefined, { range: [1, 1, 3, 2] });

    expect(legacy.result.data).toEqual([[1, '=ARRAYFORMULA(A1*2)'], [2, 2], [3, 2]]);
    expect(legacy.result.dropped.includes('formula:arraySpill')).toBe(false);

    legacy.hf.setSheetContent(0, legacy.result.data);

    expect(legacy.hf.getSheetValues(0)).toEqual([[1, 2], [2, 2], [3, 2]]);

    legacy.hf.destroy();
  });

  it('should settle a master that reads a defined name the import registers', async() => {
    // The probe adds the names the import hands over; without them `Limit` is `#NAME?` in the
    // scratch engine, the master is left as written, and B2:B3 lose the 2 the file caches.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = (formula, dynamic) => [
      [at({ value: 1 }),
        at({ formula: { text: formula, result: 2, array: { ref: 'B1:B3', dynamic } } }), at({ value: 1 })],
      [at({ value: 2 }), at({ value: 2 }), null],
      [at({ value: 3 }), at({ value: 2 }), null],
    ];
    const names = [
      { name: 'Limit', formula: 'Sheet1!$C$1', sheetName: null },
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null },
    ];
    const settled = await importArrays(rows('Limit*2', false), undefined, {}, names);

    expect(settled.result.namedExpressions).toEqual([
      { name: 'Limit', formula: 'Sheet1!$C$1' },
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$3' },
    ]);
    expect(settled.result.data.map(row => row[1])).toEqual(['=ARRAYFORMULA(Limit*2)', 2, 2]);

    settled.hf.destroy();

    // HyperFormula 3.3 evaluates array arithmetic over a range name (`Sales>1`) to `#VALUE!` ("Cell
    // range not allowed"), in the grid's engine as in the probe, while Excel cached 2. The master
    // used to be left as written, and B2:B3 lost the 2 the file caches.
    const cached = await importArrays(rows('_xlfn._xlws.FILTER(Sales,Sales>1)', true), undefined, {}, names);

    expect(cached.result.data.map(row => row[1])).toEqual([2, 2, 2]);
    expect(cached.result.formulas).toEqual([{ row: 0, col: 1, formula: 'FILTER(Sales,Sales>1)' }]);
    expect(cached.result.dropped).toContain('formula:arraySpill');

    cached.hf.setSheetContent(0, cached.result.data);
    names.forEach(({ name, formula }) => cached.hf.addNamedExpression(name, `=${formula}`));

    expect(cached.hf.getSheetValues(0).map(row => row[1])).toEqual([2, 2, 2]);

    cached.hf.destroy();
  });

  it('should add the names to the scratch engine in one batch, so it evaluates once, not once per name', async() => {
    // Unbatched, every `addNamedExpression` recalculated the scratch sheet.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = [
      [at({ value: 1 }), at({ formula: { text: 'Limit*A1:A2', result: 2, array: { ref: 'B1:B2', dynamic: true } } }),
        at({ value: 2 })],
      [at({ value: 2 }), at({ value: 4 }), null],
    ];
    const names = [
      { name: 'Limit', formula: 'Sheet1!$C$1', sheetName: null },
      { name: 'Other', formula: 'Sheet1!$A$1:$A$2', sheetName: null },
    ];
    const suspended = [];
    const original = HyperFormula.prototype.addNamedExpression;
    const spy = jest.spyOn(HyperFormula.prototype, 'addNamedExpression').mockImplementation(function(...args) {
      suspended.push([args[0], this.isEvaluationSuspended()]);

      return original.apply(this, args);
    });

    try {
      const { result, hf } = await importArrays(rows, undefined, {}, names);

      expect(result.data.map(row => row[1])).toEqual(['=Limit*A1:A2', null]);
      hf.destroy();
    } finally {
      spy.mockRestore();
    }

    expect(suspended).toEqual([['Limit', true], ['Other', true]]);
  });

  it('should import the cached values of an array HyperFormula evaluates to an error Excel did not', async() => {
    // Excel 365 spills a lone reference (`=A1:A3`, "mirror this column"), a range name and
    // `INDEX(...,0)`; HyperFormula 3.3 shows `#VALUE!` for each, even inside `ARRAYFORMULA`. The
    // covered cells used to import empty under the master, so the column showed `#VALUE!` and two
    // empty cells where the file holds 1, 2, 3.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const names = [{ name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null }];
    const rows = (formula, dynamic) => [
      [at({ value: 1 }), at({ formula: { text: formula, result: 1, array: { ref: 'B1:B3', dynamic } } })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 3 })],
    ];
    const shapes = [
      ['A1:A3', true],
      ['(A1:A3)', true],
      ['Sheet1!A1:A3', true],
      ['Sales', true],
      ['INDEX(A1:A3,0)', true],
      // A legacy CSE array, which the import wraps: `ARRAYFORMULA(A1:A3)`.
      ['A1:A3', false],
    ];

    for (const [kind, engine] of [['native', undefined], ['exceljs', ExcelJS]]) {
      for (const [formula, dynamic] of shapes) {
        const label = [kind, formula, dynamic];
        // eslint-disable-next-line no-await-in-loop -- one import at a time.
        const { result, hf } = await importArrays(rows(formula, dynamic), engine, {}, names);

        expect([label, result.data.map(row => row[1])]).toEqual([label, [1, 2, 3]]);
        expect([label, result.formulas]).toEqual([label, [{ row: 0, col: 1, formula }]]);

        hf.setSheetContent(0, result.data);

        expect([label, hf.getSheetValues(0).map(row => row[1])]).toEqual([label, [1, 2, 3]]);

        hf.destroy();
      }
    }

    // Through the probe, the masters are reported as arrays HyperFormula cannot evaluate like Excel.
    const { result, hf } = await importArrays(rows('A1:A3', true));

    expect(result.dropped).toContain('formula:arraySpill');

    hf.destroy();
  });

  it('should leave an array as written when the file caches an error for its master too', async() => {
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const { result, hf } = await importArrays([
      [at({ value: 1 }), at({
        formula: { text: 'A1:A3', result: '#VALUE!', resultIsError: true, array: { ref: 'B1:B3', dynamic: true } },
      })],
      [at({ value: 2 }), at({ value: 2 })],
      [at({ value: 3 }), at({ value: 3 })],
    ]);

    expect(result.data.map(row => row[1])).toEqual(['=A1:A3', null, null]);
    expect(result.formulas).toBeUndefined();
    expect(result.dropped.includes('formula:arraySpill')).toBe(false);

    hf.destroy();
  });

  it('should leave an array as written when its master reads another engine sheet', async() => {
    // The probe holds the imported sheet only, so `Other!A1:A3*2` is `#REF!` there while the grid's
    // engine spills it: the master stays live and its covered cells import empty.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [at({ formula: { text: 'Other!A1:A3*2', result: 2, array: { ref: 'A1:A3', dynamic: true } } })],
      [at({ value: 4 })],
      [at({ value: 6 })],
    ];
    snapshot.sheets.push(sheet);

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));

    for (const [kind, engine, a1] of [
      ['native', undefined, '=Other!A1:A3*2'],
      ['exceljs', ExcelJS, '=ARRAYFORMULA(Other!A1:A3*2)'],
    ]) {
      const hf = HyperFormula.buildFromSheets({ Sheet1: [], Other: [[1], [2], [3]] }, {
        licenseKey: 'gpl-v3', useArrayArithmetic: true,
      });
      const { plugin, hot } = pluginWithFakeHot(true);

      hot.getPlugin = name => ({
        formulas: runningFormulasPlugin(hf),
      })[name];

      // eslint-disable-next-line no-await-in-loop -- one engine at a time.
      const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false, engine });

      expect([kind, result.data.map(row => row[0])]).toEqual([kind, [a1, null, null]]);
      expect([kind, result.dropped.includes('formula:arraySpill')]).toEqual([kind, false]);

      hf.setSheetContent(0, result.data);

      expect([kind, hf.getSheetValues(0).map(row => row[0])]).toEqual([kind, [2, 4, 6]]);

      hf.destroy();
    }
  });

  it('should leave an array live when its master reads another engine sheet the probe errors on', async() => {
    // HyperFormula turns a sheet it does not hold into a `#REF!` inside the formula, so the probe
    // answered `#N/A` (FILTER's ranges differ in length) or `#DIV/0!` (IFERROR caught the `#REF!`),
    // and the master was frozen to its cached values while the grid's engine evaluates it.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const grid = { sheets: { Sheet1: [], Other: [[1, 5], ['x'], [3]] } };
    const shapes = [
      ['_xlfn._xlws.FILTER(A1:A3,ISNUMBER(Other!A1:A3))', 'FILTER(A1:A3,ISNUMBER(Other!A1:A3))', [1, 3], [1, 3, null]],
      ['A1:A3/IFERROR(Other!B1,0)', 'A1:A3/IFERROR(Other!B1,0)', [0.2, 0.4, 0.6], [0.2, 0.4, 0.6]],
    ];

    for (const [text, live, cached, values] of shapes) {
      const ref = `B1:B${cached.length}`;
      const rows = [
        [at({ value: 1 }), at({ formula: { text, result: cached[0], array: { ref, dynamic: true } } })],
        [at({ value: 2 }), at({ value: cached[1] ?? null })],
        [at({ value: 3 }), cached.length > 2 ? at({ value: cached[2] }) : null],
      ];

      for (const [kind, engine, b1] of [
        ['native', undefined, `=${live}`],
        ['exceljs', ExcelJS, `=ARRAYFORMULA(${live})`],
      ]) {
        const label = [kind, text];
        // eslint-disable-next-line no-await-in-loop -- one import at a time.
        const { result, hf } = await importArrays(rows, engine, {}, [], grid);

        expect([label, result.data.map(row => row[1])]).toEqual([label, [b1, null, null]]);
        expect([label, result.formulas]).toEqual([label, undefined]);
        expect([label, result.dropped.includes('formula:arraySpill')]).toEqual([label, false]);

        hf.setSheetContent(0, result.data);

        expect([label, hf.getSheetValues(0).map(row => row[1] ?? null)]).toEqual([label, values]);

        hf.destroy();
      }
    }
  });

  it('should leave an array live when its master reads an engine name the probe lacks', async() => {
    // The probe copies the engine's workbook-scoped names only; `Rate`, scoped to the grid's sheet,
    // is `#NAME?` there, IFERROR turns it into 0 and the probe answered `#DIV/0!`.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const rows = [
      [at({ value: 1 }),
        at({ formula: { text: 'A1:A3/IFERROR(Rate,0)', result: 0.2, array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 2 }), at({ value: 0.4 })],
      [at({ value: 3 }), at({ value: 0.6 })],
    ];
    const snapshot = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = rows;
    snapshot.sheets.push(sheet);

    const bytes = toArrayBuffer(await nativeAdapter.write(snapshot, undefined, new DroppedFeatures()));
    const hf = HyperFormula.buildFromSheets({ Sheet1: [] }, { licenseKey: 'gpl-v3', useArrayArithmetic: true });

    hf.addNamedExpression('Rate', '=5', 0);

    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(result.data.map(row => row[1])).toEqual(['=A1:A3/IFERROR(Rate,0)', null, null]);
    expect(result.dropped.includes('formula:arraySpill')).toBe(false);

    hf.setSheetContent(0, result.data);

    expect(hf.getSheetValues(0).map(row => row[1])).toEqual([0.2, 0.4, 0.6]);

    hf.destroy();
  });

  it('should leave an array as written when the probe errors on a master the file caches no value for', async() => {
    // openpyxl writes no cached values: putting the "cached" value back emptied the master, and a
    // `#VALUE!` in the probe proved nothing the file could replace.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const { result, hf } = await importArrays([
      [at({ value: 1 }), at({ formula: { text: 'A1:A3', array: { ref: 'B1:B3', dynamic: true } } })],
      [at({ value: 2 }), null],
      [at({ value: 3 }), null],
    ]);

    expect(result.data.map(row => row[1])).toEqual(['=A1:A3', null, null]);
    expect(result.formulas).toBeUndefined();
    expect(result.dropped.includes('formula:arraySpill')).toBe(false);

    hf.destroy();
  });

  it('should leave the arrays as written and destroy the scratch engine when the probe setup throws', async() => {
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const build = HyperFormula.buildFromSheets.bind(HyperFormula);
    const destroy = jest.fn();
    const buildFromSheets = jest.spyOn(HyperFormula, 'buildFromSheets').mockImplementation((...args) => {
      const scratch = build(...args);
      const destroyScratch = scratch.destroy.bind(scratch);

      scratch.getSheetId = () => {
        throw new Error('setup');
      };
      scratch.destroy = () => {
        destroy();
        destroyScratch();
      };

      return scratch;
    });

    try {
      const { result, hf } = await importArrays([
        [at({ value: 1 }),
          at({ formula: {
            text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>1)', result: 2, array: { ref: 'B1:B2', dynamic: true },
          } })],
        [at({ value: 2 }), at({ value: 3 })],
        [at({ value: 3 }), at({ value: 'x' })],
      ]);

      expect(result.data.map(row => row[1])).toEqual(['=FILTER(A1:A3,A1:A3>1)', null, 'x']);
      expect(result.dropped.includes('formula:arraySpill')).toBe(false);
      expect(buildFromSheets).toHaveBeenCalledTimes(1);
      expect(destroy).toHaveBeenCalledTimes(1);

      hf.destroy();
    } finally {
      buildFromSheets.mockRestore();
    }
  });

  it('should leave the arrays as written when building the probe throws in the mapper', () => {
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const workbook = createWorkbookSnapshot();
    const sheet = createSheetSnapshot('Sheet1');

    sheet.rows = [
      [at({ value: 1 }), at({ formula: { text: 'SEQUENCE(2)', result: 1, array: { ref: 'B1:B2', dynamic: true } } })],
      [at({ value: 2 }), at({ value: 2 })],
    ];
    workbook.sheets.push(sheet);

    const dropped = new DroppedFeatures();
    const mapped = mapWorkbook(workbook, resolveImportOptions({}), {
      formulasEnabled: true,
      commentsEnabled: false,
      customBordersEnabled: false,
      entitlement: UNRESTRICTED_XLSX_ENTITLEMENT,
      probeLiveArrays: () => {
        throw new Error('probe');
      },
    }, dropped);

    expect(mapped.data.map(row => row[1])).toEqual(['=SEQUENCE(2)', null]);
    expect(dropped.list()).not.toContain('formula:arraySpill');
  });

  it('should report a spilled master the file caches no value for, which imports empty', async() => {
    // openpyxl writes no cached values: the master moves to `ImportResult.formulas` and imports
    // empty, which the warning has to explain, as for any formula not imported live.
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const { result, hf } = await importArrays([
      [at({ value: 1 }),
        at({ formula: {
          text: '_xlfn._xlws.FILTER(A1:A3,A1:A3>1)', array: { ref: 'B1:B2', dynamic: true },
        } })],
      [at({ value: 2 }), null],
      [at({ value: 3 }), at({ value: 'x' })],
    ]);

    expect(result.data.map(row => row[1])).toEqual([null, null, 'x']);
    expect(result.formulas).toEqual([{ row: 0, col: 1, formula: 'FILTER(A1:A3,A1:A3>1)' }]);
    expect(result.dropped).toEqual(expect.arrayContaining(['formula:arraySpill', 'formula:noCachedValue']));

    hf.destroy();
  });

  it('should build no scratch engine for a file without array formulas', async() => {
    const at = overrides => ({ ...createCellSnapshot(), ...overrides });
    const buildFromSheets = jest.spyOn(HyperFormula, 'buildFromSheets');
    const buildFromArray = jest.spyOn(HyperFormula, 'buildFromArray');

    try {
      const { result, hf } = await importArrays([
        [at({ value: 1 }), at({ formula: { text: 'A1*2', result: 2 } })],
      ]);

      expect(result.data).toEqual([[1, '=A1*2']]);
      expect(buildFromSheets).not.toHaveBeenCalled();
      expect(buildFromArray).not.toHaveBeenCalled();

      hf.destroy();
    } finally {
      buildFromSheets.mockRestore();
      buildFromArray.mockRestore();
    }
  });
});

describe('ImportFile and the Formulas engine\'s own sheet', () => {
  it('should import the cached value of a formula naming another workbook sheet spelled like the grid\'s', async() => {
    // The import replaces the engine's `Sheet1` with `Sheet2`'s cells, so a live `Sheet1!A1*2`
    // read the grid's A1 (7), not the workbook's `Sheet1` (100).
    const wb = new ExcelJS.Workbook();

    wb.addWorksheet('Sheet1').getCell('A1').value = 100;

    const second = wb.addWorksheet('Sheet2');

    second.getCell('A1').value = 7;
    second.getCell('B1').value = { formula: 'Sheet1!A1*2', result: 200 };

    const bytes = toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer()));
    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: {
        isEnabled: () => true,
        enabled: true,
        flushEngineEvaluation: () => {},
        sheetName: 'Sheet1',
        engine: { getSheetNames: () => ['Sheet1'], listNamedExpressions: () => [] },
      },
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { sheet: 'Sheet2', apply: false });

    expect(result.data).toEqual([[7, 200]]);
    expect(result.dropped).toContain('formula:otherSheet');
  });
});

describe('selectSheet by index on an export with dropdowns', () => {
  it('should skip the export\'s hidden _HotValidation helper the way it skips a very hidden sheet', () => {
    // The export writes the dropdown helper as `hidden` (Numbers drops a `veryHidden` sheet and every
    // validation pointing at it), and in a multi-sheet export it sits between the data sheets.
    const workbook = createWorkbookSnapshot();
    const sheet = (name, state) => {
      const builder = new SheetBuilder(name);

      builder.setState(state);

      return builder.toSnapshot();
    };

    workbook.sheets.push(
      sheet('First', 'visible'), sheet('_HotValidation', 'hidden'), sheet('Second', 'visible'),
      sheet('_HotValidation1', 'hidden'), sheet('Archive', 'hidden'),
    );

    expect(selectSheet(workbook, 1).name).toBe('Second');
    // A hidden sheet of the user's own is still reachable by index, as before.
    expect(selectSheet(workbook, 2).name).toBe('Archive');
    // By name the helper is still reachable.
    expect(selectSheet(workbook, '_HotValidation').name).toBe('_HotValidation');
  });
});

describe('ImportFile license gate', () => {
  const message = 'ImportFile: the license does not unlock "xlsx:import".';

  /**
   * Builds a key that unlocks every plugin and, of the xlsx family, exactly `tokens`.
   *
   * @param {string[]} tokens The xlsx tokens the key unlocks.
   * @returns {string}
   */
  const xlsxKeyWith = tokens => tierKeyWithout(ALL_XLSX_TOKENS.filter(id => !tokens.includes(id)));

  afterEach(() => {
    resetTierKeys();
  });

  it('exposes the license tokens it gates, each one features.json assigns to it', () => {
    expect(ImportFile.CAPABILITIES).toContain('xlsx:import');
    expect(ImportFile.CAPABILITIES).not.toContain('xlsx:export');
    ImportFile.CAPABILITIES.forEach((id) => {
      const entry = XLSX_FEATURES.capabilities.find(candidate => candidate.id === id);

      expect(entry.licensing).toBe('token');
      expect(entry.plugins).toContain('ImportFile');
    });
  });

  it('refuses an import and reports no xlsx support when the key lacks xlsx:import', async() => {
    const { plugin, calls } = pluginWithFakeHot(
      { engines: { xlsx: ExcelJS } },
      { licenseKey: xlsxKeyWith(['xlsx:export']) }
    );
    const bytes = fixture('values');

    expect(plugin.supportsImportFormat('xlsx')).toBe(false);
    await expect(plugin.importFromArrayBuffer('xlsx', bytes)).rejects.toThrow(message);
    await expect(plugin.importFromBlob('xlsx', new Blob([bytes]))).rejects.toThrow(message);
    expect(calls).toEqual([]);
  });

  it('does not throw from supportsImportFormat on a disabled plugin', () => {
    const { plugin } = pluginWithFakeHot(false, { licenseKey: xlsxKeyWith(['xlsx:export']) });

    expect(plugin.supportsImportFormat('xlsx')).toBe(false);
  });

  it('imports for a key with xlsx:import, a key with no xlsx token and an invalid key', async() => {
    for (const licenseKey of [xlsxKeyWith(['xlsx:import']), SUBSCRIPTION_KEY, 'non-commercial-and-evaluation']) {
      const { plugin } = pluginWithFakeHot({ engines: { xlsx: ExcelJS } }, { licenseKey });

      expect(plugin.supportsImportFormat('xlsx')).toBe(true);
      await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).resolves.toBeDefined();
    }
  });

  describe('on a key that unlocks only the features it names', () => {
    // The plugin's own token (`feat:import_file`) and the xlsx token are checked one after the other. The
    // plugin token is checked on a root instance only, so the fake grid is registered as one.
    const listedKey = tokens => tierKeyWith(tokens);

    beforeAll(() => {
      // A tier unlocks a plugin through its registered class.
      registerPlugin(ImportFile);
    });
    const pluginMessage = 'The license key for Handsontable does not include these features: '
      + 'Import from file (feat:import_file).';
    const rootPluginFor = (licenseKey) => {
      const fake = pluginWithFakeHot({ engines: { xlsx: ExcelJS } }, { licenseKey });

      registerAsRootInstance(fake.hot);

      return fake;
    };

    it('refuses an import with the plugin\'s license message first when the key lacks feat:import_file', async() => {
      const { plugin, calls } = rootPluginFor(listedKey(['xlsx:import']));
      const bytes = fixture('values');

      expect(plugin.supportsImportFormat('xlsx')).toBe(false);
      await expect(plugin.importFromArrayBuffer('xlsx', bytes)).rejects.toThrow(pluginMessage);
      await expect(plugin.importFromBlob('xlsx', new Blob([bytes]))).rejects.toThrow(pluginMessage);
      expect(calls).toEqual([]);
    });

    it('refuses an import with the xlsx:import message when the key has feat:import_file only', async() => {
      const { plugin, calls } = rootPluginFor(listedKey(['feat:import_file']));

      expect(plugin.supportsImportFormat('xlsx')).toBe(false);
      await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).rejects.toThrow(message);
      expect(calls).toEqual([]);
    });

    it('imports when the key has both feat:import_file and xlsx:import', async() => {
      const { plugin } = rootPluginFor(listedKey(['feat:import_file', 'xlsx:import']));

      expect(plugin.supportsImportFormat('xlsx')).toBe(true);
      await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).resolves.toBeDefined();
    });
  });
});

describe('ImportFile and a Formulas plugin that does not run', () => {
  it('should import cached values and leave `=` text alone when the Formulas option is on but the plugin never started', async() => {
    // A license key can keep the Formulas plugin off while its option stays on. The import writes live
    // formulas, and escapes `=`-leading text with an apostrophe, only for a plugin that runs to read them.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');

    ws.getCell('A1').value = { formula: '1+1', result: 2 };
    ws.getCell('B1').value = '=foo';

    const bytes = toArrayBuffer(new Uint8Array(await wb.xlsx.writeBuffer()));
    const blocked = pluginWithFakeHot(true, { formulasEnabled: true, formulasRuns: false });
    const running = pluginWithFakeHot(true, { formulasEnabled: true, formulasRuns: true });
    const blockedResult = await blocked.plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });
    const runningResult = await running.plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(blockedResult.data).toEqual([[2, '=foo']]);
    expect(runningResult.data).toEqual([['=1+1', '\'=foo']]);
  });
});

describe('ImportFile and rich value errors in a real HyperFormula engine', () => {
  /**
   * Imports `excel-online-rich-errors.xlsx` (C1 `=SEQUENCE(3)` blocked, `#SPILL!`; E1 an empty
   * `FILTER`, `#CALC!`) into an engine, with `IFERROR`/`ISERROR` over E1 in G1:H1.
   *
   * @param {object} hf The engine, holding `Sheet1`.
   * @returns {Promise<object>}
   */
  async function importInto(hf) {
    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', fixture('excel-online-rich-errors'), { apply: false });
    const data = result.data.map(row => [...row]);

    data[0][6] = '=IFERROR(E1,"none")';
    data[0][7] = '=ISERROR(E1)';
    hf.setSheetContent(0, data);

    return result;
  }

  it('should import a rich error the engine does not know as the #VALUE! Excel caches for it', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const result = await importInto(hf);

    // `#CALC!` is no HyperFormula error: imported as text, `IFERROR` over it returned `#CALC!`.
    expect(result.data[0][4]).toBe('#VALUE!');
    expect(hf.getCellValue({ sheet: 0, row: 0, col: 6 })).toBe('none');
    expect(hf.getCellValue({ sheet: 0, row: 0, col: 7 })).toBe(true);

    hf.destroy();
  });

  it('should keep the code of a rich error the engine knows', async() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

    hf.addSheet('Sheet1');

    const bytes = await rewriteArchive(fixture('excel-online-rich-errors'), (name, text) => (
      // E1's rich value becomes a `#SPILL!` (errorType 8), which HyperFormula reads as an error.
      name === 'xl/richData/rdrichvalue.xml' ? text.replace('<rv s="1"><v>13</v>', '<rv s="1"><v>8</v>') : text
    ));
    const { plugin, hot } = pluginWithFakeHot(true);

    hot.getPlugin = name => ({
      formulas: runningFormulasPlugin(hf),
    })[name];

    const result = await plugin.importFromArrayBuffer('xlsx', bytes, { apply: false });

    expect(result.data[0][4]).toBe('#SPILL!');

    hf.destroy();
  });

  it('should keep the code of a rich error when the Formulas plugin is off', async() => {
    const { plugin } = pluginWithFakeHot(true);
    const result = await plugin.importFromArrayBuffer('xlsx', fixture('excel-online-rich-errors'), { apply: false });

    expect(result.data[0][4]).toBe('#CALC!');
  });
});
