import { CELL_TYPE, PasswordType } from '../';
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
} from '../../../validators';

describe('PasswordType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('password');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('password');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('password');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('password');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, PasswordType);

      expect(getRegisteredEditorNames()).toEqual(['password']);
      expect(getEditor('password')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['password']);
      expect(getRenderer('password')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['password']);
      expect(getCellType('password')).toEqual(PasswordType);
      expect(getCellType('password')).toEqual({
        editor: getEditor('password'),
        renderer: getRenderer('password'),
        copyable: false,
      });
    });
  });
});
