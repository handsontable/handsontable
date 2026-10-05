/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokenizeXml, decodeXmlEntities } from '../adapters/native/xml/tokenizer';
import {
  escapeXmlText, escapeXmlAttr, escapeXmlMarkup, decodeOoxmlEscapes, needsSpacePreserve,
} from '../adapters/native/xml/escapes';
import { XmlWriter } from '../adapters/native/xml/writer';
import { parseFiniteDoubleAttr, parseUnsignedIntAttr } from '../adapters/native/xml/numbers';

/**
 * Records every event the tokenizer emits as a compact tuple.
 * @param xml
 */
function events(xml) {
  const out = [];

  tokenizeXml(xml, {
    open: (name, attrs, selfClosing) => out.push(['open', name, attrs, selfClosing]),
    close: name => out.push(['close', name]),
    text: text => out.push(['text', text]),
  });

  return out;
}

describe('tokenizeXml', () => {
  it('should emit open, text and close events with decoded attributes and text', () => {
    const xml = '<?xml version="1.0"?>\n<!-- c --><a x="1" y=\'&amp;q\'><b/>t &lt; 2</a>';

    expect(events(xml)).toEqual([
      ['text', '\n'],
      ['open', 'a', { x: '1', y: '&q' }, false],
      ['open', 'b', {}, true],
      ['text', 't < 2'],
      ['close', 'a'],
    ]);
  });

  it('should keep namespace prefixes on names and attributes', () => {
    expect(events('<x:ClientData r:id="rId1"/>')).toEqual([['open', 'x:ClientData', { 'r:id': 'rId1' }, true]]);
  });

  it('should pass CDATA through verbatim and skip a DOCTYPE without resolving anything', () => {
    expect(events('<!DOCTYPE t [<!ENTITY e "x">]><t><![CDATA[a<b&]]></t>')).toEqual([
      ['open', 't', {}, false],
      ['text', 'a<b&'],
      ['close', 't'],
    ]);
  });

  it('should throw a Handsontable error on a truncated tag', () => {
    expect(() => events('<a b="1')).toThrow(/malformed/);
    expect(() => events('<a')).toThrow(/malformed/);
  });

  it('should refuse a malformed attribute instead of swallowing the next element', () => {
    // A bare attribute name is the dangerous case: a scan that hunts forward for `=` walks through
    // this tag's own `>` and misappropriates the NEXT element's attribute value, dropping that
    // element from the event stream with no error at all.
    expect(() => events('<a b><c d="1"/>')).toThrow(/malformed/);
    expect(() => events('<a b>')).toThrow(/malformed/);
    expect(() => events('<a b=>')).toThrow(/malformed/);
    expect(() => events('<a =x="1">')).toThrow(/malformed/);
    // Spacing around the `=` stays legal.
    expect(events('<a b = "1"/>')).toEqual([['open', 'a', { b: '1' }, true]]);
  });

  it('should not let a stray bracket in a DOCTYPE swallow the content after it', () => {
    expect(events('<!DOCTYPE t]><middle attr="["/><root/>')).toEqual([
      ['open', 'middle', { attr: '[' }, true],
      ['open', 'root', {}, true],
    ]);
  });
});

