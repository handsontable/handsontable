import { throwWithCause } from '../../../../../helpers/errors';

/**
 * Attributes of one element, values already entity-decoded.
 */
export type XmlAttributes = Record<string, string>;

/**
 * Callbacks the tokenizer drives. Every handler is optional.
 */
export interface XmlHandlers {
  open?(name: string, attrs: XmlAttributes, selfClosing: boolean): void;
  close?(name: string): void;
  text?(text: string): void;
}

/**
 * The five XML named entities. A `Map`, not an object literal: the entity name comes from the file,
 * and an object lookup resolved `&constructor;` through `Object.prototype` to the source text of
 * `Object`.
 */
const NAMED_ENTITIES = new Map<string, string>([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', '\''],
]);

/**
 * The highest code point `String.fromCodePoint` accepts. A reference above it is malformed.
 */
const MAX_CODE_POINT = 0x10FFFF;

/**
 * The UTF-16 surrogate range. A code point in it is not a character: it only exists as half of a
 * surrogate PAIR inside UTF-16 itself, and XML forbids a reference to one.
 */
const FIRST_SURROGATE = 0xD800;
const LAST_SURROGATE = 0xDFFF;

/**
 * Whether a numeric character reference names a code point that can stand on its own.
 */
function isDecodableCodePoint(code: number): boolean {
  if (!Number.isFinite(code) || code < 0 || code > MAX_CODE_POINT) {
    return false;
  }

  return code < FIRST_SURROGATE || code > LAST_SURROGATE;
}

/**
 * How many decoded pieces `decodeXmlEntities` collects before it joins them into one chunk. Joining
 * as it goes keeps the piece list small however many references a text holds.
 */
const DECODE_JOIN_THRESHOLD = 1024;

/**
 * Whether a character code is an ASCII letter, the only characters a named reference may hold.
 */
function isAsciiLetter(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * Whether a character code is a decimal digit.
 */
function isDecimalDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

/**
 * Whether a character code is a hexadecimal digit.
 */
function isHexDigit(code: number): boolean {
  return isDecimalDigit(code) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102);
}

/**
 * The offset of the `;` that closes the reference starting at the `&` at `amp`, or -1 when the text
 * there is not one: `&#x` and hex digits, `&#` and decimal digits, or `&` and ASCII letters, each
 * followed directly by `;`. Every run is scanned to its end, so this reads the same grammar the
 * `&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);` pattern did.
 */
function referenceEnd(text: string, amp: number): number {
  const { length } = text;
  let i = amp + 1;
  let isPart = isAsciiLetter;

  if (text.charCodeAt(i) === 35) {
    i += 1;
    isPart = isDecimalDigit;

    if (text.charCodeAt(i) === 120) {
      i += 1;
      isPart = isHexDigit;
    }
  }

  const start = i;

  while (i < length && isPart(text.charCodeAt(i))) {
    i += 1;
  }

  return i > start && text.charCodeAt(i) === 59 ? i : -1;
}

/**
 * The text a reference body (what sits between `&` and `;`) stands for, or `null` when it names
 * nothing this tokenizer decodes.
 */
function decodeReference(body: string): string | null {
  if (body.charCodeAt(0) !== 35) {
    return NAMED_ENTITIES.get(body) ?? null;
  }

  const isHex = body.charCodeAt(1) === 120;
  const code = Number.parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);

  return isDecodableCodePoint(code) ? String.fromCodePoint(code) : null;
}

