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
import textType from '../index';

describe('textType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text']);
      expect(getEditor('text')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text']);
      expect(getRenderer('text')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['text']);
      expect(getCellType('text')).toEqual(textType);
      expect(getCellType('text')).toEqual({
        editor: getEditor('text'),
        renderer: getRenderer('text'),
      });
    });
  });
});
