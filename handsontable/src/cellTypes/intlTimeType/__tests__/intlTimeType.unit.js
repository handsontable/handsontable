import { CELL_TYPE, IntlTimeCellType } from '../';
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
      });
    });
  });
});