/**
 * Decodes the five predefined entities and numeric character references. Anything else is left
 * as written; this tokenizer never resolves a DTD, so no other entity can exist, and no entity can
 * expand into another one.
 *
 * A numeric reference out of Unicode's range is left as written rather than decoded: the input is
 * an untrusted file, and `String.fromCodePoint` answers an out-of-range value with a raw
 * `RangeError` that would escape this reader's `throwWithCause` contract. A reference INTO the
 * UTF-16 surrogate range (`&#xD800;`–`&#xDFFF;`) is left as written for the same reason — it names
 * no character, `String.fromCodePoint` accepts it and hands back a lone surrogate that then travels
 * through the whole import as an unpaired code unit, and `TextEncoder` replaces it with U+FFFD on
 * the way back out, so the round trip loses it either way.
 *
 * The text is walked with `indexOf('&')` and the pieces between references are pushed as slices,
 * joined every `DECODE_JOIN_THRESHOLD` pieces. A callback `replace` allocated a match, a capture
 * and an argument list for every reference: a cell holding `&amp;` six million times (30 MB of
 * XML from a 45 kB archive) cost about a gigabyte of resident memory, against the size of the
 * result here.
 */
export function decodeXmlEntities(text: string): string {
  let amp = text.indexOf('&');

  if (amp === -1) {
    return text;
  }

  const chunks: string[] = [];
  let pieces: string[] = [];
  let from = 0;

  while (amp !== -1) {
    const end = referenceEnd(text, amp);
    const decoded = end === -1 ? null : decodeReference(text.slice(amp + 1, end));

    if (decoded === null) {
      amp = text.indexOf('&', amp + 1);
    } else {
      if (amp > from) {
        pieces.push(text.slice(from, amp));
      }

      pieces.push(decoded);
      from = end + 1;
      amp = text.indexOf('&', from);

      if (pieces.length >= DECODE_JOIN_THRESHOLD) {
        chunks.push(pieces.join(''));
        pieces = [];
      }
    }
  }

  if (from < text.length) {
    pieces.push(text.slice(from));
  }

  chunks.push(pieces.join(''));

  return chunks.length === 1 ? chunks[0] : chunks.join('');
}

/**
 * Applies XML 1.0's end-of-line handling (section 2.11): every `\r\n` pair and every lone `\r`
 * reads as `\n`. It runs on the RAW text, before references are decoded, so a `&#13;` the file
 * wrote on purpose still decodes to a carriage return. Excel and ExcelJS both read `a\r\nb` as
 * `a\nb`; without this the native reader kept the `\r`.
 */
function normalizeLineEndings(text: string): string {
  return text.includes('\r') ? text.replace(/\r\n?/g, '\n') : text;
}

/**
 * Creates the element-name normalizer the reader of a main OOXML part matches its `switch` on.
 *
 * Excel and Google Sheets bind the main namespace as the DEFAULT one, but nothing requires it: a
 * generator may write `<x:worksheet xmlns:x="…"><x:c>`, and a reader switching on the raw name
 * then sees an empty sheet. The returned function learns the prefix from the part's ROOT element —
 * which is in the main namespace by definition — and strips exactly that one, so a file written
 * the usual way is normalized not at all.
 *
 * Stripping EVERY prefix instead would be wrong: an `<extLst>` carries extension elements such as
 * `x14:conditionalFormatting` whose local names collide with the main schema's, and the native
 * reader read one as a second, empty conditional-formatting block on ExcelJS-written bytes.
 *
 * Never apply the result to an ATTRIBUTE name — `r:id` is a different attribute from `id`, and it
 * is what resolves a sheet to its part. Never apply it to a VML part either: those element names
 * are matched WITH their `x:` prefix on purpose.
 */
export function createLocalName(): (name: string) => string {
  let prefix: string | null = null;

  return (name: string): string => {
    if (prefix === null) {
      const colon = name.indexOf(':');

      prefix = colon === -1 ? '' : name.slice(0, colon + 1);
    }

    return prefix !== '' && name.startsWith(prefix) ? name.slice(prefix.length) : name;
  };
}

/**
 * Throws the one malformed-input error every failure path shares.
 */
function malformed(offset: number): never {
  throwWithCause(`The XML part is malformed at offset ${offset}.`);
}

/**
 * Whether a character code is XML whitespace (space, tab, newline, carriage return).
 */
