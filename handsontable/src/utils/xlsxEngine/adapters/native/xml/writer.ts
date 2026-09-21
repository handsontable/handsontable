import { throwWithCause } from '../../../../../helpers/errors';

/**
 * An attribute value. `undefined` skips the attribute; booleans render as `1`/`0`.
 */
export type XmlAttributeValue = string | number | boolean | undefined;

/**
 * Attributes to write, in insertion order.
 */
export type XmlAttributeMap = Record<string, XmlAttributeValue>;

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

// C0 controls other than tab, newline and carriage return, plus DEL: illegal in XML 1.0.
// eslint-disable-next-line no-control-regex
const ILLEGAL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Escapes the five markup characters.
 */
function escapeMarkup(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// A literal `_xHHHH_`-shaped run already present in the text, which `decodeOoxmlEscapes` would
// otherwise mistake for one of ITS OWN escapes on the next read.
const OOXML_ESCAPE_LOOKALIKE = /_x([0-9A-F]{4})_/g;

/**
 * Escapes element text. A control character XML 1.0 forbids is written the way spreadsheet
 * applications do, as `_xHHHH_`, so a reader that knows the convention gets it back. A literal
 * `_xHHHH_`-shaped run already in the text is escaped first, by escaping its own leading
 * underscore as `_x005F_` (the OOXML convention Excel itself follows) so `decodeOoxmlEscapes`
 * reads it back unchanged on import instead of corrupting it into a control character.
 */
export function escapeXmlText(text: string): string {
  const withoutLookalikes = escapeMarkup(text).replace(OOXML_ESCAPE_LOOKALIKE, '_x005F_x$1_');

  return withoutLookalikes.replace(ILLEGAL_CHARS, (ch) => {
    const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');

    return `_x${hex}_`;
  });
}

/**
 * Escapes an attribute value. Control characters are dropped: an attribute never carries user
 * text that a round trip has to preserve.
 */
export function escapeXmlAttr(text: string): string {
  return escapeMarkup(text.replace(ILLEGAL_CHARS, ''));
}

/**
 * Decodes the `_xHHHH_` escapes a shared string or inline string may carry.
 */
export function decodeOoxmlEscapes(text: string): string {
  return text.includes('_x')
    ? text.replace(/_x([0-9A-F]{4})_/g, (_m: string, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    : text;
}

/**
 * Whether a `<t>` needs `xml:space="preserve"` for its text to survive a strict parser.
 */
export function needsSpacePreserve(text: string): boolean {
  return /^\s|\s$|\n/.test(text);
}

/**
 * Builds an XML document as a string. Every text and attribute value goes through the escapers.
 */
export class XmlWriter {
  /**
   * Output chunks, joined on `toString()`.
   */
  #parts: string[] = [];

  /**
   * Open element names, innermost last.
   */
  #stack: string[] = [];

  /**
   * Index in `#parts` of each open element's start tag, parallel to `#stack`.
   */
  #openIndex: number[] = [];

  /**
   * Starts a document, with the standalone declaration unless `withDeclaration` is `false`.
   */
  constructor(withDeclaration = true) {
    if (withDeclaration) {
      this.#parts.push(XML_DECLARATION);
    }
  }

  /**
   * Opens an element.
   */
  open(name: string, attrs?: XmlAttributeMap): this {
    this.#openIndex.push(this.#parts.length);
    this.#parts.push(`<${name}${this.#attributes(attrs)}>`);
    this.#stack.push(name);

    return this;
  }

  /**
   * Closes the innermost open element. A start tag with nothing written after it collapses into
   * a self-closing tag.
   */
  close(): this {
    const name = this.#stack.pop();
    const openAt = this.#openIndex.pop();

    if (name === undefined || openAt === undefined) {
      throwWithCause('XmlWriter#close was called with nothing open.');
    }

    if (openAt === this.#parts.length - 1) {
      const tag = this.#parts[openAt];

      this.#parts[openAt] = `${tag.slice(0, -1)}/>`;
    } else {
      this.#parts.push(`</${name}>`);
    }

    return this;
  }

  /**
   * Writes an element with optional text and no children.
   */
  leaf(name: string, attrs?: XmlAttributeMap, text?: string): this {
    if (text === undefined) {
      this.#parts.push(`<${name}${this.#attributes(attrs)}/>`);
    } else {
      this.#parts.push(`<${name}${this.#attributes(attrs)}>${escapeXmlText(text)}</${name}>`);
    }

    return this;
  }

  /**
   * Writes text inside the open element.
   */
  text(text: string): this {
    this.#parts.push(escapeXmlText(text));

    return this;
  }

  /**
   * Appends already-serialized XML.
   */
  raw(xml: string): this {
    // An empty chunk would keep `close()` from collapsing an otherwise empty element to `<x/>`.
    if (xml !== '') {
      this.#parts.push(xml);
    }

    return this;
  }

  /**
   * The document so far.
   */
  toString(): string {
    return this.#parts.join('');
  }

  /**
   * Serializes attributes, skipping `undefined` values.
   */
  #attributes(attrs?: XmlAttributeMap): string {
    if (!attrs) {
      return '';
    }

    let out = '';

    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];

      if (value === undefined) {
        return;
      }

      let rendered: string;

      if (typeof value === 'boolean') {
        rendered = value ? '1' : '0';
      } else {
        rendered = String(value);
      }

      out += ` ${key}="${escapeXmlAttr(rendered)}"`;
    });

    return out;
  }
}
