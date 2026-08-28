import { getValueSetterValue, getValueGetterValue } from '../valueAccessors';

describe('getValueSetterValue', () => {
  it('returns the value untouched when no accessor and no `emptyValue` are configured', () => {
    expect(getValueSetterValue('abc', {})).toBe('abc');
    expect(getValueSetterValue(7, {})).toBe(7);
    expect(getValueSetterValue(null, {})).toBe(null);
  });

  it('runs a configured `valueSetter` and returns its result', () => {
    const cellMeta = {
      instance: 'HOT',
      visualRow: 2,
      visualCol: 3,
      valueSetter: (value, row, column) => `${value}@${row},${column}`,
    };

    expect(getValueSetterValue('abc', cellMeta)).toBe('abc@2,3');
  });

  it('calls `valueSetter` with the instance as `this` and the cell coordinates', () => {
    const instance = { name: 'hot' };
    const valueSetter = jest.fn(function() {
      return this;
    });

    const result = getValueSetterValue('abc', { instance, visualRow: 1, visualCol: 4, valueSetter });

    expect(result).toBe(instance);
    expect(valueSetter).toHaveBeenCalledWith('abc', 1, 4, expect.objectContaining({ instance }));
  });

  describe('`emptyValue`', () => {
    it('keeps an empty string as-is under the default setting', () => {
      // The default must not move - a grid that has always stored `''` keeps storing `''`.
      expect(getValueSetterValue('', { emptyValue: '' })).toBe('');
      expect(getValueSetterValue('', {})).toBe('');
    });

    it('treats an explicit `undefined` as unset rather than storing `undefined`', () => {
      // Otherwise a cascade that resolves to `undefined` - a column clearing a grid-level setting -
      // would blank the cell instead of falling back to the default.
      expect(getValueSetterValue('', { emptyValue: undefined })).toBe('');
    });

    it('stores `null` instead of an empty string when set to `null`', () => {
      expect(getValueSetterValue('', { emptyValue: null })).toBe(null);
    });

    it('leaves every non-empty value alone when set to `null`', () => {
      expect(getValueSetterValue('abc', { emptyValue: null })).toBe('abc');
      expect(getValueSetterValue(7, { emptyValue: null })).toBe(7);
      expect(getValueSetterValue(null, { emptyValue: null })).toBe(null);
      expect(getValueSetterValue(undefined, { emptyValue: null })).toBe(undefined);
    });

    it('does not treat other falsy values as empty', () => {
      // The check is strictly `=== ''`. A zero or a `false` is a real value a user entered, and
      // mapping either to `null` would silently destroy data in numeric and checkbox columns.
      expect(getValueSetterValue(0, { emptyValue: null })).toBe(0);
      expect(getValueSetterValue(false, { emptyValue: null })).toBe(false);
      expect(getValueSetterValue(NaN, { emptyValue: null })).toBe(NaN);
    });

    it('does not treat a whitespace-only string as empty', () => {
      expect(getValueSetterValue(' ', { emptyValue: null })).toBe(' ');
    });

    it('maps an empty string produced by a `valueSetter`, so the setter still means "empty"', () => {
      const cellMeta = {
        emptyValue: null,
        valueSetter: () => '',
      };

      expect(getValueSetterValue('anything', cellMeta)).toBe(null);
    });

    it('does not map a non-empty string produced by a `valueSetter`', () => {
      const cellMeta = {
        emptyValue: null,
        valueSetter: () => 'replaced',
      };

      expect(getValueSetterValue('', cellMeta)).toBe('replaced');
    });

    it('leaves `\'\'` alone when it is a checkbox template, which gives it a meaning', () => {
      // A checkbox with `uncheckedTemplate: ''` stores `''` to mean "unchecked". Mapping that to
      // `null` would leave the cell matching neither template, so it renders `#bad-value#` and can
      // no longer be toggled.
      expect(getValueSetterValue('', { emptyValue: null, type: 'checkbox', uncheckedTemplate: '' })).toBe('');
      expect(getValueSetterValue('', { emptyValue: null, type: 'checkbox', checkedTemplate: '' })).toBe('');
    });

    it('reads the checkbox templates off the cell type, not off whatever meta carries them', () => {
      // The templates cascade, so an `uncheckedTemplate` set once at grid level lands on every cell.
      // Gating on the key alone would switch `emptyValue` off for every column in the grid.
      expect(getValueSetterValue('', { emptyValue: null, uncheckedTemplate: '' })).toBe(null);
      expect(getValueSetterValue('', { emptyValue: null, type: 'text', uncheckedTemplate: '' })).toBe(null);
    });

    it('still maps `\'\'` when the checkbox templates are ordinary values', () => {
      expect(
        getValueSetterValue('', { emptyValue: null, type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' })
      ).toBe(null);
    });

    it('leaves `\'\'` alone when a choice list offers it as a blank option', () => {
      // Picking the blank entry is an explicit choice. Mapping it to `null` would then fail the
      // autocomplete validator under `strict: true`, because `null` is not in `source`.
      expect(getValueSetterValue('', { emptyValue: null, type: 'dropdown', source: ['', 'a', 'b'] })).toBe('');
      expect(getValueSetterValue('', { emptyValue: null, type: 'autocomplete', source: ['', 'a'] })).toBe('');
    });

    it('still maps `\'\'` when a choice list does not offer it', () => {
      expect(getValueSetterValue('', { emptyValue: null, type: 'dropdown', source: ['a', 'b'] })).toBe(null);
    });

    it('leaves undo and redo alone, so a stored `\'\'` can be restored', () => {
      // `loadData` never passes through this function, so an `''` can predate the setting. Remapping
      // it on undo would make the value the user undid to unreachable.
      expect(getValueSetterValue('', { emptyValue: null }, 'UndoRedo.undo')).toBe('');
      expect(getValueSetterValue('', { emptyValue: null }, 'UndoRedo.redo')).toBe('');
      expect(getValueSetterValue('', { emptyValue: null }, 'edit')).toBe(null);
    });

    it('stores whatever `emptyValue` is set to, not only `null`', () => {
      // The option reads as "the value to store", so an unsupported setting silently behaving as the
      // default would be a trap.
      expect(getValueSetterValue('', { emptyValue: 'N/A' })).toBe('N/A');
      expect(getValueSetterValue('', { emptyValue: 0 })).toBe(0);
    });
  });
});

describe('getValueGetterValue', () => {
  it('returns the value untouched when no accessor is configured', () => {
    expect(getValueGetterValue('abc', {})).toBe('abc');
  });

  it('runs a configured `valueGetter` and returns its result', () => {
    const cellMeta = {
      visualRow: 0,
      visualCol: 1,
      valueGetter: (value, row, column) => `${value}!${row},${column}`,
    };

    expect(getValueGetterValue('abc', cellMeta)).toBe('abc!0,1');
  });

  it('is not affected by `emptyValue`, which describes writes only', () => {
    expect(getValueGetterValue('', { emptyValue: null })).toBe('');
  });
});
