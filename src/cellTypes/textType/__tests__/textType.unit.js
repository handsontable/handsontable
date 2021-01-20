import {
  CELL_TYPE,
  TextCellType,
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

describe('TextCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('text');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('text');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('text');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('text');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, TextCellType);

      expect(getRegisteredEditorNames()).toEqual(['text']);
      expect(getEditor('text')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['text']);
      expect(getRenderer('text')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['text']);
      expect(getCellType('text')).toEqual(TextCellType);
      expect(getCellType('text')).toEqual({
        CELL_TYPE,
        editor: getEditor('text'),
        renderer: getRenderer('text'),
      });
    });
  });
});
