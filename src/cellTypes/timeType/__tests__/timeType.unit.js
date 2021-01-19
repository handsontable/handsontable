import { CELL_TYPE, TimeCellType } from '../';
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
  getValidator,
} from '../../../validators';

describe('TimeCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('time');
      }).toThrowError();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('time');
      }).toThrowError();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('time');
      }).toThrowError();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('time');
      }).toThrowError();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, TimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['time']);
      expect(getEditor('time')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['time']);
      expect(getRenderer('time')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['time']);
      expect(getValidator('time')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['time']);
      expect(getCellType('time')).toEqual(TimeCellType);
      expect(getCellType('time')).toEqual({
        CELL_TYPE,
        editor: getEditor('time'),
        renderer: getRenderer('time'),
        validator: getValidator('time'),
      });
    });
  });
});
