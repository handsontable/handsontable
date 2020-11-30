import { CELL_TYPE, DateType } from '../';
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

describe('DateType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('date');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('date');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('date');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('date');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, DateType);

      expect(getRegisteredEditorNames()).toEqual(['date']);
      expect(getEditor('date')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['date']);
      expect(getRenderer('date')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['date']);
      expect(getValidator('date')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['date']);
      expect(getCellType('date')).toEqual(DateType);
      expect(getCellType('date')).toEqual({
        editor: getEditor('date'),
        renderer: getRenderer('date'),
        validator: getValidator('date'),
      });
    });
  });
});
