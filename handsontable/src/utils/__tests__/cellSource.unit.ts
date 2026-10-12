import { findChoiceByDisplayedValue, getChoiceLabel, hasKeyValueChoices, isListableChoice } from '../cellSource';

describe('cellSource helpers', () => {
  describe('findChoiceByDisplayedValue', () => {
    it('should return the whole key/value entry whose `value` matches the label', () => {
      const source = [
        { key: '1', value: 'BMW' },
        { key: '2', value: 'Chrysler' },
      ];

      expect(findChoiceByDisplayedValue(source, 'BMW')).toBe(source[0]);
      expect(findChoiceByDisplayedValue(source, 'Chrysler')).toBe(source[1]);
    });

    it('should return `undefined` when no entry matches', () => {
      const source = [
        { key: '1', value: 'BMW' },
      ];

      expect(findChoiceByDisplayedValue(source, 'Audi')).toBeUndefined();
    });

    it('should match a plain-string entry and return it unchanged', () => {
      const source = ['yellow', 'red'];

      expect(findChoiceByDisplayedValue(source, 'red')).toBe('red');
    });

    it('should compare as text, so a numeric entry matches its string label', () => {
      const source = [
        { key: 'a', value: 2017 },
      ];

      expect(findChoiceByDisplayedValue(source, '2017')).toBe(source[0]);
      expect(findChoiceByDisplayedValue(2017 as unknown as unknown[], '2017')).toBeUndefined();
    });

    it('should strip tags from the entry unless the cell allows HTML', () => {
      const source = [
        { key: '1', value: '<b>BMW</b>' },
      ];

      // Tags stripped: the displayed text is `BMW`.
      expect(findChoiceByDisplayedValue(source, 'BMW')).toBe(source[0]);
      expect(findChoiceByDisplayedValue(source, '<b>BMW</b>')).toBeUndefined();

      // HTML allowed: the raw markup is the displayed text.
      expect(findChoiceByDisplayedValue(source, '<b>BMW</b>', true)).toBe(source[0]);
      expect(findChoiceByDisplayedValue(source, 'BMW', true)).toBeUndefined();
    });

    it('should read a blank entry as blank, whichever way tags are handled', () => {
      // `String(null)` is `'null'`, so stripping before stringifying gave a `null` entry the
      // displayed text `'null'` - it matched a paste of that literal word and never matched the
      // empty text the cell shows for it. The `allowHtml` branch already stringified, so the two
      // disagreed with each other as well.
      const blanks = [{ key: '0', value: null }];

      expect(findChoiceByDisplayedValue(blanks, '')).toBe(blanks[0]);
      expect(findChoiceByDisplayedValue(blanks, '', true)).toBe(blanks[0]);
      expect(findChoiceByDisplayedValue(blanks, 'null')).toBeUndefined();

      // A bare blank in the list reads the same way. `{ key, value: undefined }` is not an entry at
      // all - `isKeyValueObject()` wants both halves defined - so only the bare form reaches this.
      const bare = [null, undefined];

      expect(findChoiceByDisplayedValue(bare, '')).toBe(null);
      expect(findChoiceByDisplayedValue(bare, 'null')).toBeUndefined();
      expect(findChoiceByDisplayedValue(bare, 'undefined')).toBeUndefined();
    });

    it('should return `undefined` for anything that is not an array of choices', () => {
      expect(findChoiceByDisplayedValue(undefined, 'BMW')).toBeUndefined();
      expect(findChoiceByDisplayedValue(null, 'BMW')).toBeUndefined();
      // A function source cannot be resolved without calling it, so it never matches here.
      expect(findChoiceByDisplayedValue(() => [], 'BMW')).toBeUndefined();
    });

    it('should return the first match when two entries share a label', () => {
      const source = [
        { key: '1', value: 'BMW' },
        { key: '9', value: 'BMW' },
      ];

      expect(findChoiceByDisplayedValue(source, 'BMW')).toBe(source[0]);
    });
  });

  describe('hasKeyValueChoices', () => {
    it('should report key/value entries wherever they sit in the array', () => {
      expect(hasKeyValueChoices([{ key: '1', value: 'BMW' }])).toBe(true);
      expect(hasKeyValueChoices(['yellow', { key: '1', value: 'BMW' }])).toBe(true);
    });

    it('should report no key/value entries for a plain-string source', () => {
      expect(hasKeyValueChoices(['yellow', 'red'])).toBe(false);
    });

    it('should report no key/value entries for an entry missing its key', () => {
      expect(hasKeyValueChoices([{ value: 'BMW' }])).toBe(false);
    });

    it('should report no key/value entries for anything that is not an array', () => {
      expect(hasKeyValueChoices(undefined)).toBe(false);
      expect(hasKeyValueChoices(null)).toBe(false);
      expect(hasKeyValueChoices(() => [])).toBe(false);
      expect(hasKeyValueChoices([])).toBe(false);
    });
  });

  describe('getChoiceLabel', () => {
    const poland = { name: 'Poland', currency: 'PLN', meta: { flag: 'PL' } };

    it('should read a property of an object `value` when `sourceLabel` is a string', () => {
      expect(getChoiceLabel(poland, 'name')).toBe('Poland');
    });

    it('should read a nested property when `sourceLabel` is a dot path', () => {
      expect(getChoiceLabel(poland, 'meta.flag')).toBe('PL');
    });

    it('should call `sourceLabel` with the object `value` when it is a function', () => {
      expect(getChoiceLabel(poland, value => `${value.name} (${value.currency})`)).toBe('Poland (PLN)');
    });

    it('should hand back a primitive `value` unchanged, whatever `sourceLabel` says', () => {
      // `sourceLabel` describes how to label an OBJECT. A source mixing string labels with object
      // ones keeps its string labels as they are, so the option never rewrites a working label.
      expect(getChoiceLabel('BMW', 'name')).toBe('BMW');
      expect(getChoiceLabel(2017, value => `x${value}`)).toBe(2017);
      expect(getChoiceLabel(null, 'name')).toBe(null);
    });

    it('should hand back an object `value` unchanged when `sourceLabel` is not set', () => {
      // The pre-option behavior: no label rule, so the value goes through as it is.
      expect(getChoiceLabel(poland, undefined)).toBe(poland);
      expect(getChoiceLabel(poland, '')).toBe(poland);
    });

    it('should hand back an object `value` unchanged when `sourceLabel` is neither a string nor a function', () => {
      // Settings are not type-checked at runtime, and this runs on every render of the cell.
      const value = { address: { city: 'Paris' } };

      // @ts-expect-error A plain JS user can pass any value.
      expect(getChoiceLabel(value, true)).toBe(value);
      // @ts-expect-error A plain JS user can pass any value.
      expect(getChoiceLabel(value, ['address', 'city'])).toBe(value);
      // @ts-expect-error A plain JS user can pass any value.
      expect(getChoiceLabel(value, 42)).toBe(value);
    });

    it('should resolve a missing path to `undefined`', () => {
      expect(getChoiceLabel(poland, 'missing.deeper')).toBeUndefined();
    });

    it('should resolve a path through a `null` segment to `undefined` instead of throwing', () => {
      // It runs on every render of the cell, so a gap in the data must not break the grid.
      expect(getChoiceLabel({ address: null }, 'address.city')).toBeUndefined();
    });

    // Dot notation reads array items by index too. Stopping at an array labeled every entry as
    // nothing, so the list hid every option and every cell rendered blank.
    it('should walk into an array by index', () => {
      const person = { aliases: ['Ada', 'Countess'], addresses: [{ city: 'London' }] };

      expect(getChoiceLabel(person, 'aliases.0')).toBe('Ada');
      expect(getChoiceLabel(person, 'addresses.0.city')).toBe('London');
      expect(getChoiceLabel(person, 'aliases.5')).toBeUndefined();
    });
  });

  describe('isListableChoice', () => {
    it('should list every choice when `sourceLabel` is not set', () => {
      expect(isListableChoice({ key: 'X', value: { name: '' } })).toBe(true);
      expect(isListableChoice('plain')).toBe(true);
    });

    it('should leave out a key/value entry whose object `value` labels as nothing', () => {
      expect(isListableChoice({ key: 'X', value: { location: null } }, 'location.city')).toBe(false);
      expect(isListableChoice({ key: 'X', value: { name: 'Paris' } }, () => null)).toBe(false);
    });

    it('should keep an entry whose `value` is not an object, and a plain choice', () => {
      expect(isListableChoice({ key: 'X', value: null }, 'name')).toBe(true);
      expect(isListableChoice({ key: 'X', value: 'Poland' }, 'name')).toBe(true);
      expect(isListableChoice('Other', 'name')).toBe(true);
    });

    it('should keep an entry whose object `value` has a label', () => {
      expect(isListableChoice({ key: 'X', value: { name: 'Paris' } }, 'name')).toBe(true);
    });
  });

  describe('findChoiceByDisplayedValue with object values', () => {
    const source = [
      { key: 'US', value: { name: 'United States', currency: 'USD' } },
      { key: 'PL', value: { name: 'Poland', currency: 'PLN' } },
    ];

    it('should match the label `sourceLabel` derives and return the whole source entry', () => {
      expect(findChoiceByDisplayedValue(source, 'Poland', false, 'name')).toBe(source[1]);
      expect(findChoiceByDisplayedValue(source, 'Poland (PLN)', false, value => `${value.name} (${value.currency})`))
        .toBe(source[1]);
    });

    it('should leave matching as it was when `sourceLabel` is not set', () => {
      // No label rule, no new behavior: an object `value` is not matched by any of its fields.
      expect(findChoiceByDisplayedValue(source, 'Poland')).toBeUndefined();
    });
  });
});
