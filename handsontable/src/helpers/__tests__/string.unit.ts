import {
  equalsIgnoreCase,
  sanitize,
  substitute,
  stripTags,
  isJSON,
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
        undef: undefined,
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
  // Handsontable.helper.sanitize
  //
  describe('sanitize', () => {
    it('should sanitize HTML from insecure values', () => {
      expect(sanitize('')).toBe('');
      expect(sanitize('<i aria-label="bar">foo</i>')).toBe('<i aria-label="bar">foo</i>');
      expect(sanitize('<img src onerror=alert(1)>')).toBe('<img src="">');
      expect(sanitize('<script>alert()</script>')).toBe('');
      expect(sanitize('<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>'))
        .toBe('<strong>Hello</strong> <span class="my">my <sup>world</sup></span>2');
      expect(sanitize('<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>'))
        .toBe('This is my <a href="https://handsontable.com">link</a>');
    });

    it('should be possible to pass custom options configuration to sanitizer', () => {
      expect(sanitize(
        '<meta name="Generator" content="Handsontable"><table><tr><td>A1</td></tr></table>',
        {
          ADD_TAGS: ['meta'],
          FORCE_BODY: true,
        }))
        .toBe('<meta name="Generator"><table><tbody><tr><td>A1</td></tr></tbody></table>');
      expect(sanitize(
        '<meta name="Generator" content="Handsontable"><table><tr><td>A1</td></tr></table>',
        {
          ADD_TAGS: ['meta'],
          ADD_ATTR: ['content'],
          FORCE_BODY: false,
        }))
        .toBe('<table><tbody><tr><td>A1</td></tr></tbody></table>');
    });
  });

  //
  // Handsontable.helper.stripTags
  //
  describe('stripTags', () => {
    it('should strip any HTML tags from the string', () => {
      expect(stripTags('')).toBe('');
      expect(stripTags('<i>foo</i>')).toBe('foo');
      expect(stripTags('<i<test>mg src onerror=alert(1)>test')).toBe('mg src onerror=alert(1)&gt;test');
      expect(stripTags('<script>alert()</script>')).toBe('');
      expect(stripTags('<strong>Hello</strong> <span class="my">my</span> world<sup>2</sup>')).toBe('Hello my world2');
      expect(stripTags('This is my <a href="https://handsontable.com">link</a>')).toBe('This is my link');
    });
  });

  //
  // Handsontable.helper.isJSON
  //
  describe('isJSON', () => {
    it('should return true for valid JSON object strings', () => {
      expect(isJSON('{"foo": "bar"}')).toBe(true);
      expect(isJSON('{"foo": 1, "bar": {"baz": true}}')).toBe(true);
      expect(isJSON('{"foo": null}')).toBe(true);
      expect(isJSON('{"foo": [1,2,3]}')).toBe(true);
    });

    it('should return true for valid JSON array strings', () => {
      expect(isJSON('[1,2,3]')).toBe(true);
      expect(isJSON('["foo", "bar"]')).toBe(true);
      expect(isJSON('[{"foo": "bar"}, {"baz": true}]')).toBe(true);
      expect(isJSON('[]')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isJSON('{foo:"bar"}')).toBe(false);
      expect(isJSON('foo: bar')).toBe(false);
      expect(isJSON('[1,2,')).toBe(false);
      expect(isJSON('{"foo": undefined}')).toBe(false);
    });

    it('should return false for non-object/array JSON values', () => {
      expect(isJSON('"foo"')).toBe(false);
      expect(isJSON('123')).toBe(false);
      expect(isJSON('true')).toBe(false);
      expect(isJSON('null')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isJSON(null)).toBe(false);
      expect(isJSON(undefined)).toBe(false);
      expect(isJSON(123)).toBe(false);
      expect(isJSON({})).toBe(false);
      expect(isJSON([])).toBe(false);
    });
  });

});
