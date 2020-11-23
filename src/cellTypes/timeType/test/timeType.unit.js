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
import timeType from '../index';

describe('timeType', () => {
  describe('registering', () => {
    it('should auto-register cell type after import', () => {
      expect(getRegisteredEditorNames()).toEqual(['base', 'text', 'time']);
      expect(getEditor('time')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['base', 'text', 'time']);
      expect(getRenderer('time')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['time']);
      expect(getValidator('time')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['time']);
      expect(getCellType('time')).toEqual(timeType);
      expect(getCellType('time')).toEqual({
        editor: getEditor('time'),
        renderer: getRenderer('time'),
        validator: getValidator('time'),
      });
    });
  });
});
