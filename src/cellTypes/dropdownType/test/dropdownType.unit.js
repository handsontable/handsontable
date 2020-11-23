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
import dropdownType from '../index';

describe('dropdownType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text', 'handsontable', 'autocomplete', 'dropdown']);
      expect(getEditor('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'html', 'autocomplete', 'dropdown']);
      expect(getRenderer('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['autocomplete', 'dropdown']);
      expect(getValidator('dropdown')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['dropdown']);
      expect(getCellType('dropdown')).toEqual(dropdownType);
      expect(getCellType('dropdown')).toEqual({
        editor: getEditor('dropdown'),
        renderer: getRenderer('dropdown'),
        validator: getValidator('dropdown')
      });
    });
  });
});
