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

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
};

/**
 * The highest code point `String.fromCodePoint` accepts. A reference above it is malformed.
 */
const MAX_CODE_POINT = 0x10FFFF;

/**
 * Decodes the five predefined entities and numeric character references. Anything else is left
 * as written; this tokenizer never resolves a DTD, so no other entity can exist, and no entity can
 * expand into another one.
 *
 * A numeric reference out of Unicode's range is left as written rather than decoded: the input is
 * an untrusted file, and `String.fromCodePoint` answers an out-of-range value with a raw
 * `RangeError` that would escape this reader's `throwWithCause` contract.
 */
export function decodeXmlEntities(text: string): string {
  if (!text.includes('&')) {
    return text;
  }

  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match: string, body: string) => {
    if (body.startsWith('#')) {
      const isHex = body.startsWith('#x');
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);

      return Number.isFinite(code) && code >= 0 && code <= MAX_CODE_POINT ? String.fromCodePoint(code) : match;
    }

    return NAMED_ENTITIES[body] ?? match;
  });
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
 * Tokenizes an XML document forward-only, calling the handlers as it goes. No tree is built; the
 * caller keeps whatever state it needs. Names keep their namespace prefix (`x:ClientData`,
 * `r:id`). The prolog, comments and a DOCTYPE are skipped without interpretation; CDATA is
 * delivered as text.
 */
export function tokenizeXml(xml: string, handlers: XmlHandlers): void {
  const { length } = xml;
  let i = 0;

  while (i < length) {
    const lt = xml.indexOf('<', i);

    if (lt === -1) {
      if (handlers.text && i < length) {
        handlers.text(decodeXmlEntities(xml.slice(i)));
      }

      return;
    }

    if (lt > i && handlers.text) {
      handlers.text(decodeXmlEntities(xml.slice(i, lt)));
    }

    if (xml.startsWith('<?', lt)) {
      const end = xml.indexOf('?>', lt);

      i = end === -1 ? malformed(lt) : end + 2;
      continue;
    }

    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt);

      i = end === -1 ? malformed(lt) : end + 3;
      continue;
    }

    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt);

      if (end === -1) {
        malformed(lt);
      }

      if (handlers.text) {
        handlers.text(xml.slice(lt + 9, end));
      }

      i = end + 3;
      continue;
    }

    if (xml.startsWith('<!', lt)) {
      // A DOCTYPE, possibly with an internal subset in brackets. Skip to its closing `>` at depth 0.
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

      i = j >= length ? malformed(lt) : j + 1;
      continue;
    }

    if (xml.startsWith('</', lt)) {
      const end = xml.indexOf('>', lt);

      if (end === -1) {
        malformed(lt);
      }

      if (handlers.close) {
        handlers.close(xml.slice(lt + 2, end).trim());
      }

      i = end + 1;
      continue;
    }

    // Start tag.
    let j = lt + 1;

    while (j < length && !isNameEnd(xml.charCodeAt(j))) {
      j += 1;
    }

    if (j === lt + 1 || j >= length) {
      malformed(lt);
    }

    const name = xml.slice(lt + 1, j);
    const attrs: XmlAttributes = {};
    let selfClosing = false;

    for (;;) {
      while (j < length && isWhitespace(xml.charCodeAt(j))) {
        j += 1;
      }

      if (j >= length) {
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

      let k = j;

      while (k < length && !isNameEnd(xml.charCodeAt(k))) {
        k += 1;
      }

      const attrName = xml.slice(j, k);

      while (k < length && isWhitespace(xml.charCodeAt(k))) {
        k += 1;
      }

      // The `=` must be the next thing after the name and any spacing around it. Scanning FORWARD
      // for an `=` instead would walk straight through this tag's `>` on a bare attribute
      // (`<a b>`) and steal the next element's attribute value, swallowing that element whole.
      if (attrName === '' || xml.charCodeAt(k) !== 61) {
        malformed(lt);
      }

      k += 1;

      while (k < length && isWhitespace(xml.charCodeAt(k))) {
        k += 1;
      }

      const quote = xml.charCodeAt(k);

      if (quote !== 34 && quote !== 39) {
        malformed(lt);
      }

      const valueEnd = xml.indexOf(String.fromCharCode(quote), k + 1);

      if (valueEnd === -1) {
        malformed(lt);
      }

      attrs[attrName] = decodeXmlEntities(xml.slice(k + 1, valueEnd));
      j = valueEnd + 1;
    }

    if (handlers.open) {
      handlers.open(name, attrs, selfClosing);
    }

    i = j;
  }
}
