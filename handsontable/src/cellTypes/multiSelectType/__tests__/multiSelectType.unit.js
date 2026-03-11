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
  getValidator,
  getRegisteredValidatorNames,
} from '../../../validators';

describe('MultiSelectCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('multiselect');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('multiselect');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('multiselect');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('multiselect');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, MultiSelectCellType);

      expect(getRegisteredEditorNames()).toEqual(['multiselect']);
      expect(getEditor('multiselect')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['multiselect']);
      expect(getRenderer('multiselect')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['multiselect']);

      expect(getRegisteredCellTypeNames()).toEqual(['multiselect']);
      expect(getCellType('multiselect')).toEqual(MultiSelectCellType);
      expect(getCellType('multiselect')).toEqual({
        CELL_TYPE,
        _complexDataFormat: true,
        editor: getEditor('multiselect'),
        renderer: getRenderer('multiselect'),
        valueGetter: MultiSelectCellType.valueGetter,
        valueSetter: MultiSelectCellType.valueSetter,
        validator: getValidator('multiselect'),
        parsePastedValue: true,
      });
    });

    it('should be accessible via camelCase alias "multiSelect"', () => {
      registerCellType(CELL_TYPE, MultiSelectCellType);
      registerCellType('multiSelect', MultiSelectCellType);

      expect(getCellType('multiSelect')).toEqual(MultiSelectCellType);
      expect(getCellType('multiSelect')).toEqual(getCellType('multiselect'));
    });
  });
});
