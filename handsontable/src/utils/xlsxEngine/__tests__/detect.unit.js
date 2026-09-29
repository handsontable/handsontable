import ExcelJS from 'exceljs';
import { detectXlsxEngine, resolveEngineOverride, tryDetectXlsxEngine } from '../detect';
import { excelJsAdapter } from '../adapters/exceljs';
import { nativeAdapter } from '../adapters/native';

describe('detectXlsxEngine', () => {
  it('should detect the real ExcelJS module', () => {
    const detected = detectXlsxEngine(ExcelJS, 'exportFile');

    expect(detected.kind).toBe('exceljs');
    expect(detected.version).toBeNull();
    expect(detected.module).toBe(ExcelJS);
    expect(detected.adapter).toBe(excelJsAdapter);
    expect(detected.capabilities.styles).toBe(true);
  });

  it('should accept any object exposing a Workbook constructor (today\'s guard)', () => {
    const fake = { Workbook: function Workbook() {} };

    expect(detectXlsxEngine(fake, 'exportFile').kind).toBe('exceljs');
  });

  it('should unwrap a module handed over under `.default` by bundler interop', () => {
    expect(detectXlsxEngine({ default: ExcelJS }, 'exportFile').module).toBe(ExcelJS);
  });

  it('should fall back to the native engine when nothing was injected', () => {
    const detected = detectXlsxEngine(undefined, 'importFile');

    expect(detected.kind).toBe('native');
    expect(detected.version).toBeNull();
    expect(detected.module).toBeNull();
    expect(detected.adapter).toBe(nativeAdapter);
    expect(detected.capabilities.compressionLevel).toBe(false);
  });

  it('should treat `null` like `undefined` and select the built-in engine', () => {
    // `engines: { xlsx: null }` is what a conditional `xlsx: useExcelJs ? ExcelJS : null` writes,
    // and it has to mean the same thing everywhere: no engine, so the built-in one. The predicate,
    // the export and the import all reach this helper, so this is the one place the rule lives.
    const detected = detectXlsxEngine(null, 'exportFile');

    expect(detected.kind).toBe('native');
    expect(detected.adapter).toBe(nativeAdapter);
  });

  it('should throw for an injected value that is not an engine', () => {
    const expected = /^Invalid xlsx engine module\./;

    expect(() => detectXlsxEngine(42, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine(0, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine(false, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine('', 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine({}, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine({ default: {} }, 'exportFile')).toThrow(expected);
  });

  it('should name the given plugin option and the built-in alternative in the error message', () => {
    expect(() => detectXlsxEngine({}, 'exportFile')).toThrow(/`exportFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/`importFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/omit `engines` to use the built-in engine/);
  });

  it('should mark the thrown error as a Handsontable error', () => {
    try {
      detectXlsxEngine({}, 'exportFile');
    } catch (error) {
      expect(error.cause).toEqual({ handsontable: true });
    }
  });
});

describe('resolveEngineOverride', () => {
  it('should prefer the per-call override over the configured engine', () => {
    const configured = { Workbook: class {} };

    expect(resolveEngineOverride(ExcelJS, configured)).toBe(ExcelJS);
  });

  it('should fall back to the configured engine for a nullish override', () => {
    // A per-call `engine: null` means "no override", so a grid that configured ExcelJS keeps it.
    expect(resolveEngineOverride(null, ExcelJS)).toBe(ExcelJS);
    expect(resolveEngineOverride(undefined, ExcelJS)).toBe(ExcelJS);
  });

  it('should keep a falsy but non-nullish override (`??`, not `||`)', () => {
    // `||` would hand these back to the configured engine and hide a caller's mistake behind a
    // working export. They are wrong values, and `detectXlsxEngine` is what refuses them.
    expect(resolveEngineOverride(0, ExcelJS)).toBe(0);
    expect(resolveEngineOverride(false, ExcelJS)).toBe(false);
    expect(resolveEngineOverride('', ExcelJS)).toBe('');
  });

  it('should pass a nullish configured engine through when nothing overrides it', () => {
    expect(resolveEngineOverride(undefined, null)).toBeNull();
    expect(resolveEngineOverride(undefined, undefined)).toBeUndefined();
    expect(resolveEngineOverride(null, undefined)).toBeUndefined();
  });
});

describe('tryDetectXlsxEngine', () => {
  it('should answer `null` instead of throwing for a value that is not an engine', () => {
    expect(tryDetectXlsxEngine({}, 'exportFile')).toBeNull();
    expect(tryDetectXlsxEngine(42, 'importFile')).toBeNull();
    expect(tryDetectXlsxEngine({ default: {} }, 'exportFile')).toBeNull();
  });

  it('should detect the same engine `detectXlsxEngine` does for a valid value', () => {
    expect(tryDetectXlsxEngine(ExcelJS, 'exportFile').kind).toBe('exceljs');
    expect(tryDetectXlsxEngine({ default: ExcelJS }, 'exportFile').module).toBe(ExcelJS);
    expect(tryDetectXlsxEngine(undefined, 'importFile').kind).toBe('native');
    expect(tryDetectXlsxEngine(null, 'importFile').kind).toBe('native');
  });
});
