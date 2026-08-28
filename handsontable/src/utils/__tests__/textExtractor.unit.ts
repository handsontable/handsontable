import { extractText, getTextExtractor } from '../textExtractor';

/**
 * Builds the smallest object the helpers read: the settings and the document the
 * built-in extraction parses markup in.
 *
 * @param {object} settings The grid settings to expose through `getSettings()`.
 * @returns {object} A stand-in for a Handsontable instance.
 */
function createHot(settings = {}) {
  return {
    rootDocument: document,
    getSettings: () => settings,
  };
}

describe('textExtractor', () => {
  describe('.getTextExtractor', () => {
    it('should return `false` when no extractor is configured', () => {
      expect(getTextExtractor(createHot())).toBe(false);
    });

    it('should return `false` when the extractor is explicitly `undefined`', () => {
      expect(getTextExtractor(createHot({ textExtractor: undefined }))).toBe(false);
    });

    it('should return `true` when the built-in extraction is selected', () => {
      expect(getTextExtractor(createHot({ textExtractor: true }))).toBe(true);
    });

    it('should return the configured extractor function', () => {
      const textExtractor = () => '';

      expect(getTextExtractor(createHot({ textExtractor }))).toBe(textExtractor);
    });
  });

  describe('.extractText without an extractor', () => {
    it('should return the content untouched, so existing exports do not change', () => {
      const hot = createHot();

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('<b>Total</b>');
    });
  });

  describe('.extractText with the built-in extraction', () => {
    const hot = createHot({ textExtractor: true });

    it('should reduce markup to the text the grid displays', () => {
      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('Total');
    });

    it('should reduce nested markup carrying attributes', () => {
      expect(extractText(hot, '<span style="color:red">Red</span>', 'ExportFile.columnHeader')).toBe('Red');
    });

    it('should decode entities to the characters they stand for', () => {
      // A file needs the character, not its markup spelling. This is what a regular expression
      // over the raw string cannot do.
      expect(extractText(hot, 'Tom &amp; Jerry', 'ExportFile.columnHeader')).toBe('Tom & Jerry');
    });

    it('should keep a bare comparison sign that is not markup', () => {
      // `stripTags()` drops everything from the `<` onwards here, which is why it is not used.
      expect(extractText(hot, 'Loaded 5 < 10 rows', 'ExportFile.columnHeader')).toBe('Loaded 5 < 10 rows');
    });

    it('should leave plain text alone', () => {
      expect(extractText(hot, 'Total', 'ExportFile.columnHeader')).toBe('Total');
    });

    it('should return an empty string for empty content', () => {
      expect(extractText(hot, '', 'ExportFile.columnHeader')).toBe('');
    });

    // A string containing neither `<` nor `&` skips the parse. These pin that the shortcut returns
    // what parsing returns, for the characters that make it tempting to widen or narrow the guard.
    it('should keep a lone ampersand', () => {
      expect(extractText(hot, 'Tom & Jerry', 'ExportFile.columnHeader')).toBe('Tom & Jerry');
    });

    it('should keep a lone greater-than sign', () => {
      expect(extractText(hot, 'Profit > 100', 'ExportFile.columnHeader')).toBe('Profit > 100');
    });

    it('should decode a legacy entity written without its semicolon', () => {
      // The parser decodes the legacy named references without a closing `;`, so the grid displays
      // `A & B`. The fast path must not skip this one, or the file would disagree with the screen.
      expect(extractText(hot, 'A &amp B', 'ExportFile.columnHeader')).toBe('A & B');
    });

    it('should decode a legacy entity that opens a tag', () => {
      expect(extractText(hot, '&ltx', 'ExportFile.columnHeader')).toBe('<x');
    });

    it('should drop script source, which the grid never paints', () => {
      // `textContent` reports the source text of a `script` element, so without removing it the
      // file would receive `alert(1)Total` for a header the grid displays as `Total`.
      expect(extractText(hot, '<script>alert(1)</script>Total', 'ExportFile.columnHeader')).toBe('Total');
    });

    it('should drop style source, which the grid never paints', () => {
      expect(extractText(hot, '<style>.a{color:red}</style>Total', 'ExportFile.columnHeader')).toBe('Total');
    });

    it('should keep the text of an element the grid does paint', () => {
      expect(extractText(hot, '<span>Kept</span>', 'ExportFile.columnHeader')).toBe('Kept');
    });
  });

  describe('.extractText with a falsy option value', () => {
    // Only `true` and a function switch the extraction on. A falsy value that is not `false` -
    // `0` from a `Number(flag)`, `''` from a form field - must read as off, not as on.
    it.each([
      ['`false`', false],
      ['`0`', 0],
      ['an empty string', ''],
      ['`NaN`', NaN],
    ])('should leave content untouched for %s', (_label, value) => {
      const hot = createHot({ textExtractor: value });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('<b>Total</b>');
    });
  });

  describe('.extractText with non-string values', () => {
    const hot = createHot({ textExtractor: true });

    it('should return a number untouched, so a spreadsheet still reads it as a number', () => {
      expect(extractText(hot, 42, 'ExportFile.columnHeader')).toBe(42);
    });

    it('should return `null` untouched', () => {
      expect(extractText(hot, null, 'ExportFile.rowHeader')).toBe(null);
    });

    it('should return `undefined` untouched', () => {
      expect(extractText(hot, undefined, 'ExportFile.rowHeader')).toBe(undefined);
    });

    it('should return a Date untouched', () => {
      const date = new Date(2026, 0, 1);

      expect(extractText(hot, date, 'ExportFile.columnHeader')).toBe(date);
    });

    it('should not call a configured extractor function for a non-string', () => {
      const textExtractor = jasmine.createSpy('textExtractor').and.returnValue('called');

      expect(extractText(createHot({ textExtractor }), 42, 'ExportFile.columnHeader')).toBe(42);
      expect(textExtractor).not.toHaveBeenCalled();
    });
  });

  describe('.extractText with a configured extractor function', () => {
    it('should return what the function returns', () => {
      const hot = createHot({ textExtractor: () => 'replaced' });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('replaced');
    });

    it('should pass the content and the consumer surface', () => {
      const textExtractor = jasmine.createSpy('textExtractor').and.returnValue('');

      extractText(createHot({ textExtractor }), '<b>R1</b>', 'ExportFile.rowHeader');

      expect(textExtractor).toHaveBeenCalledWith('<b>R1</b>', 'ExportFile.rowHeader');
    });

    it('should pass a surface a plugin invented, so consumers can be added without a core change', () => {
      const textExtractor = jasmine.createSpy('textExtractor').and.returnValue('');

      extractText(createHot({ textExtractor }), 'x', 'ThirdParty.somewhere');

      expect(textExtractor).toHaveBeenCalledWith('x', 'ThirdParty.somewhere');
    });

    it('should return an empty string when the function returns nothing', () => {
      // Returning the raw input instead would undo the extraction; writing `undefined` would put
      // the literal word into the file.
      const hot = createHot({ textExtractor: () => undefined });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('');
    });

    it('should not run the sanitizer, because the function has full control', () => {
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('sanitized');
      const hot = createHot({ sanitizer, textExtractor: content => content });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('<b>Total</b>');
      expect(sanitizer).not.toHaveBeenCalled();
    });
  });

  describe('.extractText running the sanitizer before the built-in extraction', () => {
    it('should extract from the sanitized content, not the raw content', () => {
      // An allowlist sanitizer removes a script element whole, so the grid displays nothing.
      // Extracting from the raw string would put `alert()` into a file the screen never showed.
      const hot = createHot({
        sanitizer: () => '',
        textExtractor: true,
      });

      expect(extractText(hot, '<script>alert()</script>', 'ExportFile.columnHeader')).toBe('');
    });

    it('should pass the `header` surface to the sanitizer by default', () => {
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');
      const hot = createHot({ sanitizer, textExtractor: true });

      extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader');

      expect(sanitizer).toHaveBeenCalledWith('<b>Total</b>', 'header');
    });

    it('should pass a caller-supplied surface to the sanitizer', () => {
      const sanitizer = jasmine.createSpy('sanitizer').and.returnValue('clean');
      const hot = createHot({ sanitizer, textExtractor: true });

      extractText(hot, 'x', 'Print.cell', 'password');

      expect(sanitizer).toHaveBeenCalledWith('x', 'password');
    });

    it('should reduce the sanitizer output to text, so escaping sanitizers do not leak entities', () => {
      // An escaping sanitizer neutralizes markup instead of removing it. Its output is HTML source,
      // so without the parse step a file would receive `&lt;b&gt;Total&lt;/b&gt;`.
      const hot = createHot({
        sanitizer: content => content.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
        textExtractor: true,
      });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('<b>Total</b>');
    });

    it('should treat a sanitizer returning nothing as empty content', () => {
      const hot = createHot({ sanitizer: () => undefined, textExtractor: true });

      expect(extractText(hot, '<b>Total</b>', 'ExportFile.columnHeader')).toBe('');
    });
  });
});
