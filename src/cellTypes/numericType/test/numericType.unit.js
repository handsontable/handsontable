import { CELL_TYPE, NumericType } from '../';
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

describe('NumericType', () => {
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
      registerCellType(CELL_TYPE, NumericType);

      expect(getRegisteredEditorNames()).toEqual(['numeric']);
      expect(getEditor('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['numeric']);
      expect(getRenderer('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['numeric']);
      expect(getValidator('numeric')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['numeric']);
      expect(getCellType('numeric')).toEqual(NumericType);
      expect(getCellType('numeric')).toEqual({
        editor: getEditor('numeric'),
        renderer: getRenderer('numeric'),
        validator: getValidator('numeric'),
        dataType: 'number'
      });
    });
  });
});
