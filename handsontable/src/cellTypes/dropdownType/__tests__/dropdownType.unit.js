import { CELL_TYPE, DropdownCellType } from '../';
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

describe('DropdownCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('dropdown');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('dropdown');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('dropdown');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('dropdown');
      }).toThrowError();
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, DropdownCellType);

      expect(getRegisteredEditorNames()).toEqual(['dropdown']);
      expect(getEditor('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['dropdown']);
      expect(getRenderer('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['dropdown']);
      expect(getValidator('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['dropdown']);
      expect(getCellType('dropdown')).toEqual(DropdownCellType);
      expect(getCellType('dropdown')).toEqual({
        CELL_TYPE,
        editor: getEditor('dropdown'),
        renderer: getRenderer('dropdown'),
        validator: getValidator('dropdown'),
        filter: false,
        strict: true,
      });
    });
  });
});
