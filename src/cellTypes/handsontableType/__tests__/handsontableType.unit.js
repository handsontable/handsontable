import { CELL_TYPE, HandsontableCellType } from '../';
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

describe('HandsontableCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('handsontable');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('handsontable');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('handsontable');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('handsontable');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, HandsontableCellType);

      expect(getRegisteredEditorNames()).toEqual(['handsontable']);
      expect(getEditor('handsontable')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['handsontable']);
      expect(getRenderer('handsontable')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['handsontable']);
      expect(getCellType('handsontable')).toEqual(HandsontableCellType);
      expect(getCellType('handsontable')).toEqual({
        CELL_TYPE,
        editor: getEditor('handsontable'),
        renderer: getRenderer('handsontable'),
      });
    });
  });
});
