import ExcelJS from 'exceljs';
import { detectXlsxEngine } from '../detect';
import { excelJsAdapter } from '../adapters/exceljs';

describe('detectXlsxEngine', () => {
  it('should detect the real ExcelJS module', () => {
    const detected = detectXlsxEngine(ExcelJS);

    expect(detected.kind).toBe('exceljs');
    expect(detected.version).toBeNull();
    expect(detected.module).toBe(ExcelJS);
    expect(detected.adapter).toBe(excelJsAdapter);
    expect(detected.capabilities.styles).toBe(true);
  });

  it('should accept any object exposing a Workbook constructor (today\'s guard)', () => {
    const fake = { Workbook: function Workbook() {} };

    expect(detectXlsxEngine(fake).kind).toBe('exceljs');
  });

  it('should unwrap a module handed over under `.default` by bundler interop', () => {
    expect(detectXlsxEngine({ default: ExcelJS }).module).toBe(ExcelJS);
  });

  it('should throw the ExcelJS error message for null, non-objects and unknown shapes', () => {
    const expected = /Missing or invalid ExcelJS engine/;

    expect(() => detectXlsxEngine(null)).toThrow(expected);
    expect(() => detectXlsxEngine(undefined)).toThrow(expected);
    expect(() => detectXlsxEngine(42)).toThrow(expected);
    expect(() => detectXlsxEngine({})).toThrow(expected);
    expect(() => detectXlsxEngine({ default: {} })).toThrow(expected);
  });

  it('should name the exportFile option by default and the given option otherwise', () => {
    expect(() => detectXlsxEngine({})).toThrow(/`exportFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/`importFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/^Missing or invalid ExcelJS engine\./);
  });

  it('should mark the thrown error as a Handsontable error', () => {
    try {
      detectXlsxEngine({});
    } catch (error) {
      expect(error.cause).toEqual({ handsontable: true });
    }
  });
});
