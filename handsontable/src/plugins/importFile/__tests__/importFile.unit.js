/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Blob } from 'node:buffer';
import ExcelJS from 'exceljs';
import { ImportFile, PLUGIN_KEY, PLUGIN_PRIORITY } from '../importFile';
import { installImportedStyles } from '../applier';

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

function fixture(name) {
  const bytes = readFileSync(join(__dirname, '../../../utils/xlsxEngine/__tests__/fixtures', `${name}.xlsx`));

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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

  it('should return false when no engine is configured', () => {
    expect(supports(undefined, 'xlsx')).toBe(false);
    expect(supports(true, 'xlsx')).toBe(false);
    expect(supports({}, 'xlsx')).toBe(false);
    expect(supports({ engines: {} }, 'xlsx')).toBe(false);
  });

  it('should return true for xlsx with ExcelJS and false for formats ExcelJS cannot read', () => {
    expect(supports({ engines: { xlsx: ExcelJS } }, 'xlsx')).toBe(true);
    expect(supports({ engines: { xlsx: ExcelJS } }, 'xls')).toBe(false);
    expect(supports({ engines: { xlsx: ExcelJS } }, 'csv')).toBe(false);
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
    expect(calls.map(call => call[0])).toEqual(['beforeImport', 'loadData', 'updateSettings', 'afterImport']);
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

    // `engines` is keyed by format, so a format with no engine of its own is named as such.
    await expect(plugin.importFromArrayBuffer('csv', fixture('values')))
      .rejects.toThrow(/no engine is configured for "csv".*Configured formats: xlsx/);
    // A per-call engine still goes through the format check of the engine it detects.
    await expect(plugin.importFromArrayBuffer('csv', fixture('values'), { engine: ExcelJS }))
      .rejects.toThrow(/cannot import "csv".*xlsx/);
    await expect(noEngine.importFromArrayBuffer('xlsx', fixture('values')))
      .rejects.toThrow(/Missing or invalid ExcelJS engine.*`importFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    await expect(plugin.importFromArrayBuffer('xlsx', new Uint8Array([1, 2]).buffer))
      .rejects.toThrow(/could not be parsed/);
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

    installImportedStyles(hot, { 'htImported-a': 'color:red' });
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

    installImportedStyles(hot, { 'htImported-a': 'color:red' });

    expect(hot.rootDocument.head.querySelector(selector)).not.toBeNull();

    expect(() => plugin.destroy()).not.toThrow();

    expect(hot.rootDocument.head.querySelector(selector)).toBeNull();
  });
});
