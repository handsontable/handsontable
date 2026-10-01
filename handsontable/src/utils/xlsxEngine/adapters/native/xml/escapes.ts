/**
 * The OOXML text conventions both directions of this adapter need: the five markup characters, the
 * `_xHHHH_` control-character escape, and the `xml:space="preserve"` test. They live here rather
 * than beside the writer because every reader of this adapter decodes what the writer encoded.
 */

// C0 controls other than tab, newline and carriage return, plus DEL, plus the two non-characters
// U+FFFE and U+FFFF: all outside XML 1.0's `Char` production, and Excel offers to "repair" a file
// that carries one raw.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const ILLEGAL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g;

// The five markup characters `escapeMarkup` rewrites.
const MARKUP_CHARS = /[&<>"']/;

// Whatever `escapeXmlText` could change: markup, an illegal character, or the underscore that
// starts a `_xHHHH_` lookalike. A string with none of them is returned as it came in, which is the
// case for every number and most cell text, and skips the seven replace passes below.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const NEEDS_TEXT_ESCAPE = /[&<>"'_\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/;

// Whatever `escapeXmlAttr` could change: markup or an illegal character.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const NEEDS_ATTR_ESCAPE = /[&<>"'\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/;

// A literal `_xHHHH_`-shaped run already present in the text, which `decodeOoxmlEscapes` would
// otherwise mistake for one of ITS OWN escapes on the next read.
const OOXML_ESCAPE_LOOKALIKE = /_x([0-9A-F]{4})_/g;

/**
 * Escapes the five markup characters.
 */
function escapeMarkup(text: string): string {
  if (!MARKUP_CHARS.test(text)) {
    return text;
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escapes element text. A character XML 1.0 forbids (a C0 control, DEL, U+FFFE, U+FFFF) is
 * written the way spreadsheet applications do, as `_xHHHH_`, so a reader that knows the
 * convention gets it back. A literal `_xHHHH_`-shaped run already in the text is escaped first,
 * by escaping its own leading underscore as `_x005F_` (the OOXML convention Excel itself follows)
 * so `decodeOoxmlEscapes` reads it back unchanged on import instead of corrupting it into a
 * control character. Text that needs none of this is returned as it came in.
 */
export function escapeXmlText(text: string): string {
  if (!NEEDS_TEXT_ESCAPE.test(text)) {
    return text;
  }

  const withoutLookalikes = escapeMarkup(text).replace(OOXML_ESCAPE_LOOKALIKE, '_x005F_x$1_');

  return withoutLookalikes.replace(ILLEGAL_CHARS, (ch) => {
    const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');

    return `_x${hex}_`;
  });
}

/**
 * Escapes an attribute value. Illegal characters are dropped: an attribute never carries user
 * text that a round trip has to preserve.
 */
export function escapeXmlAttr(text: string): string {
  if (!NEEDS_ATTR_ESCAPE.test(text)) {
    return text;
  }

  return escapeMarkup(text.replace(ILLEGAL_CHARS, ''));
}

// The UTF-16 surrogate range. An escape inside it names no character, so it is left as written.
const FIRST_SURROGATE = 0xD800;
const LAST_SURROGATE = 0xDFFF;

/**
 * Decodes the `_xHHHH_` escapes a shared string or inline string may carry. An escape in the
 * surrogate range (`_xD800_`-`_xDFFF_`) is left as written, the way `decodeXmlEntities` leaves
 * `&#xD800;`: decoded, it would hand back an unpaired code unit that travels through the whole
 * import and comes out of `TextEncoder` as U+FFFD.
 */
export function decodeOoxmlEscapes(text: string): string {
  if (!text.includes('_x')) {
    return text;
  }

  return text.replace(/_x([0-9A-F]{4})_/g, (match: string, hex: string) => {
    const code = Number.parseInt(hex, 16);

    return code >= FIRST_SURROGATE && code <= LAST_SURROGATE ? match : String.fromCharCode(code);
  });
}

/**
 * Whether a `<t>` needs `xml:space="preserve"` for its text to survive a strict parser.
 */
export function needsSpacePreserve(text: string): boolean {
  return /^\s|\s$|\n/.test(text);
}
