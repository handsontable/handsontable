import { findChoiceByDisplayedValue } from '../cellSource';

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
});
