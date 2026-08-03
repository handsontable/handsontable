import { CELL_TYPE, IntlDatetimeCellType } from '../';
import { CELL_TYPE as DATETIME_CELL_TYPE, DatetimeCellType } from '../../datetimeType';
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

describe('IntlDatetimeCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('intl-datetime');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('intl-datetime');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('intl-datetime');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('intl-datetime');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, IntlDatetimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['intl-datetime']);
      expect(getEditor('intl-datetime')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['intl-datetime']);
      expect(getRenderer('intl-datetime')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['intl-datetime']);
      expect(getValidator('intl-datetime')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['intl-datetime']);
      expect(getCellType('intl-datetime')).toEqual(IntlDatetimeCellType);
      expect(getCellType('intl-datetime')).toEqual({
        CELL_TYPE,
        editor: getEditor('intl-datetime'),
        renderer: getRenderer('intl-datetime'),
        validator: getValidator('intl-datetime'),
        sourceDataValidator: IntlDatetimeCellType.sourceDataValidator,
        valueFormatter: IntlDatetimeCellType.valueFormatter,
        sourceDataWarningMessage: IntlDatetimeCellType.sourceDataWarningMessage,
      });
    });
  });

  describe('alias equivalence', () => {
    it('should resolve intl-datetime editor to the same implementation as the datetime editor', () => {
      registerCellType(CELL_TYPE, IntlDatetimeCellType);
      registerCellType(DATETIME_CELL_TYPE, DatetimeCellType);

      // IntlDatetimeEditor extends DatetimeEditor — they share the same prototype chain
      const intlDatetimeEditorPrototype = Object.getPrototypeOf(getEditor('intl-datetime'));

      expect(intlDatetimeEditorPrototype).toBe(getEditor('datetime'));
    });

    it('should have the same validator behavior for intl-datetime and datetime cell types', () => {
      registerCellType(CELL_TYPE, IntlDatetimeCellType);

      const intlDatetimeValidatorFn = getValidator('intl-datetime');
      const results = [];

      // Valid ISO datetime
      intlDatetimeValidatorFn.call({}, '2024-12-25T14:30:00', valid => results.push(valid));
      // Invalid time format
      intlDatetimeValidatorFn.call({}, '25:00', valid => results.push(valid));
      // Empty string (allowEmpty defaults to true)
      intlDatetimeValidatorFn.call({ allowEmpty: true }, '', valid => results.push(valid));

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(false);
      expect(results[2]).toBe(true);
    });
  });
});
