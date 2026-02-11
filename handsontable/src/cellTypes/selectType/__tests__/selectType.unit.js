import {
  CELL_TYPE,
  SelectCellType,
} from '../';
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

describe('SelectCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('select');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('select');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('select');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('select');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, SelectCellType);

      expect(getRegisteredEditorNames()).toEqual(['select']);
      expect(getEditor('select')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['select']);
      expect(getRenderer('select')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['select']);
      expect(getCellType('select')).toEqual(SelectCellType);
      expect(getCellType('select')).toEqual({
        CELL_TYPE,
        editor: getEditor('select'),
        renderer: getRenderer('select'),
      });
    });
  });
});