describe('decodeXmlEntities', () => {
  it('should decode the five named entities and numeric references, leaving unknown ones alone', () => {
    expect(decodeXmlEntities('&lt;&gt;&amp;&quot;&apos;&#65;&#x42;&nbsp;')).toBe('<>&"\'AB&nbsp;');
  });

  it('should leave a numeric reference outside Unicode as written rather than throwing', () => {
    // `String.fromCodePoint` answers an out-of-range value with a raw RangeError, which would
    // escape the reader's `throwWithCause` contract on an untrusted file.
    expect(decodeXmlEntities('a&#xFFFFFFFF;b')).toBe('a&#xFFFFFFFF;b');
    expect(decodeXmlEntities('&#1114112;')).toBe('&#1114112;');
    expect(decodeXmlEntities('&#x10FFFF;')).toBe(String.fromCodePoint(0x10FFFF));
  });

  it('should leave a reference to a lone surrogate as written, like any other invalid code point', () => {
    // `String.fromCodePoint` accepts D800-DFFF and hands back an unpaired code unit, which then
    // travels through the whole import and is replaced by U+FFFD when `TextEncoder` writes it out.
    expect(decodeXmlEntities('a&#xD800;b')).toBe('a&#xD800;b');
    expect(decodeXmlEntities('&#xDFFF;')).toBe('&#xDFFF;');
    expect(decodeXmlEntities('&#56320;')).toBe('&#56320;');
    // The code points on either side of the range still decode.
    expect(decodeXmlEntities('&#xD7FF;&#xE000;')).toBe('\uD7FF\uE000');
  });

  it('should leave a reference named after an Object.prototype member as written', () => {
    // A plain-object entity table resolved `&constructor;` through the prototype chain and put the
    // source text of `Object` into the cell.
    expect(decodeXmlEntities('&constructor;|&toString;|&valueOf;|&hasOwnProperty;|&isPrototypeOf;'))
      .toBe('&constructor;|&toString;|&valueOf;|&hasOwnProperty;|&isPrototypeOf;');
    expect(decodeXmlEntities('&amp;constructor;')).toBe('&constructor;');
  });
});

describe('XmlWriter', () => {
  it('should write nested elements, skip undefined attributes and render booleans as 1/0', () => {
    const xml = new XmlWriter(false)
      .open('root', { a: 'x', skip: undefined, on: true, off: false, n: 3 })
      .leaf('leaf', { v: 'q"' }, 'a<b')
      .leaf('empty')
      .close()
      .toString();

    expect(xml).toBe('<root a="x" on="1" off="0" n="3"><leaf v="q&quot;">a&lt;b</leaf><empty/></root>');
  });

  it('should start with the standalone declaration by default', () => {
    expect(new XmlWriter().open('a').close().toString())
      .toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<a/>');
  });

  it('should refuse to close with nothing open', () => {
    expect(() => new XmlWriter(false).close()).toThrow(/nothing open/);
  });
});

