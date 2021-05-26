import { CELL_TYPE, AutocompleteCellType } from '../';
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

describe('AutocompleteCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('autocomplete');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('autocomplete');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('autocomplete');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('autocomplete');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, AutocompleteCellType);

      expect(getRegisteredEditorNames()).toEqual(['autocomplete']);
      expect(getEditor('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['autocomplete']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['autocomplete']);
      expect(getValidator('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['autocomplete']);
      expect(getCellType('autocomplete')).toEqual(AutocompleteCellType);
      expect(getCellType('autocomplete')).toEqual({
        CELL_TYPE,
        editor: getEditor('autocomplete'),
        renderer: getRenderer('autocomplete'),
        validator: getValidator('autocomplete'),
      });
    });
  });
});
