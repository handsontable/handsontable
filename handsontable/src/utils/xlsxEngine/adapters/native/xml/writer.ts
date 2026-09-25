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
