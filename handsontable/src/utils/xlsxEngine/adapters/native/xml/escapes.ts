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

// What `escapeXmlText` writes as `_xHHHH_`: every illegal character, plus the carriage return.
// A raw CR is legal XML, but a parser's end-of-line handling turns CR LF and a lone CR into LF
// before any reader sees the text, so a CR/LF pair came back as a bare LF. Excel stores the
// carriage return as `_x000D_`, which both readers decode. Tab and line feed survive raw.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const TEXT_ESCAPED_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F\uFFFE\uFFFF]/g;

// Whatever `escapeXmlText` could change: markup, an escaped character, or the underscore that
// starts a `_xHHHH_` lookalike. A string with none of them is returned as it came in, which is the
// case for every number and most cell text, and skips the seven replace passes below.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const NEEDS_TEXT_ESCAPE = /[&<>"'_\u0000-\u0008\u000B-\u001F\u007F\uFFFE\uFFFF]/;

// Whatever `escapeXmlMarkup` could change: markup or an illegal character.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const NEEDS_MARKUP_ESCAPE = /[&<>"'\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/;

// The whitespace an attribute value cannot carry raw: attribute-value normalization (XML 1.0,
// section 3.3.3) turns each of them into a space, and only a character reference survives it.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const ATTR_WHITESPACE = /[\u0009\u000A\u000D]/g;

// Whatever `escapeXmlAttr` could change: what `escapeXmlMarkup` changes, or attribute whitespace.
// eslint-disable-next-line no-control-regex -- the control characters ARE what this class selects.
const NEEDS_ATTR_ESCAPE = /[&<>"'\u0000-\u001F\u007F\uFFFE\uFFFF]/;

// The underscore that starts a literal `_xHHHH_`-shaped run already present in the text, which
// `decodeOoxmlEscapes` would otherwise mistake for one of ITS OWN escapes on the next read. The rest
// of the run is a LOOKAHEAD, so it is not consumed: in `_x0041_x0042_` the trailing underscore of
// the first run is the leading one of the second, and a pattern that consumed it escaped the first
// run only, which then read back as `_x0041B`. Both cases of hex are escaped although both
// decoders here accept only upper case, because Excel's own reader is not documented to agree.
const OOXML_ESCAPE_LOOKALIKE = /_(?=x[0-9A-Fa-f]{4}_)/g;

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
 * convention gets it back. So is a carriage return, which XML allows but a parser normalizes away
 * (`TEXT_ESCAPED_CHARS`); Excel writes it as `_x000D_` too. A literal `_xHHHH_`-shaped run already in the text is escaped first,
 * by escaping its own leading underscore as `_x005F_` (the OOXML convention Excel itself follows)
 * so `decodeOoxmlEscapes` reads it back unchanged on import instead of corrupting it into a
 * control character. Text that needs none of this is returned as it came in.
 */
export function escapeXmlText(text: string): string {
  if (!NEEDS_TEXT_ESCAPE.test(text)) {
    return text;
  }

  const withoutLookalikes = escapeMarkup(text).replace(OOXML_ESCAPE_LOOKALIKE, '_x005F_');

  return withoutLookalikes.replace(TEXT_ESCAPED_CHARS, (ch) => {
    const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');

    return `_x${hex}_`;
  });
}

/**
 * Escapes the markup characters only, and drops the characters XML 1.0 cannot carry at all. This
 * is the escaper for an attribute value and for FORMULA text (`<f>`, a conditional-formatting
 * `<formula>`, a validation `<formula1>`): those are `ST_Formula`, not `ST_Xstring`, and no reader
 * decodes the `_xHHHH_` convention there, so `escapeXmlText` would turn `"_x0041_"` into
 * `"_x005F_x0041_"` and a control character into a visible `_x0001_` inside the formula. A control
 * character is DROPPED rather than kept: it cannot be written raw, and a formula has no escape for
 * it - in a string literal Excel spells it `CHAR(1)`. A carriage return is kept raw: `_x000D_`
 * would be literal formula text, and a formula breaks a line with `CHAR(13)` anyway.
 */
export function escapeXmlMarkup(text: string): string {
  if (!NEEDS_MARKUP_ESCAPE.test(text)) {
    return text;
  }

  return escapeMarkup(text.replace(ILLEGAL_CHARS, ''));
}

/**
 * Escapes an attribute value. Illegal characters are dropped: an attribute never carries user
 * text that a round trip has to preserve. A tab, line feed or carriage return is written as a
 * character reference (`&#x9;`, `&#xA;`, `&#xD;`), because a parser's attribute-value
 * normalization turns the raw character into a space. The `_xHHHH_` convention is element text
 * only; no reader decodes it in an attribute.
 */
export function escapeXmlAttr(text: string): string {
  if (!NEEDS_ATTR_ESCAPE.test(text)) {
    return text;
  }

  return escapeXmlMarkup(text)
    .replace(ATTR_WHITESPACE, ch => `&#x${ch.charCodeAt(0).toString(16).toUpperCase()};`);
}

// The UTF-16 surrogate range, and where its high half ends. A lone escape inside it names no
// character, so it is left as written; a high escape directly followed by a low one is a pair.
const FIRST_SURROGATE = 0xD800;
const LAST_HIGH_SURROGATE = 0xDBFF;
const LAST_SURROGATE = 0xDFFF;

// One `_xHHHH_` escape, optionally followed by a second one in the low-surrogate range, so a
// high + low pair is matched (and decoded) as one unit.
const OOXML_ESCAPE = /_x([0-9A-F]{4})_(?:_x(D[C-F][0-9A-F]{2})_)?/g;

/**
 * Decodes one matched escape and the low-surrogate escape that may follow it.
 */
function decodeEscapeMatch(match: string, hex: string, lowHex: string | undefined): string {
  const code = Number.parseInt(hex, 16);

  if (code < FIRST_SURROGATE || code > LAST_SURROGATE) {
    // A low escape after a plain character is a lone surrogate, which stays literal.
    return String.fromCharCode(code) + (lowHex === undefined ? '' : `_x${lowHex}_`);
  }

  if (code <= LAST_HIGH_SURROGATE && lowHex !== undefined) {
    return String.fromCharCode(code, Number.parseInt(lowHex, 16));
  }

  return match;
}

/**
 * Decodes the `_xHHHH_` escapes a shared string or inline string may carry. A high-surrogate escape
 * directly followed by a low-surrogate one (`_xD83D__xDE00_`) decodes to the astral character the
 * pair encodes, the way ExcelJS reads it. A lone surrogate escape (`_xD800_`-`_xDFFF_` with no
 * partner, or a low one before a high one) is left as written, the way `decodeXmlEntities` leaves
 * `&#xD800;`: decoded, it would hand back an unpaired code unit that travels through the whole
 * import and comes out of `TextEncoder` as U+FFFD.
 */
export function decodeOoxmlEscapes(text: string): string {
  if (!text.includes('_x')) {
    return text;
  }

  return text.replace(OOXML_ESCAPE, decodeEscapeMatch);
}

/**
 * Whether a `<t>` needs `xml:space="preserve"` for its text to survive a strict parser.
 */
export function needsSpacePreserve(text: string): boolean {
  return /^\s|\s$|\n/.test(text);
}
