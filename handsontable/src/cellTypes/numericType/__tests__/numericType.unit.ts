import { CELL_TYPE, NumericCellType } from '../';
import {
  getCellType,
  getRegisteredCellTypeNames,
  registerCellType,
} from '../../registry';
import {
  getEditor,
  getRegisteredEditorNames,
} from '../../../editors';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../../renderers';
import {
  getRegisteredValidatorNames,
  getValidator,
} from '../../../validators';
import { valueSetter } from '../accessors/valueSetter';

describe('NumericCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('numeric');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('numeric');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('numeric');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('numeric');
      }).toThrowWithCause(undefined, { handsontable: true });
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, NumericCellType);

      expect(getRegisteredEditorNames()).toEqual(['numeric']);
      expect(getEditor('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['numeric']);
      expect(getRenderer('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['numeric']);
      expect(getValidator('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['numeric']);
      expect(getCellType('numeric')).toEqual(NumericCellType);
      expect(getCellType('numeric')).toEqual({
        CELL_TYPE,
        editor: getEditor('numeric'),
        renderer: getRenderer('numeric'),
        validator: getValidator('numeric'),
        valueFormatter: NumericCellType.valueFormatter,
        dataType: 'number',
        valueSetter: NumericCellType.valueSetter,
      });
    });
  });

  describe('valueSetter', () => {
    it('should parse grouped values for dot-decimal numeric formats', () => {
      expect(valueSetter('100,000', 0, 0, {
        locale: 'en-US',
      })).toBe(100000);
    });

    it('should parse multi-group thousands for dot-decimal numeric formats', () => {
      expect(valueSetter('1,234,567', 0, 0, {
        locale: 'en-US',
      })).toBe(1234567);
    });

    it('should keep comma as decimal separator for comma-decimal locales', () => {
      expect(valueSetter('100,000', 0, 0, {
        locale: 'de-DE',
      })).toBe(100);
    });

    it('should parse dot-thousands integers for European locales (decimal=comma)', () => {
      expect(valueSetter('7.000', 0, 0, { locale: 'de-DE' })).toBe(7000);
      expect(valueSetter('1.234.567', 0, 0, { locale: 'de-DE' })).toBe(1234567);
    });

    it('should parse dot-thousands with comma decimal as float for European locales (regression guard)', () => {
      expect(valueSetter('7.000,25', 0, 0, { locale: 'de-DE' })).toBe(7000.25);
    });

    it('should not treat zero-prefixed comma values as thousands when decimal is dot (en-US)', () => {
      const meta = {
        locale: 'en-US',
      };

      expect(valueSetter('0,001', 0, 0, meta)).toBe(0.001);
      expect(valueSetter('0,100', 0, 0, meta)).toBe(0.1);
      expect(valueSetter('0,010', 0, 0, meta)).toBe(0.01);
    });

    it('should return a number for lossless conversions regardless of the option', () => {
      const on = { preserveNumericLiteral: true };

      expect(valueSetter('9', 0, 0, on)).toBe(9);
      expect(valueSetter('9.5', 0, 0, on)).toBe(9.5);
      expect(valueSetter('1000', 0, 0, on)).toBe(1000);
      expect(valueSetter('-123.456', 0, 0, on)).toBe(-123.456);
      expect(valueSetter('09', 0, 0, on)).toBe(9);
    });

    it('should keep the old behavior (parse to number) by default, without the option', () => {
      expect(valueSetter('9.0', 0, 0, {})).toBe(9);
      expect(valueSetter('9.50', 0, 0, {})).toBe(9.5);
      expect(valueSetter('12345678901234567.8', 0, 0, {})).toBe(12345678901234568);
      expect(valueSetter('9.0', 0, 0, { preserveNumericLiteral: false })).toBe(9);
    });

    it('should preserve the original literal when a trailing fractional zero would be lost', () => {
      const on = { preserveNumericLiteral: true };

      expect(valueSetter('9.0', 0, 0, on)).toBe('9.0');
      expect(valueSetter('9.50', 0, 0, on)).toBe('9.50');
      expect(valueSetter('0.0', 0, 0, on)).toBe('0.0');
      expect(valueSetter('1000.0', 0, 0, on)).toBe('1000.0');
      expect(valueSetter('-9.0', 0, 0, on)).toBe('-9.0');
    });

    it('should preserve the original literal when precision beyond MAX_SAFE_INTEGER would be lost', () => {
      const on = { preserveNumericLiteral: true };

      expect(valueSetter('12345678901234567.8', 0, 0, on)).toBe('12345678901234567.8');
      expect(valueSetter('9007199254740989.00', 0, 0, on)).toBe('9007199254740989.00');
    });

    it('should trim surrounding whitespace on a preserved literal', () => {
      expect(valueSetter('  9.0  ', 0, 0, { preserveNumericLiteral: true })).toBe('9.0');
    });

    it('should be idempotent on a preserved literal', () => {
      const on = { preserveNumericLiteral: true };
      const preserved = valueSetter('9.0', 0, 0, on);

      expect(valueSetter(preserved, 0, 0, on)).toBe('9.0');
    });

    it('should not preserve comma-bearing literals even with the option on (guard limited to dot-decimal)', () => {
      expect(valueSetter('9,0', 0, 0, { locale: 'de-DE', preserveNumericLiteral: true })).toBe(9);
      expect(valueSetter('0,100', 0, 0, { locale: 'en-US', preserveNumericLiteral: true })).toBe(0.1);
    });

    it('should not preserve when grouping removal changes the string (not information loss)', () => {
      const on = { preserveNumericLiteral: true };

      expect(valueSetter('1,000', 0, 0, { ...on, locale: 'en-US' })).toBe(1000);
      expect(valueSetter('7.000', 0, 0, { ...on, locale: 'de-DE' })).toBe(7000);
    });
  });
});
