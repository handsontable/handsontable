import { CELL_TYPE, AutocompleteType } from '../';
import {
  getCellType,
  getRegisteredCellTypeNames,
  registerCellType,
} from '../../cellTypes';
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

describe('AutocompleteType', () => {
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
      registerCellType(CELL_TYPE, AutocompleteType);

      expect(getRegisteredEditorNames()).toEqual(['autocomplete']);
      expect(getEditor('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['autocomplete']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['autocomplete']);
      expect(getValidator('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['autocomplete']);
      expect(getCellType('autocomplete')).toEqual(AutocompleteType);
      expect(getCellType('autocomplete')).toEqual({
        editor: getEditor('autocomplete'),
        renderer: getRenderer('autocomplete'),
        validator: getValidator('autocomplete'),
      });
    });
  });
});
