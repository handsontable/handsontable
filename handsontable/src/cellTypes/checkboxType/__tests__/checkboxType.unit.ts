import { CELL_TYPE, CheckboxCellType } from '../';
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

describe('CheckboxCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('checkbox');
      }).toThrow();

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('checkbox');
      }).toThrow();

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('checkbox');
      }).toThrow();

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('checkbox');
      }).toThrow();
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, CheckboxCellType);

      expect(getRegisteredEditorNames()).toEqual(['checkbox']);
      expect(getEditor('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['checkbox']);
      expect(getRenderer('checkbox')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual([]);

      expect(getRegisteredCellTypeNames()).toEqual(['checkbox']);
      expect(getCellType('checkbox')).toEqual(CheckboxCellType);
      expect(getCellType('checkbox')).toEqual({
        CELL_TYPE,
        editor: getEditor('checkbox'),
        renderer: getRenderer('checkbox'),
        valueSetter: CheckboxCellType.valueSetter,
      });
    });
  });

  describe('valueSetter (DEV-355)', () => {
    const set = (value: unknown, meta: Record<string, unknown> = {}) => CheckboxCellType.valueSetter.call(
      { getCellMetaTransient: () => meta }, value, 0, 0,
    );

    it('should store the template a case variant stands for', () => {
      expect(set('TRUE')).toBe(true);
      expect(set('False')).toBe(false);
      expect(set('YES', { checkedTemplate: 'yes', uncheckedTemplate: 'no' })).toBe('yes');
    });

    it('should apply the `true`/`false` defaults for a cell whose templates are not in the meta', () => {
      // A cell that was never rendered: the renderer is what writes the defaults into the meta.
      expect(set('true')).toBe(true);
      expect(set('false')).toBe(false);
    });

    it('should keep both states for templates that differ only in letter case', () => {
      const meta = { checkedTemplate: 'Y', uncheckedTemplate: 'y' };

      expect(set('y', meta)).toBe('y');
      expect(set('Y', meta)).toBe('Y');
    });

    it('should store an `UndoRedo.*` write verbatim', () => {
      const setWithSource = (value: unknown, source: string) => CheckboxCellType.valueSetter.call(
        { getCellMetaTransient: () => ({}) }, value, 0, 0, {}, source,
      );

      expect(setWithSource('False', 'UndoRedo.undo')).toBe('False');
      expect(setWithSource('TRUE', 'UndoRedo.redo')).toBe('TRUE');
      expect(setWithSource('False', 'edit')).toBe(false);
    });

    it('should store a value that matches neither template unchanged', () => {
      expect(set('Ted')).toBe('Ted');
      expect(set('')).toBe('');
    });
  });
});
