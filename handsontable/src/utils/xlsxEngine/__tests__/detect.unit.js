import ExcelJS from 'exceljs';
import { detectXlsxEngine } from '../detect';
import { excelJsAdapter } from '../adapters/exceljs';

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

  it('should throw the ExcelJS error message for null, non-objects and unknown shapes', () => {
    const expected = /Missing or invalid ExcelJS engine/;

    expect(() => detectXlsxEngine(null, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine(undefined, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine(42, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine({}, 'exportFile')).toThrow(expected);
    expect(() => detectXlsxEngine({ default: {} }, 'exportFile')).toThrow(expected);
  });

  it('should name the given plugin option in the error message', () => {
    expect(() => detectXlsxEngine({}, 'exportFile')).toThrow(/`exportFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/`importFile: \{ engines: \{ xlsx: ExcelJS \} \}`/);
    expect(() => detectXlsxEngine({}, 'importFile')).toThrow(/^Missing or invalid ExcelJS engine\./);
  });

  it('should mark the thrown error as a Handsontable error', () => {
    try {
      detectXlsxEngine({}, 'exportFile');
    } catch (error) {
      expect(error.cause).toEqual({ handsontable: true });
    }
  });
});
