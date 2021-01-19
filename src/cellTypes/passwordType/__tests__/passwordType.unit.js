import { CELL_TYPE, PasswordCellType } from '../';
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
} from '../../../validators';

describe('PasswordCellType', () => {
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
      registerCellType(CELL_TYPE, PasswordCellType);

      expect(getRegisteredEditorNames()).toEqual(['password']);
      expect(getEditor('password')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['password']);
      expect(getRenderer('password')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['password']);
      expect(getCellType('password')).toEqual(PasswordCellType);
      expect(getCellType('password')).toEqual({
        CELL_TYPE,
        editor: getEditor('password'),
        renderer: getRenderer('password'),
        copyable: false,
      });
    });
  });
});
