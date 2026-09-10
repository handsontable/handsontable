import { CELL_TYPE, AutocompleteCellType } from '../';
import type { ChoiceMeta } from '../accessors/valueSetter';
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

describe('AutocompleteCellType', () => {
  describe('registering', () => {
    it('should not auto-register after import', () => {
      expect(getRegisteredEditorNames()).toEqual([]);
      expect(() => {
        getEditor('autocomplete');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredRendererNames()).toEqual([]);
      expect(() => {
        getRenderer('autocomplete');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredValidatorNames()).toEqual([]);
      expect(() => {
        getValidator('autocomplete');
      }).toThrowWithCause(undefined, { handsontable: true });

      expect(getRegisteredCellTypeNames()).toEqual([]);
      expect(() => {
        getCellType('autocomplete');
      }).toThrowWithCause(undefined, { handsontable: true });
    });
    it('should register cell type', () => {
      registerCellType(CELL_TYPE, AutocompleteCellType);

      expect(getRegisteredEditorNames()).toEqual(['autocomplete']);
      expect(getEditor('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredRendererNames()).toEqual(['autocomplete']);
      expect(getRenderer('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredValidatorNames()).toEqual(['autocomplete']);
      expect(getValidator('autocomplete')).toBeInstanceOf(Function);

      expect(getRegisteredCellTypeNames()).toEqual(['autocomplete']);
      expect(getCellType('autocomplete')).toEqual(AutocompleteCellType);
      expect(getCellType('autocomplete')).toEqual({
        CELL_TYPE,
        editor: getEditor('autocomplete'),
        renderer: getRenderer('autocomplete'),
        validator: getValidator('autocomplete'),
        valueGetter: AutocompleteCellType.valueGetter,
        valueSetter: AutocompleteCellType.valueSetter,
        parsePastedValue: true,
      });
    });
  });

  describe('valueSetter', () => {
    const source = [
      { key: '1', value: 'BMW' },
      { key: '2', value: 'Chrysler' },
    ];

    /**
     * Builds the `this` context the setter is called with, standing in for the grid instance.
     *
     * @param {*} storedValue What the target cell already holds in the data source.
     * @returns {object} The setter context.
     */
    function contextHolding(storedValue: unknown) {
      return {
        getSourceDataAtCell: () => storedValue,
        toPhysicalRow: (row: number) => row,
        toPhysicalColumn: (column: number) => column,
      };
    }

    const setValue = (
      storedValue: unknown,
      newValue: unknown,
      cellMeta: ChoiceMeta = { source }
    ) => AutocompleteCellType.valueSetter.call(contextHolding(storedValue), newValue, 0, 0, cellMeta);

    it('should resolve a bare label to the whole key/value entry of the source', () => {
      // The cell is empty, which is the shape a `text/plain` paste lands in (DEV-57).
      expect(setValue(null, 'BMW')).toEqual({ key: '1', value: 'BMW' });
      expect(setValue(undefined, 'Chrysler')).toEqual({ key: '2', value: 'Chrysler' });
    });

    it('should resolve a bare label rather than reusing it as the key', () => {
      // The cell already holds a key/value entry. Before DEV-57 this fabricated
      // `{ key: 'BMW', value: 'BMW' }`, which a `strict` column then rejected.
      expect(setValue({ key: '2', value: 'Chrysler' }, 'BMW')).toEqual({ key: '1', value: 'BMW' });
    });

    it('should pass a key/value object through untouched', () => {
      const picked = { key: '2', value: 'Chrysler' };

      expect(setValue(null, picked)).toBe(picked);
    });

    it('should keep wrapping a label the source does not contain, when the cell holds an entry', () => {
      expect(setValue({ key: '1', value: 'BMW' }, 'Audi')).toEqual({ key: 'Audi', value: 'Audi' });
    });

    it('should leave the value alone when the source holds plain strings', () => {
      expect(setValue(null, 'red', { source: ['yellow', 'red'] })).toBe('red');
      expect(setValue('yellow', 'red', { source: ['yellow', 'red'] })).toBe('red');
    });

    it('should leave the value alone when the source is a function', () => {
      const asyncSource = (query: string, callback: (choices: unknown[]) => void) => callback(source);

      expect(setValue(null, 'BMW', { source: asyncSource })).toBe('BMW');
    });

    it('should leave the value alone when there is no source at all', () => {
      expect(setValue(null, 'BMW', {})).toBe('BMW');
    });

    it('should not resolve an emptied cell into a source entry', () => {
      // Clearing a cell keeps the existing wrap - the validator reads `{ key: null, value: null }`
      // as empty - and it must not pick up an entry that happens to carry an empty label.
      expect(setValue({ key: '1', value: 'BMW' }, null, { source: [{ key: '0', value: '' }] }))
        .toEqual({ key: null, value: null });
      expect(setValue(null, '', { source: [{ key: '0', value: '' }] })).toBe('');
    });

    it('should compare the label as text, so a numeric entry resolves', () => {
      const years = [{ key: 'y1', value: 2017 }];

      expect(setValue(null, '2017', { source: years })).toEqual({ key: 'y1', value: 2017 });
    });

    it('should honor allowHtml when matching the label', () => {
      const markup = [{ key: '1', value: '<b>BMW</b>' }];

      expect(setValue(null, 'BMW', { source: markup })).toEqual({ key: '1', value: '<b>BMW</b>' });
      expect(setValue(null, '<b>BMW</b>', { source: markup, allowHtml: true }))
        .toEqual({ key: '1', value: '<b>BMW</b>' });
    });

    it('should work when the cell meta argument is missing', () => {
      expect(AutocompleteCellType.valueSetter.call(contextHolding(null), 'BMW', 0, 0)).toBe('BMW');
    });
  });
});
