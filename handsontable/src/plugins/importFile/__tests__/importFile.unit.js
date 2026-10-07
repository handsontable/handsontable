/**
 * @jest-environment node
 */
import { Blob } from 'node:buffer';
import ExcelJS from 'exceljs';
import { ImportFile, PLUGIN_KEY, PLUGIN_PRIORITY } from '../importFile';
import { installImportedStyles } from '../applier';
import { mapWorkbook, resolveImportOptions, selectSheet } from '../mapper';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { excelJsAdapter } from '../../../utils/xlsxEngine/adapters/exceljs';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { SheetBuilder } from '../../../utils/xlsxEngine/builder';
import { createWorkbookSnapshot } from '../../../utils/xlsxEngine/model';
import { loadFixture as fixture, toArrayBuffer } from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';
import * as consoleHelpers from '../../../helpers/console';
import { registerCellType } from '../../../cellTypes/registry';

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

function pluginWithFakeHot(importFileSettings, { formulasEnabled = false, rtl = false } = {}) {
  const calls = [];
  const hooks = {};
  const rootDocument = fakeDocument();
  const hot = {
    // The stylesheet is mounted in the wrapper element; the fake head stands in for it.
    rootWrapperElement: rootDocument.head,
    guid: 'hot-1',
    rootDocument,
    toVisualRow: row => row,
    toVisualColumn: col => col,
    // `BasePlugin`'s constructor registers three hooks straight on `hot` (not on itself), so a
    // real `new ImportFile(hot)` needs this stub even though this suite never fires a hook.
    addHook: () => {},
    removeHook: () => {},
    getSettings: () => ({ importFile: importFileSettings }),
    getPlugin: name => ({
      formulas: { isEnabled: () => formulasEnabled },
      comments: { isEnabled: () => false },
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
    loadData: data => calls.push(['loadData', data]),
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
      .rejects.toThrow(/The "native" xlsx engine cannot import "csv" files.*Supported formats: xlsx/);
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
      { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false },
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
      { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false },
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
      { formulasEnabled: true, commentsEnabled: false, customBordersEnabled: false },
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
      { formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false, ...context },
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

      expect(read.definedNames).toEqual(expect.arrayContaining(['Sales', 'Rate']));

      const unknown = mapWorkbook(read, resolveImportOptions({}), {
        formulasEnabled: true, commentsEnabled: false, customBordersEnabled: false, formulaNamedExpressions: new Set(),
      }, dropped);

      expect(unknown.data.map(row => row[3])).toEqual([null, 60, 7, '=SUM(B2:B4)']);
      expect(dropped.list()).toContain('formula:definedName');

      const knownDropped = new DroppedFeatures();
      const known = mapWorkbook(read, resolveImportOptions({}), {
        formulasEnabled: true,
        commentsEnabled: false,
        customBordersEnabled: false,
        formulaNamedExpressions: new Set(['sales', 'rate']),
      }, knownDropped);

      expect(known.data.map(row => row[3])).toEqual([null, '=SUM(Sales)', '=Rate*100', '=SUM(B2:B4)']);
      expect(knownDropped.list()).not.toContain('formula:definedName');
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
    snapshot.definedNames = ['Sales'];

    const dropped = new DroppedFeatures();
    const mapped = mapWorkbook(snapshot, resolveImportOptions({}), {
      formulasEnabled: true,
      commentsEnabled: false,
      customBordersEnabled: false,
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
        formulasEnabled: false, commentsEnabled: false, customBordersEnabled: false,
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

    await expect(plugin.importFromArrayBuffer('xlsx', fixture('values'))).rejects.toThrow(/plugin is disabled/);
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
    const padded = new Uint8Array(bytes.byteLength + 16);

    padded.set(bytes, 8);

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
