import { CELL_TYPE, DatetimeCellType } from '../';
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

describe('DatetimeCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('datetime');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('datetime');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('datetime');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('datetime');
      }).toThrowWithCause(undefined, { handsontable: true });
    });

    it('should register cell type', () => {
      registerCellType(CELL_TYPE, DatetimeCellType);

      expect(getRegisteredEditorNames()).toEqual(['datetime']);
      expect(getEditor('datetime')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['datetime']);
      expect(getRenderer('datetime')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['datetime']);
      expect(getValidator('datetime')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['datetime']);
      expect(getCellType('datetime')).toEqual(DatetimeCellType);
      expect(getCellType('datetime')).toEqual({
        CELL_TYPE,
        editor: getEditor('datetime'),
        renderer: getRenderer('datetime'),
        validator: getValidator('datetime'),
        sourceDataValidator: expect.any(Function),
        sourceDataWarningMessage: expect.any(String),
        valueFormatter: expect.any(Function),
      });
    });
  });
});
