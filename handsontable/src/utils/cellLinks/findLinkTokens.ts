import { LINK_SCHEMES, resolveLinkUrl, type LinkScheme } from './resolveLinkUrl';

/**
 * A URL found inside a text, as offsets into that text plus the resolved `href`.
 */
export interface LinkToken {
  /**
   * Offset of the first character of the URL.
   */
  start: number;
  /**
   * Offset one past the last character of the URL.
   */
  end: number;
  /**
   * The resolved absolute URL.
   */
  href: string;
}

// The scheme set is fixed here on purpose: a `javascript:` payload never matches, so there is
// nothing to refuse later. The character class stops at whitespace and at the delimiters that
// commonly wrap a URL in prose.
const TOKEN_PATTERN = /(?:https?:\/\/|mailto:|tel:)[^\s<>"'`]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;
const BRACKET_PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/**
 * Counts the occurrences of one character in a string.
 *
 * @param {string} text The text to scan.
 * @param {string} character The character to count.
 * @returns {number} The number of occurrences.
 */
function countCharacter(text: string, character: string): number {
  return text.split(character).length - 1;
}

/**
 * Strips the punctuation a URL picks up from the surrounding prose: trailing sentence punctuation,
 * and closing brackets that have no matching opener inside the URL. `Foo_(bar)` keeps its paren,
 * `(see https://a.com)` loses the one that closes the parenthetical.
 *
 * @param {string} token The raw match.
 * @returns {string} The trimmed URL candidate.
 */
function trimTokenEnd(token: string): string {
  let result = token;
  let previous = '';

  while (result !== previous) {
    previous = result;
    result = result.replace(TRAILING_PUNCTUATION, '');

    const last = result.charAt(result.length - 1);
    const opener = BRACKET_PAIRS[last];

    if (opener !== undefined && countCharacter(result, last) > countCharacter(result, opener)) {
      result = result.slice(0, -1);
    }
  }

  return result;
}

/**
 * Finds every linkable URL in a text. Each candidate is trimmed of surrounding punctuation and then
 * passed through `resolveLinkUrl`, so a token that does not parse, or whose scheme is not allowed,
 * is dropped rather than linked.
 *
 * @param {string} text The text to scan.
 * @param {string} baseUrl The document URL the candidates are resolved against.
 * @param {LinkScheme[]} [schemes] The schemes allowed by the caller.
 * @returns {LinkToken[]} The tokens in document order. They never overlap.
 */
export function findLinkTokens(
  text: string, baseUrl: string, schemes: readonly LinkScheme[] = LINK_SCHEMES
): LinkToken[] {
  const tokens: LinkToken[] = [];

  if (typeof text !== 'string' || text.indexOf(':') === -1) {
    return tokens;
  }

  TOKEN_PATTERN.lastIndex = 0;

  let match = TOKEN_PATTERN.exec(text);

  while (match !== null) {
    const candidate = trimTokenEnd(match[0]);

    if (candidate.length > 0) {
      const href = resolveLinkUrl(candidate, baseUrl, schemes);

      if (href !== null) {
        tokens.push({ start: match.index, end: match.index + candidate.length, href });
      }
    }

    match = TOKEN_PATTERN.exec(text);
  }

  return tokens;
}