function isWhitespace(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13;
}

/**
 * Whether a character code ends an element or attribute name.
 */
function isNameEnd(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13 || code === 47 || code === 62 || code === 61;
}

/**
 * Scans forward from `from` while the characters are part of a name, returning the offset of the
 * first one that ends it.
 */
function skipName(xml: string, from: number): number {
  let i = from;

  while (i < xml.length && !isNameEnd(xml.charCodeAt(i))) {
    i += 1;
  }

  return i;
}

/**
 * Scans forward from `from` over XML whitespace, returning the offset of the first character that
 * is not whitespace.
 */
function skipWhitespace(xml: string, from: number): number {
  let i = from;

  while (i < xml.length && isWhitespace(xml.charCodeAt(i))) {
    i += 1;
  }

  return i;
}

/**
 * Hands the text handler the character data between two offsets, when there is any and the caller
 * asked for it at all.
 */
function emitText(xml: string, from: number, to: number, handlers: XmlHandlers): void {
  if (handlers.text && to > from) {
    handlers.text(decodeXmlEntities(normalizeLineEndings(xml.slice(from, to))));
  }
}

/**
 * Skips a processing instruction (`<?…?>`, the prolog among them), returning the offset past it.
 */
function skipProcessingInstruction(xml: string, lt: number): number {
  const end = xml.indexOf('?>', lt);

  return end === -1 ? malformed(lt) : end + 2;
}

/**
 * Skips a comment, returning the offset past it.
 */
function skipComment(xml: string, lt: number): number {
  const end = xml.indexOf('-->', lt);

  return end === -1 ? malformed(lt) : end + 3;
}

/**
 * Delivers a CDATA section as text — uninterpreted, so no entity in it is decoded — and returns
 * the offset past it. Its line endings are still normalized: XML applies that to the whole entity
 * before markup is recognized, CDATA included.
 */
function readCdata(xml: string, lt: number, handlers: XmlHandlers): number {
  const end = xml.indexOf(']]>', lt);

  if (end === -1) {
    malformed(lt);
  }

  if (handlers.text) {
    handlers.text(normalizeLineEndings(xml.slice(lt + 9, end)));
  }

  return end + 3;
}

/**
 * Skips a DOCTYPE, returning the offset past it.
 */
function skipDoctype(xml: string, lt: number): number {
  // A DOCTYPE, possibly with an internal subset in brackets. Skip to its closing `>` at depth 0.
  const { length } = xml;
  let depth = 0;
  let j = lt + 2;

  for (; j < length; j++) {
    const code = xml.charCodeAt(j);

    if (code === 91) {
      depth += 1;
    } else if (code === 93) {
      // Clamped: a stray `]` before any `[` would otherwise drive the depth negative, and the
      // skip would then run past this DOCTYPE's own `>` into real content.
      depth = Math.max(0, depth - 1);
    } else if (code === 62 && depth === 0) {
      break;
    }
  }

  return j >= length ? malformed(lt) : j + 1;
}

/**
 * Fires the close handler for an end tag, returning the offset past it.
 */
function readEndTag(xml: string, lt: number, handlers: XmlHandlers): number {
  const end = xml.indexOf('>', lt);

  if (end === -1) {
    malformed(lt);
  }

  if (handlers.close) {
    handlers.close(xml.slice(lt + 2, end).trim());
  }

  return end + 1;
}

/**
 * One attribute of a start tag, with the offset past its closing quote.
 */
interface XmlAttribute {
  name: string;
  value: string;
  end: number;
}

/**
 * Reads one `name="value"` pair starting at `from`. `lt` is the tag's own `<`, the offset every
 * failure in the tag is reported at.
 */
