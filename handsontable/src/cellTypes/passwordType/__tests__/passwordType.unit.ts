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
  getValidator,
} from '../../../validators';
import { valueFormatter } from '../../../renderers/passwordRenderer/passwordRenderer';

describe('PasswordCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('password');
      }).toThrow();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('password');
      }).toThrow();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('password');
      }).toThrow();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('password');
      }).toThrow();

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
        valueFormatter,
      });
    });
  });

  describe('valueFormatter', () => {
    it('should be the password renderer formatter (identity pin)', () => {
      expect(typeof PasswordCellType.valueFormatter).toBe('function');
      expect(PasswordCellType.valueFormatter).toBe(valueFormatter);
    });
  });
});
