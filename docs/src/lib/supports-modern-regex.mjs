/**
 * Detects RegExp features that require Safari 16.4+ (iOS 16.4+), including named
 * capture groups and lookbehind. Older WebKit throws SyntaxError at parse time when
 * a dependency bundle contains those patterns.
 */
/** @type {boolean | null} */
let cached = null;

export function supportsModernRegex() {
  if (cached !== null) {
    return cached;
  }

  try {
    // eslint-disable-next-line prefer-regex-literals
    new RegExp('(?<x>x)');
    cached = true;
  } catch {
    cached = false;
  }

  return cached;
}
