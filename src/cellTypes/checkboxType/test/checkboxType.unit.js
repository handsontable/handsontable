import { CELL_TYPE, CheckboxType } from '../';
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

describe('CheckboxType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('checkbox');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('checkbox');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('checkbox');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('checkbox');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, CheckboxType);

      expect(getRegisteredEditorNames()).toEqual(['checkbox']);
      expect(getEditor('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['checkbox']);
      expect(getRenderer('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['checkbox']);
      expect(getCellType('checkbox')).toEqual(CheckboxType);
      expect(getCellType('checkbox')).toEqual({
        editor: getEditor('checkbox'),
        renderer: getRenderer('checkbox'),
      });
    });
  });
});
