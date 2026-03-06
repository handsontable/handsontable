import { CELL_TYPE, IntlDateCellType } from '../';
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
      });
    });
  });
});
