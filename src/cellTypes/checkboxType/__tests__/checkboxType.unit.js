import { CELL_TYPE, CheckboxCellType } from '../';
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

describe('CheckboxCellType', () => {
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
      registerCellType(CELL_TYPE, CheckboxCellType);

      expect(getRegisteredEditorNames()).toEqual(['checkbox']);
      expect(getEditor('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['checkbox']);
      expect(getRenderer('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['checkbox']);
      expect(getCellType('checkbox')).toEqual(CheckboxCellType);
      expect(getCellType('checkbox')).toEqual({
        CELL_TYPE,
        editor: getEditor('checkbox'),
        renderer: getRenderer('checkbox'),
      });
    });
  });
});
