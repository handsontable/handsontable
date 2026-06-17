import { CELL_TYPE, IntlDateCellType } from '../';
import { CELL_TYPE as DATE_CELL_TYPE, DateCellType } from '../../dateType';
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

describe('IntlDateCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('intl-date');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('intl-date');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('intl-date');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('intl-date');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, IntlDateCellType);

      expect(getRegisteredEditorNames()).toEqual(['intl-date']);
      expect(getEditor('intl-date')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['intl-date']);
      expect(getRenderer('intl-date')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['intl-date']);
      expect(getValidator('intl-date')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['intl-date']);
      expect(getCellType('intl-date')).toEqual(IntlDateCellType);
      expect(getCellType('intl-date')).toEqual({
        CELL_TYPE,
        editor: getEditor('intl-date'),
        renderer: getRenderer('intl-date'),
        validator: getValidator('intl-date'),
        sourceDataValidator: IntlDateCellType.sourceDataValidator,
        valueFormatter: IntlDateCellType.valueFormatter,
        sourceDataWarningMessage: IntlDateCellType.sourceDataWarningMessage,
        valueSetter: IntlDateCellType.valueSetter,
      });
    });
  });

  describe('alias equivalence', () => {
    it('should resolve intl-date editor to the same implementation as the date editor', () => {
      registerCellType(CELL_TYPE, IntlDateCellType);
      registerCellType(DATE_CELL_TYPE, DateCellType);

      // IntlDateEditor extends DateEditor — they share the same prototype chain
      const intlDateEditorPrototype = Object.getPrototypeOf(getEditor('intl-date'));

      expect(intlDateEditorPrototype).toBe(getEditor('date'));
    });

    it('should have the same validator behavior for intl-date and date cell types', () => {
      registerCellType(CELL_TYPE, IntlDateCellType);

      const intlDateValidator = getValidator('intl-date');
      const results = [];

      // Valid ISO date
      intlDateValidator.call({}, '2023-05-15', valid => results.push(valid));
      // Invalid non-ISO date
      intlDateValidator.call({}, '15/05/2023', valid => results.push(valid));
      // Empty string (allowEmpty defaults to true)
      intlDateValidator.call({ allowEmpty: true }, '', valid => results.push(valid));

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(true);
    });
  });
});
