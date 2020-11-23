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
import handsontableType from '../index';

describe('handsontableType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text', 'handsontable']);
      expect(getEditor('handsontable')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'html', 'autocomplete', 'handsontable']);
      expect(getRenderer('handsontable')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['handsontable']);
      expect(getCellType('handsontable')).toEqual(handsontableType);
      expect(getCellType('handsontable')).toEqual({
        editor: getEditor('handsontable'),
        renderer: getRenderer('handsontable'),
      });
    });
  });
});
