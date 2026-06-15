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
  });
});
