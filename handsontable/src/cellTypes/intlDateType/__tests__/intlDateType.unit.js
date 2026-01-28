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
        getEditor('intlDate');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('intlDate');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('intlDate');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('intlDate');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, IntlDateCellType);

      expect(getRegisteredEditorNames()).toEqual(['intlDate']);
      expect(getEditor('intlDate')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['intlDate']);
      expect(getRenderer('intlDate')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['intlDate']);
      expect(getValidator('intlDate')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['intlDate']);
      expect(getCellType('intlDate')).toEqual(IntlDateCellType);
      expect(getCellType('intlDate')).toEqual({
        CELL_TYPE,
        editor: getEditor('intlDate'),
        renderer: getRenderer('intlDate'),
        validator: getValidator('intlDate'),
        valueFormatter: IntlDateCellType.valueFormatter,
      });
    });
  });
});
