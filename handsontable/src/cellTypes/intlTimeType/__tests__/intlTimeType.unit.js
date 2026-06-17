import { CELL_TYPE, IntlTimeCellType } from '../';
import { CELL_TYPE as TIME_CELL_TYPE, TimeCellType } from '../../timeType';
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

describe('IntlTimeCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('intl-time');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('intl-time');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('intl-time');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('intl-time');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, IntlTimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['intl-time']);
      expect(getEditor('intl-time')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['intl-time']);
      expect(getRenderer('intl-time')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['intl-time']);
      expect(getValidator('intl-time')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['intl-time']);
      expect(getCellType('intl-time')).toEqual(IntlTimeCellType);
      expect(getCellType('intl-time')).toEqual({
        CELL_TYPE,
        editor: getEditor('intl-time'),
        renderer: getRenderer('intl-time'),
        validator: getValidator('intl-time'),
        sourceDataValidator: IntlTimeCellType.sourceDataValidator,
        valueFormatter: IntlTimeCellType.valueFormatter,
        sourceDataWarningMessage: IntlTimeCellType.sourceDataWarningMessage,
        valueSetter: IntlTimeCellType.valueSetter,
      });
    });
  });

  describe('alias equivalence', () => {
    it('should resolve intl-time editor to the same implementation as the time editor', () => {
      registerCellType(CELL_TYPE, IntlTimeCellType);
      registerCellType(TIME_CELL_TYPE, TimeCellType);

      // IntlTimeEditor extends TimeEditor — they share the same prototype chain
      const intlTimeEditorPrototype = Object.getPrototypeOf(getEditor('intl-time'));

      expect(intlTimeEditorPrototype).toBe(getEditor('time'));
    });

    it('should have the same validator behavior for intl-time and time cell types', () => {
      registerCellType(CELL_TYPE, IntlTimeCellType);

      const intlTimeValidator = getValidator('intl-time');
      const results = [];

      // Valid HH:mm time
      intlTimeValidator.call({}, '12:30', valid => results.push(valid));
      // Valid HH:mm:ss time
      intlTimeValidator.call({}, '08:45:00', valid => results.push(valid));
      // Invalid time format
      intlTimeValidator.call({}, '25:00', valid => results.push(valid));
      // Empty string (allowEmpty defaults to true)
      intlTimeValidator.call({ allowEmpty: true }, '', valid => results.push(valid));

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(false);
      expect(results[3]).toBe(true);
    });
  });
});