function readAttribute(xml: string, from: number, lt: number): XmlAttribute {
  let k = skipName(xml, from);
  const name = xml.slice(from, k);

  k = skipWhitespace(xml, k);

  // The `=` must be the next thing after the name and any spacing around it. Scanning FORWARD
  // for an `=` instead would walk straight through this tag's `>` on a bare attribute
  // (`<a b>`) and steal the next element's attribute value, swallowing that element whole.
  if (name === '' || xml.charCodeAt(k) !== 61) {
    malformed(lt);
  }

  k = skipWhitespace(xml, k + 1);

  const quote = xml.charCodeAt(k);

  if (quote !== 34 && quote !== 39) {
    malformed(lt);
  }

  const valueEnd = xml.indexOf(String.fromCharCode(quote), k + 1);

  if (valueEnd === -1) {
    malformed(lt);
  }

  return { name, value: decodeXmlEntities(normalizeLineEndings(xml.slice(k + 1, valueEnd))), end: valueEnd + 1 };
}

/**
 * A start tag, with the offset past its `>`.
 */
interface XmlStartTag {
  name: string;
  attrs: XmlAttributes;
  selfClosing: boolean;
  end: number;
}

/**
 * Reads a start tag and every attribute on it. The attribute count is unbounded: an element may
 * carry as many as the file declares, and the loop ends only on the tag's own `>`.
 */
function readStartTag(xml: string, lt: number): XmlStartTag {
  let j = skipName(xml, lt + 1);

  if (j === lt + 1 || j >= xml.length) {
    malformed(lt);
  }

  const name = xml.slice(lt + 1, j);
  const attrs: XmlAttributes = {};
  let selfClosing = false;

  for (;;) {
    j = skipWhitespace(xml, j);

    if (j >= xml.length) {
      malformed(lt);
    }

    const code = xml.charCodeAt(j);

    if (code === 47) {
      selfClosing = true;
      j += 1;
      continue;
    }

    if (code === 62) {
      j += 1;
      break;
    }

    const attribute = readAttribute(xml, j, lt);

    attrs[attribute.name] = attribute.value;
    j = attribute.end;
  }

  return { name, attrs, selfClosing, end: j };
}

/**
 * Reads the one markup construct that starts at `lt`, firing the handler it belongs to, and
 * returns the offset past it. The order of the tests is the order the prefixes disambiguate in:
 * `<!--` and `<![CDATA[` are both `<!`, so the DOCTYPE test has to come last of the three.
 */
function readMarkup(xml: string, lt: number, handlers: XmlHandlers): number {
  if (xml.startsWith('<?', lt)) {
    return skipProcessingInstruction(xml, lt);
  }

  if (xml.startsWith('<!--', lt)) {
    return skipComment(xml, lt);
  }

  if (xml.startsWith('<![CDATA[', lt)) {
    return readCdata(xml, lt, handlers);
  }

  if (xml.startsWith('<!', lt)) {
    return skipDoctype(xml, lt);
  }

  if (xml.startsWith('</', lt)) {
    return readEndTag(xml, lt, handlers);
  }

  const { name, attrs, selfClosing, end } = readStartTag(xml, lt);

  if (handlers.open) {
    handlers.open(name, attrs, selfClosing);
  }

  return end;
}

/**
 * Tokenizes an XML document forward-only, calling the handlers as it goes. No tree is built; the
 * caller keeps whatever state it needs. Names keep their namespace prefix (`x:ClientData`,
 * `r:id`); a reader of a main OOXML part normalizes an element's prefix with `createLocalName()`,
 * and an attribute name is always matched as written. The prolog, comments and a DOCTYPE are skipped without interpretation; CDATA is
 * delivered as text.
 */
export function tokenizeXml(xml: string, handlers: XmlHandlers): void {
  const { length } = xml;
  let i = 0;

  while (i < length) {
    const lt = xml.indexOf('<', i);

    if (lt === -1) {
      emitText(xml, i, length, handlers);

      return;
    }

    emitText(xml, i, lt, handlers);
    i = readMarkup(xml, lt, handlers);
  }
}
