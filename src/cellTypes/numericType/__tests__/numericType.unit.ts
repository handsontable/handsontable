import { CELL_TYPE, NumericCellType } from '../';
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

describe('NumericCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('numeric');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('numeric');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('numeric');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('numeric');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, NumericCellType);

      expect(getRegisteredEditorNames()).toEqual(['numeric']);
      expect(getEditor('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['numeric']);
      expect(getRenderer('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['numeric']);
      expect(getValidator('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['numeric']);
      expect(getCellType('numeric')).toEqual(NumericCellType);
      expect(getCellType('numeric')).toEqual({
        CELL_TYPE,
        editor: getEditor('numeric'),
        renderer: getRenderer('numeric'),
        validator: getValidator('numeric'),
        dataType: 'number'
      });
    });
  });
});
