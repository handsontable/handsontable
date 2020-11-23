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
import dateType from '../index';

describe('dateType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text', 'date']);
      expect(getEditor('date')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'html', 'autocomplete', 'date']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['date']);
      expect(getValidator('date')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['date']);
      expect(getCellType('date')).toEqual(dateType);
      expect(getCellType('date')).toEqual({
        editor: getEditor('date'),
        renderer: getRenderer('autocomplete'),
        validator: getValidator('date'),
      });
    });
  });
});
