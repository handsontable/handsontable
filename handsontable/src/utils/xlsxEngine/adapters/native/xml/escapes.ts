/**
 * The OOXML text conventions both directions of this adapter need: the five markup characters, the
 * `_xHHHH_` control-character escape, and the `xml:space="preserve"` test. They live here rather
 * than beside the writer because every reader of this adapter decodes what the writer encoded.
 */

// C0 controls other than tab, newline and carriage return, plus DEL: illegal in XML 1.0.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const ILLEGAL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// A literal `_xHHHH_`-shaped run already present in the text, which `decodeOoxmlEscapes` would
// otherwise mistake for one of ITS OWN escapes on the next read.
const OOXML_ESCAPE_LOOKALIKE = /_x([0-9A-F]{4})_/g;

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
