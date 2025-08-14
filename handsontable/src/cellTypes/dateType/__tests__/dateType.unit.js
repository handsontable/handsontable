import { CELL_TYPE, DateCellType } from '../';
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

describe('DateCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('date');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('date');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('date');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('date');
      }).toThrowWithCause(undefined, { handsontable: true });
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, DateCellType);

      expect(getRegisteredEditorNames()).toEqual(['date']);
      expect(getEditor('date')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['date']);
      expect(getRenderer('date')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['date']);
      expect(getValidator('date')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['date']);
      expect(getCellType('date')).toEqual(DateCellType);
      expect(getCellType('date')).toEqual({
        CELL_TYPE,
        editor: getEditor('date'),
        renderer: getRenderer('date'),
        validator: getValidator('date'),
      });
    });
  });
});