describe('escaping', () => {
  it('should escape markup characters and encode control characters the OOXML way in text', () => {
    expect(escapeXmlText('a&b<c>d"e\'f\u0001g\tn')).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f_x0001_g\tn');
  });

  it('should strip control characters from attribute values', () => {
    expect(escapeXmlAttr('a\u0007b<')).toBe('ab&lt;');
  });

  it('should write a carriage return as _x000D_ in text, the way Excel stores one', () => {
    // A raw `\r` in element text is end-of-line normalized away by every conforming XML parser
    // (`\r\n` -> `\n`, a lone `\r` -> `\n`), so it never reached the reader. Excel writes it
    // as `_x000D_`, which both readers decode.
    expect(escapeXmlText('a\r\nb\rc')).toBe('a_x000D_\nb_x000D_c');
    expect(decodeOoxmlEscapes(escapeXmlText('a\r\nb'))).toBe('a\r\nb');
  });

  it('should write a carriage return, a line feed and a tab as character references in an attribute', () => {
    // Attribute-value normalization turns a raw `\r`, `\n` or `\t` into a space; a character
    // reference is the one spelling that survives it.
    expect(escapeXmlAttr('a\r\nb\tc')).toBe('a&#xD;&#xA;b&#x9;c');
  });

  it('should leave a carriage return in formula text as written', () => {
    // `ST_Formula` has no `_xHHHH_` convention: `_x000D_` would be literal formula text there.
    expect(escapeXmlMarkup('IF(A1,"a\r\nb")')).toBe('IF(A1,&quot;a\r\nb&quot;)');
  });

  it('should decode _xHHHH_ escapes back to code points', () => {
    expect(decodeOoxmlEscapes('a_x000D_b_x0001_')).toBe('a\rb\u0001');
    // SheetJS writes the hex in lower case.
    expect(decodeOoxmlEscapes('a_x000d_\nb')).toBe('a\r\nb');
    expect(decodeOoxmlEscapes('_xd83d__xde00_')).toBe('\u{1F600}');
    expect(decodeOoxmlEscapes('_xZZZZ_')).toBe('_xZZZZ_');
  });

  it('should leave a surrogate _xHHHH_ escape as written, like the tokenizer leaves &#xD800;', () => {
    // A lone surrogate names no character: decoded, it travelled through the whole import as an
    // unpaired code unit, and `TextEncoder` turned it into U+FFFD on the way out.
    expect(decodeOoxmlEscapes('a_xD800_b')).toBe('a_xD800_b');
    expect(decodeOoxmlEscapes('_xDFFF_')).toBe('_xDFFF_');
    expect(decodeOoxmlEscapes('_xD7FF_')).toBe(String.fromCharCode(0xD7FF));
    expect(decodeOoxmlEscapes('_xE000_')).toBe(String.fromCharCode(0xE000));
  });

  it('should decode a high surrogate escape followed by a low one into the astral character', () => {
    // ExcelJS decodes every `_xHHHH_`, so a pair it reads as an emoji was left literal here.
    expect(decodeOoxmlEscapes('a_xD83D__xDE00_b')).toBe('a\u{1F600}b');
    expect(decodeOoxmlEscapes('_xDBFF__xDFFF_')).toBe('\u{10FFFF}');
    expect(decodeOoxmlEscapes('_xD83D__xDE00__xD83D__xDE01_')).toBe('\u{1F600}\u{1F601}');
  });

  it('should leave a lone or reversed surrogate escape literal', () => {
    expect(decodeOoxmlEscapes('_xD83D_x')).toBe('_xD83D_x');
    expect(decodeOoxmlEscapes('_xDE00_')).toBe('_xDE00_');
    expect(decodeOoxmlEscapes('_xDE00__xD83D_')).toBe('_xDE00__xD83D_');
    expect(decodeOoxmlEscapes('_xD83D__xD83D_')).toBe('_xD83D__xD83D_');
    expect(decodeOoxmlEscapes('_xD83D__x0041_')).toBe('_xD83D_A');
    // The second high surrogate pairs with the low one after it; the first stays literal.
    expect(decodeOoxmlEscapes('_xD83D__xD83D__xDE00_')).toBe('_xD83D_\u{1F600}');
  });

  it('should escape a literal _xHHHH_-shaped run in text so decodeOoxmlEscapes reads it back unchanged', () => {
    const written = escapeXmlText('FILE_x0041_TEST');

    // The escaping underscore is itself escaped, OOXML-style, so the literal is not mistaken for
    // an escape of the control character it would otherwise decode to.
    expect(written).toBe('FILE_x005F_x0041_TEST');
    expect(decodeOoxmlEscapes(written)).toBe('FILE_x0041_TEST');
  });

  it('should ask for xml:space="preserve" only around leading, trailing or inner newline whitespace', () => {
    expect(needsSpacePreserve(' a')).toBe(true);
    expect(needsSpacePreserve('a ')).toBe(true);
    expect(needsSpacePreserve('a\nb')).toBe(true);
    expect(needsSpacePreserve('a b')).toBe(false);
  });

  it('should treat U+FFFE and U+FFFF as illegal but leave the Latin-1 characters their UTF-8 bytes spell alone', () => {
    // Raw U+FFFE / U+FFFF in the source are the bytes EF BF BE / EF BF BF. Decoded as Latin-1 (a
    // page served without a UTF-8 charset) those read as the letters below, so a class spelled
    // with raw bytes would escape or strip ordinary text.
    const latin1 = '\u00BF\u00EF\u00BE';

    expect(escapeXmlText(latin1)).toBe(latin1);
    expect(escapeXmlAttr(latin1)).toBe(latin1);
    expect(escapeXmlText('a\uFFFEb\uFFFFc')).not.toMatch(/[\uFFFE\uFFFF]/);
    expect(escapeXmlAttr('a\uFFFEb\uFFFFc')).toBe('abc');
  });

  it('should spell escapes.ts in 7-bit ASCII so no bundle depends on the page charset', () => {
    // ESLint's non-ASCII selectors cover identifiers and tagged templates, not regex literals.
    const source = readFileSync(join(__dirname, '../adapters/native/xml/escapes.ts'));
    const offenders = [...source.entries()].filter(([, byte]) => byte >= 0x80).map(([offset]) => offset);

    expect(offenders).toEqual([]);
  });
});

