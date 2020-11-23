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
  getValidator,
} from '../../../validators/validators';
import {
  getCellType,
  getRegisteredCellTypeNames,
} from '../../cellTypes';
import autocompleteType from '../index';

describe('autocompleteType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text', 'handsontable', 'autocomplete']);
      expect(getEditor('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'html', 'autocomplete']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['autocomplete']);
      expect(getValidator('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['autocomplete']);
      expect(getCellType('autocomplete')).toEqual(autocompleteType);
      expect(getCellType('autocomplete')).toEqual({
        editor: getEditor('autocomplete'),
        renderer: getRenderer('autocomplete'),
        validator: getValidator('autocomplete'),
      });
    });
  });
});
