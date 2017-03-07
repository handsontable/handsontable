import {
  equalsIgnoreCase,
  startsWith,
  endsWith,
  substitute,
  padStart,
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
  // Handsontable.helper.startsWith
  //
  describe('startsWith', () => {
    it('should properly recognize whether a string begins with the characters', () => {
      expect(startsWith('', '')).toBe(true);
      expect(startsWith('Base string', '')).toBe(true);
      expect(startsWith('Base string', 'B')).toBe(true);
      expect(startsWith('Base string', 'Base')).toBe(true);
      expect(startsWith('Base string', 'Base string')).toBe(true);

      expect(startsWith('Base string', 'b')).toBe(false);
      expect(startsWith('Base string', 'ase')).toBe(false);
      expect(startsWith('Base string', 'g')).toBe(false);
      expect(startsWith('Base string', '1')).toBe(false);
    });
  });

  //
  // Handsontable.helper.endsWith
  //
  describe('endsWith', () => {
    it('should properly recognize whether a string ends with the characters', () => {
      expect(endsWith('', '')).toBe(true);
      expect(endsWith('Base string', '')).toBe(true);
      expect(endsWith('Base string', 'g')).toBe(true);
      expect(endsWith('Base string', 'ing')).toBe(true);
      expect(endsWith('Base string', 'Base string')).toBe(true);

      expect(endsWith('Base string', 'G')).toBe(false);
      expect(endsWith('Base string', 'strin')).toBe(false);
      expect(endsWith('Base string', 'B')).toBe(false);
      expect(endsWith('Base string', '1')).toBe(false);
    });
  });

  //
  // Handsontable.helper.substitute
  //
  describe('substitute', () => {
    it('should properly substitute string to specified values', () => {
      var vars = {
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
  // Handsontable.helper.padStart
  //
  describe('padStart', () => {
    it('should properly add leading chars at the begining of the string', () => {
      expect(padStart('x', 5, 'ab')).toBe('ababx');
      expect(padStart('x', 4, 'abcde')).toBe('abcx');
      expect(padStart('abcd', 2, 'z')).toBe('abcd');
      expect(padStart('12345', 10, 'abcdefg')).toBe('abcde12345');
      expect(padStart('a', 3)).toBe('  a');
      expect(padStart(2, 3, '00')).toBe('002');
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
