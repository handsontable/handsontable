import {
  CELL_TYPE,
  MultiSelectCellType,
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

describe('MultiSelectCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('multiSelect');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('multiSelect');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('multiSelect');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('multiSelect');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, MultiSelectCellType);

      expect(getRegisteredEditorNames()).toEqual(['multiSelect']);
      expect(getEditor('multiSelect')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['multiSelect']);
      expect(getRenderer('multiSelect')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['multiSelect']);
      expect(getCellType('multiSelect')).toEqual(MultiSelectCellType);
      expect(getCellType('multiSelect')).toEqual({
        CELL_TYPE,
        editor: getEditor('multiSelect'),
        renderer: getRenderer('multiSelect'),
        valueGetter: MultiSelectCellType.valueGetter,
        valueSetter: MultiSelectCellType.valueSetter,
      });
    });
  });
});
