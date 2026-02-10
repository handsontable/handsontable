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
        getEditor('intlTime');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('intlTime');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('intlTime');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('intlTime');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, IntlTimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['intlTime']);
      expect(getEditor('intlTime')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['intlTime']);
      expect(getRenderer('intlTime')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['intlTime']);
      expect(getValidator('intlTime')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['intlTime']);
      expect(getCellType('intlTime')).toEqual(IntlTimeCellType);
      expect(getCellType('intlTime')).toEqual({
        CELL_TYPE,
        editor: getEditor('intlTime'),
        renderer: getRenderer('intlTime'),
        validator: getValidator('intlTime'),
        sourceDataValidator: IntlTimeCellType.sourceDataValidator,
        valueFormatter: IntlTimeCellType.valueFormatter,
        sourceDataWarningMessage: IntlTimeCellType.sourceDataWarningMessage,
      });
    });
  });
});
