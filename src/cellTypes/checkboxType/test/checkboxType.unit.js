import {
  getEditor,
  getRegisteredEditorNames,
} from '../../../editors/editors';
import {
  getRegisteredRendererNames,
  getRenderer,
} from '../../../renderers/renderers';
import {
  getRegisteredValidatorNames,
} from '../../../validators/validators';
import {
  getCellType,
  getRegisteredCellTypeNames,
} from '../../cellTypes';
import checkboxType from '../index';

describe('checkboxType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'checkbox']);
      expect(getEditor('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'checkbox']);
      expect(getRenderer('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['checkbox']);
      expect(getCellType('checkbox')).toEqual(checkboxType);
      expect(getCellType('checkbox')).toEqual({
        editor: getEditor('checkbox'),
        renderer: getRenderer('checkbox'),
      });
    });
  });
});
