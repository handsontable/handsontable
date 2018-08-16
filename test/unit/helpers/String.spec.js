import {
  equalsIgnoreCase,
  substitute,
  stripTags,
} from 'handsontable/helpers/string';

describe('String helper', () => {
  //
  // Handsontable.helper.equalsIgnoreCase
  //
  describe('equalsIgnoreCase', () => {
    it('should correct equals strings', () => {
      expect(equalsIgnoreCase()).toEqual(false);
      expect(equalsIgnoreCase('', '')).toEqual(true);
      expect(equalsIgnoreCase('True', 'TRUE', 'TrUe', true)).toEqual(true);
      expect(equalsIgnoreCase('FALSE', 'false')).toEqual(true);

      expect(equalsIgnoreCase('True', 'TRUE', false)).toEqual(false);
      expect(equalsIgnoreCase('fals e', false)).toEqual(false);
    });
  });

  //
  // Handsontable.helper.substitute
  //
  describe('substitute', () => {
    it('should properly substitute string to specified values', () => {
      const vars = {
        zero: 0,
        empty: '',
        undef: void 0,
        string1: 'foo;',
        string2: 'foo\nbar',
      };

      expect(substitute('', vars)).toBe('');
      expect(substitute('[zero]', vars)).toBe('0');
      expect(substitute('[zero][zero]', vars)).toBe('00');
      expect(substitute('[empty][zero][string1]', vars)).toBe('0foo;');
      expect(substitute('BAZ [string2] test', vars)).toBe('BAZ foo\nbar test');
      expect(substitute('1[undef]', vars)).toBe('1');
    });
  });

  //
  // Handsontable.helper.stripTags
  //
  describe('stripTags', () => {
    it('should strip any HTML tags from the string', () => {
      expect(stripTags('')).toBe('');
      expect(stripTags('<i>foo</i>')).toBe('foo');
      expect(stripTags('<script>alert()</script>')).toBe('alert()');
      expect(stripTags('<strong>Hello</strong> <span class="my">my</span> world<sup>2</sup>')).toBe('Hello my world2');
      expect(stripTags('This is my <a href="https://handsontable.com">link</a>')).toBe('This is my link');
    });
  });
});
