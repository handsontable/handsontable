/**
 * Numeric attribute readers for the native adapter's parts. `Number()` is the wrong parser for a
 * file's attribute text: it accepts `''` (as 0), `'0x10'` (as 16), surrounding whitespace,
 * `'Infinity'` and any fraction or exponent, and a reader that takes its answer as a row index or a
 * span length then indexes `rows[1.5]` or walks to `Infinity`. These follow the XML Schema lexical
 * forms the OOXML schema declares instead.
 */

// `xsd:unsignedInt`: decimal digits, an optional leading `+`, no sign, point or exponent.
const UNSIGNED_INT = /^\+?\d{1,15}$/;

// `xsd:double` without `INF`/`NaN` (no attribute this adapter reads may be non-finite): an
// optional sign, digits with an optional point (or a point and digits), an optional exponent.
const FINITE_DOUBLE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Reads an `xsd:unsignedInt` attribute, or answers `null` when the text is not one. Leading zeros
 * are accepted, as the schema allows; more than 15 digits is never a count this adapter could use
 * and could lose integer precision, so it answers `null` too.
 */
export function parseUnsignedIntAttr(text: string | undefined): number | null {
  if (text === undefined || !UNSIGNED_INT.test(text)) {
    return null;
  }

  return Number(text);
}

/**
 * Reads a finite `xsd:double` attribute, or answers `null` when the text is not one (including an
 * empty one, a hexadecimal one, or one that overflows to `Infinity`).
 */
export function parseFiniteDoubleAttr(text: string | undefined): number | null {
  if (text === undefined || !FINITE_DOUBLE.test(text)) {
    return null;
  }

  const value = Number(text);

  return Number.isFinite(value) ? value : null;
}
