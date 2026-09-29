import { throwWithCause } from '../../../../../helpers/errors';
import { escapeXmlAttr, escapeXmlText } from './escapes';

/**
 * An attribute value. `undefined` skips the attribute; booleans render as `1`/`0`.
 */
export type XmlAttributeValue = string | number | boolean | undefined;

/**
 * Attributes to write, in insertion order.
 */
export type XmlAttributeMap = Record<string, XmlAttributeValue>;

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/**
 * How many pending parts the writer holds before it joins them into one chunk. A million-cell
 * sheet pushed millions of small strings into one array before a single `join('')`; joining every
 * few thousand keeps the array short and lets the engine free the small strings as it goes.
 */
export const XML_WRITER_FLUSH_THRESHOLD = 4096;

/**
 * Builds an XML document as a string. Every text and attribute value goes through the escapers.
 */
export class XmlWriter {
  /**
   * Joined chunks of everything written before the pending parts, in order.
   */
  #chunks: string[] = [];

  /**
   * Pending parts not yet joined into `#chunks`.
   */
  #parts: string[] = [];

  /**
   * How many parts have been joined into `#chunks` so far; `#flushed + #parts.length` is the
   * global index of the next part.
   */
  #flushed = 0;

  /**
   * Open element names, innermost last.
   */
  #stack: string[] = [];

  /**
   * Global index of each open element's start tag, parallel to `#stack`.
   */
  #openIndex: number[] = [];

  /**
   * Starts a document, with the standalone declaration unless `withDeclaration` is `false`.
   */
  constructor(withDeclaration = true) {
    if (withDeclaration) {
      this.#push(XML_DECLARATION);
    }
  }

  /**
   * Opens an element.
   */
  open(name: string, attrs?: XmlAttributeMap): this {
    this.#push(`<${name}${this.#attributes(attrs)}>`);
    this.#openIndex.push(this.#flushed + this.#parts.length - 1);
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

    // A start tag that was flushed always has something after it (`#push` flushes BEFORE it
    // appends), so only a start tag still pending can be the last part written.
    if (openAt === this.#flushed + this.#parts.length - 1) {
      const local = openAt - this.#flushed;
      const tag = this.#parts[local];

      this.#parts[local] = `${tag.slice(0, -1)}/>`;
    } else {
      this.#push(`</${name}>`);
    }

    return this;
  }

  /**
   * Writes an element with optional text and no children.
   */
  leaf(name: string, attrs?: XmlAttributeMap, text?: string): this {
    if (text === undefined) {
      this.#push(`<${name}${this.#attributes(attrs)}/>`);
    } else {
      this.#push(`<${name}${this.#attributes(attrs)}>${escapeXmlText(text)}</${name}>`);
    }

    return this;
  }

  /**
   * Writes text inside the open element.
   */
  text(text: string): this {
    this.#push(escapeXmlText(text));

    return this;
  }

  /**
   * Appends already-serialized XML.
   */
  raw(xml: string): this {
    // An empty chunk would keep `close()` from collapsing an otherwise empty element to `<x/>`.
    if (xml !== '') {
      this.#push(xml);
    }

    return this;
  }

  /**
   * The document so far.
   */
  toString(): string {
    return this.#chunks.join('') + this.#parts.join('');
  }

  /**
   * Appends one part, joining the pending parts into a chunk first once there are enough of them.
   * The flush runs BEFORE the append so the newest part is always pending — which is what lets
   * `close()` collapse an empty element by looking at the pending parts alone.
   */
  #push(part: string): void {
    if (this.#parts.length >= XML_WRITER_FLUSH_THRESHOLD) {
      this.#chunks.push(this.#parts.join(''));
      this.#flushed += this.#parts.length;
      this.#parts = [];
    }

    this.#parts.push(part);
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
