import { decodeOoxmlEscapes } from './escapes';
import { createLocalName, type XmlAttributes, type XmlHandlers } from './tokenizer';

/**
 * Builds the tokenizer handlers that read one OOXML rich-text container — a `<si>` of
 * `sharedStrings.xml`, a `<comment>` of `comments{N}.xml` — into the text it holds. Both parts
 * carry the same state machine: the container opens, any number of `<r>` runs each hold a `<t>`,
 * the `<t>` texts are concatenated in order, and a `<rPh>` phonetic run is skipped because its
 * text is a reading aid rather than part of the value.
 *
 * `onOpen` receives the container's attributes (the `ref` a comment is anchored to). `onClose`
 * receives the joined text with its `_xHHHH_` escapes decoded, and whether the container held run
 * formatting — the caller reports that as a dropped feature. Throwing from either callback aborts
 * the tokenize, which is how a reader enforces a cap on the entries it has collected so far.
 *
 * Element names are normalized against the part's root prefix, so the handlers may not be reused
 * across two parts: build one set per `tokenizeXml` call.
 */
export function collectRichTextRuns(
  container: string,
  onOpen: (attrs: XmlAttributes) => void,
  onClose: (text: string, isRich: boolean) => void,
): XmlHandlers {
  const localName = createLocalName();
  let parts: string[] | null = null;
  let isRich = false;
  let inText = false;
  let inPhonetic = false;

  return {
    open(rawName, attrs, selfClosing) {
      const name = localName(rawName);

      if (name === container) {
        parts = [];
        isRich = false;
        onOpen(attrs);
      } else if (name === 'r') {
        isRich = true;
      } else if (name === 'rPh') {
        inPhonetic = !selfClosing;
      } else if (name === 't' && parts !== null && !inPhonetic) {
        inText = !selfClosing;
      }
    },
    text(text) {
      if (inText && parts !== null) {
        parts.push(text);
      }
    },
    close(rawName) {
      const name = localName(rawName);

      if (name === 't') {
        inText = false;
      } else if (name === 'rPh') {
        inPhonetic = false;
      } else if (name === container && parts !== null) {
        const text = decodeOoxmlEscapes(parts.join(''));

        parts = null;
        onClose(text, isRich);
      }
    },
  };
}
