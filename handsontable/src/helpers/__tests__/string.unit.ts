import {
  equalsIgnoreCase,
  escapeHtml,
  sanitize,
  substitute,
  stripTags,
  isJSON,
  toHyphen,
  localeLowerCase,
  decodeHtmlEntities,
  htmlToPlainText,
} from 'handsontable/helpers/string';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';

describe('String helper', () => {
  beforeEach(() => {
    // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
    // `sanitize` deprecation assertion below would depend on the order the specs run in.
    _resetDeprecationWarnings();
  });

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
    // Runs first: the warning is printed once per page, before any other call in this suite.
    it('should warn once about the deprecation', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      sanitize('<b>a</b>');
      sanitize('plain');

      const deprecationCalls = warnSpy.mock.calls
        .filter(([message]) => String(message).includes('`sanitize()`'));

      expect(deprecationCalls.length).toBe(1);
      expect(deprecationCalls[0][0]).toMatch(/^Deprecated: .*`sanitizer`/);

      warnSpy.mockRestore();
    });

    it('should return the string unchanged (pass-through — DOMPurify removed)', () => {
      expect(sanitize('')).toBe('');
      expect(sanitize('<i aria-label="bar">foo</i>')).toBe('<i aria-label="bar">foo</i>');
      expect(sanitize('<img src onerror=alert(1)>')).toBe('<img src onerror=alert(1)>');
      expect(sanitize('<script>alert()</script>')).toBe('<script>alert()</script>');
      expect(sanitize('<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>'))
        .toBe('<strong>Hello</strong> <span class="my">my <sup>world</span>2</sup>');
      expect(sanitize('<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>'))
        .toBe('<meta http-equiv="refresh" content="30">This is my <a href="https://handsontable.com">link</a>');
    });
  });

  //
  // Handsontable.helper.stripTags
  //
  describe('stripTags', () => {
    it('should strip any HTML tags from the string', () => {
      expect(stripTags('')).toBe('');
      expect(stripTags('<i>foo</i>')).toBe('foo');
      expect(stripTags('<i<test>mg src onerror=alert(1)>test')).toBe('test');
      expect(stripTags('<script>alert()</script>')).toBe('alert()');
      expect(stripTags('<strong>Hello</strong> <span class="my">my</span> world<sup>2</sup>')).toBe('Hello my world2');
      expect(stripTags('This is my <a href="https://handsontable.com">link</a>')).toBe('This is my link');
    });
  });

  describe('escapeHtml', () => {
    it('should escape the characters that carry meaning in HTML', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml('<i>foo</i>')).toBe('&lt;i&gt;foo&lt;/i&gt;');
      expect(escapeHtml('" onerror="alert(1)')).toBe('&quot; onerror=&quot;alert(1)');
      expect(escapeHtml('\' onerror=\'alert(1)')).toBe('&#39; onerror=&#39;alert(1)');
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      // the ampersand is escaped first, so an entity in the input survives as literal text
      expect(escapeHtml('&lt;')).toBe('&amp;lt;');
    });

    it('should keep text containing comparison signs whole, unlike stripTags', () => {
      expect(escapeHtml('Loaded 5 < 10 rows')).toBe('Loaded 5 &lt; 10 rows');
      expect(escapeHtml('a < b and c > d')).toBe('a &lt; b and c &gt; d');
      expect(stripTags('Loaded 5 < 10 rows')).toBe('Loaded 5 ');
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

  //
  // Handsontable.helper.toHyphen
  //
  describe('toHyphen', () => {
    it('should convert camelCase strings to hyphen-case', () => {
      expect(toHyphen('camelCase')).toBe('camel-case');
      expect(toHyphen('backgroundColor')).toBe('background-color');
      expect(toHyphen('borderTopWidth')).toBe('border-top-width');
    });

    it('should convert PascalCase strings to hyphen-case', () => {
      expect(toHyphen('PascalCase')).toBe('-pascal-case');
      expect(toHyphen('MyComponent')).toBe('-my-component');
    });

    it('should return the input unchanged for non-string values', () => {
      expect(toHyphen(123)).toBe(123);
      expect(toHyphen(null)).toBe(null);
      expect(toHyphen(undefined)).toBe(undefined);
      expect(toHyphen({})).toEqual({});
      expect(toHyphen([])).toEqual([]);
    });

    it('should handle empty strings', () => {
      expect(toHyphen('')).toBe('');
    });

    it('should handle strings that are already hyphenated', () => {
      expect(toHyphen('already-hyphenated')).toBe('already-hyphenated');
      expect(toHyphen('my-component')).toBe('my-component');
    });
  });

  //
  // Handsontable.helper.localeLowerCase
  //
  describe('localeLowerCase', () => {
    it('lowercases using the default Unicode mapping for the default and undefined locale', () => {
      expect(localeLowerCase('ABC')).toBe('abc');
      expect(localeLowerCase('ABC', 'en-US')).toBe('abc');
      expect(localeLowerCase('İ', 'en-US')).toBe('İ'.toLowerCase());
    });

    it('returns output identical to native toLocaleLowerCase for non-tailoring locales', () => {
      const samples = ['Apple', 'ÄÖÜ', 'STRASSE', 'ОЗЕРО', 'ΟΔΌΣ'];
      const locales = ['en-US', 'de-DE', 'fr-FR', 'el-GR', 'ru-RU', undefined];

      locales.forEach((locale) => {
        samples.forEach((sample) => {
          expect(localeLowerCase(sample, locale)).toBe(sample.toLocaleLowerCase(locale));
        });
      });
    });

    it('preserves Turkish and Azeri locale-aware lowercasing', () => {
      expect(localeLowerCase('I', 'tr-TR')).toBe('ı');
      expect(localeLowerCase('İ', 'tr-TR')).toBe('i');
      expect(localeLowerCase('I', 'az-AZ')).toBe('ı');
    });

    it('preserves Lithuanian locale-aware lowercasing', () => {
      expect(localeLowerCase('Ì', 'lt-LT')).toBe('Ì'.toLocaleLowerCase('lt-LT'));
    });

    it('does not throw on invalid or empty locale tags (falls back to the default mapping)', () => {
      expect(localeLowerCase('I', '')).toBe('i');
      expect(localeLowerCase('I', 'en_US')).toBe('i');
      expect(localeLowerCase('ABC', 'not a locale!!')).toBe('abc');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should decode the named references that appear in prose', () => {
      expect(decodeHtmlEntities('&lt;&gt;&amp;&quot;&apos;')).toBe('<>&"\'');
      expect(decodeHtmlEntities('a&nbsp;b')).toBe('a\xA0b');
    });

    it('should decode decimal and hexadecimal numeric references', () => {
      expect(decodeHtmlEntities('&#39;&#60;&#62;')).toBe('\'<>');
      expect(decodeHtmlEntities('&#x27;&#X3C;')).toBe('\'<');
    });

    it('should decode in a single pass so a decoded ampersand cannot start another reference', () => {
      // The HTML parser produces `&lt;` here, not `<`. Decoding twice would differ from what the
      // surfaces rendered before they stopped going through `innerHTML`.
      expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;');
    });

    it('should leave anything outside the supported set as written', () => {
      expect(decodeHtmlEntities('&hearts;&notareference;')).toBe('&hearts;&notareference;');
      expect(decodeHtmlEntities('5 & 6 &#; &#x;')).toBe('5 & 6 &#; &#x;');
    });

    it('should leave an out-of-range code point as written', () => {
      expect(decodeHtmlEntities('&#1114112;')).toBe('&#1114112;');
    });

    it('should replace NUL and lone surrogates with U+FFFD, as the parser does', () => {
      // `parseInt` succeeds on both, so the finite/range guard cannot catch them. A lone surrogate
      // passed through is invalid UTF-16 in cell data, which a later JSON or CSV write inherits.
      expect(decodeHtmlEntities('&#0;')).toBe('\uFFFD');
      expect(decodeHtmlEntities('&#xD800;')).toBe('\uFFFD');
      expect(decodeHtmlEntities('&#57343;')).toBe('\uFFFD');
      // a valid astral code point still resolves, so the guard is not over-broad
      expect(decodeHtmlEntities('&#x1F600;')).toBe('\u{1F600}');
    });

    it('should leave an upper-case named reference as written', () => {
      // HTML5 defines `&AMP;` and `&COPY;`, so the parser decoded them. This lookup is
      // case-sensitive, which is a documented limit rather than an accident.
      expect(decodeHtmlEntities('&AMP;&COPY;')).toBe('&AMP;&COPY;');
    });
  });

  describe('htmlToPlainText', () => {
    it('should strip tags and then decode what is left', () => {
      // Reproduces what these surfaces produced when the string was assigned to `innerHTML` and
      // read back as `textContent`.
      expect(htmlToPlainText('Title with <strong>HTML</strong> & special chars: &lt;&gt;&amp;'))
        .toBe('Title with HTML & special chars: <>&');
    });

    it('should not let a decoded reference reintroduce a tag', () => {
      expect(htmlToPlainText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('<script>alert(1)</script>');
    });
  });
});