describe('native xml numeric attributes', () => {
  it('should read only the xsd:unsignedInt lexical form as a whole number', () => {
    expect(['0', '7', '007', '+3', '1048576'].map(parseUnsignedIntAttr)).toEqual([0, 7, 7, 3, 1048576]);
    expect([undefined, '', ' 3', '3 ', '-1', '2.5', '1e3', '0x10', 'NaN', 'Infinity', '1'.repeat(16)]
      .map(parseUnsignedIntAttr)).toEqual(Array(11).fill(null));
  });

  it('should read only a finite xsd:double lexical form as a number', () => {
    expect(['0', '-1', '2.5', '.5', '5.', '1e1', '+1E-2'].map(parseFiniteDoubleAttr))
      .toEqual([0, -1, 2.5, 0.5, 5, 10, 0.01]);
    expect([undefined, '', ' 1', '0x10', 'NaN', 'INF', 'Infinity', '1e999', '.', '1e']
      .map(parseFiniteDoubleAttr)).toEqual(Array(10).fill(null));
  });
});

describe('decodeXmlEntities: the decode loop', () => {
  it('should decode exactly what the reference grammar names and leave the rest as written', () => {
    expect(decodeXmlEntities('a &amp; b &lt;c&gt; &quot;&apos;')).toBe('a & b <c> "\'');
    expect(decodeXmlEntities('&#65;&#x42;&#x6a;')).toBe('ABj');
    expect(decodeXmlEntities('&&amp;;')).toBe('&&;');
    expect(decodeXmlEntities('&#X41; &#x; &#; &; &amp &ampx; &nbsp;')).toBe('&#X41; &#x; &#; &; &amp &ampx; &nbsp;');
    expect(decodeXmlEntities('&#xD800; &#x110000; &#99999999999999999999;'))
      .toBe('&#xD800; &#x110000; &#99999999999999999999;');
    expect(decodeXmlEntities('tail &')).toBe('tail &');
    expect(decodeXmlEntities('&lt;&lt;&lt;')).toBe('<<<');
    expect(decodeXmlEntities('&#x1F600;')).toBe('\u{1F600}');
  });

  it('should decode six million entities without allocating a multiple of the text', () => {
    // A callback `replace` allocates a match, its capture and an argument list per reference: a
    // 45 kB archive whose `<v>` was `&amp;` six million times (30 MB) cost about a gigabyte of
    // resident memory. The loop pushes slices, so the cost is the result and a small part list.
    const text = '&amp;'.repeat(6_000_000);
    const before = process.memoryUsage().rss;
    const decoded = decodeXmlEntities(text);
    const grown = process.memoryUsage().rss - before;

    expect(decoded.length).toBe(6_000_000);
    expect(decoded === '&'.repeat(6_000_000)).toBe(true);
    expect(grown).toBeLessThan(400 * 1024 * 1024);
  });
});

describe('tokenizeXml: end-of-line handling', () => {
  it('should read CR LF and a lone CR as LF in text, CDATA and attribute values', () => {
    // XML 1.0 normalizes both before parsing, so Excel and ExcelJS read `<t>a\r\nb</t>` as `a\nb`.
    expect(events('<t a="x\r\ny\rz">a\r\nb\rc<![CDATA[d\r\ne]]></t>')).toEqual([
      ['open', 't', { a: 'x\ny\nz' }, false],
      ['text', 'a\nb\nc'],
      ['text', 'd\ne'],
      ['close', 't'],
    ]);
  });

  it('should keep a carriage return written as a character reference', () => {
    // The normalization runs on the raw text, before references are decoded, so `&#13;` is the
    // one way a file can carry a real CR — and it must survive.
    expect(events('<t a="&#13;&#10;">a&#13;&#10;b</t>')).toEqual([
      ['open', 't', { a: '\r\n' }, false],
      ['text', 'a\r\nb'],
      ['close', 't'],
    ]);
  });
});
