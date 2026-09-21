/**
 * @jest-environment node
 */
import { tokenizeXml, decodeXmlEntities } from '../adapters/native/xml/tokenizer';
import {
  XmlWriter, escapeXmlText, escapeXmlAttr, decodeOoxmlEscapes, needsSpacePreserve,
} from '../adapters/native/xml/writer';

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

  it('should decode _xHHHH_ escapes back to code points', () => {
    expect(decodeOoxmlEscapes('a_x000D_b_x0001_')).toBe('a\rb\u0001');
    expect(decodeOoxmlEscapes('_xZZZZ_')).toBe('_xZZZZ_');
  });

  it('should ask for xml:space="preserve" only around leading, trailing or inner newline whitespace', () => {
    expect(needsSpacePreserve(' a')).toBe(true);
    expect(needsSpacePreserve('a ')).toBe(true);
    expect(needsSpacePreserve('a\nb')).toBe(true);
    expect(needsSpacePreserve('a b')).toBe(false);
  });
});
