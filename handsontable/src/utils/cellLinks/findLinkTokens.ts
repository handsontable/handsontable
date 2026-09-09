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
const SCHEME_PREFIX_PATTERN = /^(?:https?:\/\/|mailto:|tel:)/i;
const EMBEDDED_SCHEME_PATTERN = /https?:\/\/|mailto:|tel:/gi;
const TRAILING_PUNCTUATION_CHARS = new Set(['.', ',', ';', ':', '!', '?', '\'', '"']);
const BRACKET_PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/**
 * Counts how many of each bracket character (`(`, `)`, `[`, `]`, `{`, `}`) a token carries. Computed
 * once per token so `trimTokenEnd` never re-scans the string to answer "is this closer balanced".
 *
 * @param {string} token The raw match to tally.
 * @returns {Record<string, number>} The occurrence count of each bracket character.
 */
function tallyBrackets(token: string): Record<string, number> {
  const tally: Record<string, number> = { '(': 0, ')': 0, '[': 0, ']': 0, '{': 0, '}': 0 };

  for (const character of token) {
    if (character in tally) {
      tally[character] += 1;
    }
  }

  return tally;
}

/**
 * Strips the punctuation a URL picks up from the surrounding prose: trailing sentence punctuation,
 * and closing brackets that have no matching opener inside the URL. `Foo_(bar)` keeps its paren,
 * `(see https://a.com)` loses the one that closes the parenthetical.
 *
 * Works on an index into `token` rather than slicing a new string on every character, and the
 * bracket tally is computed once up front and only ever decremented - so a long run of trailing
 * punctuation or unbalanced brackets is a single linear pass, not a re-scan per character.
 *
 * @param {string} token The raw match.
 * @returns {string} The trimmed URL candidate.
 */
function trimTokenEnd(token: string): string {
  const bracketTally = tallyBrackets(token);
  let end = token.length;
  let changed = true;

  while (changed) {
    changed = false;

    while (end > 0 && TRAILING_PUNCTUATION_CHARS.has(token.charAt(end - 1))) {
      end -= 1;
      changed = true;
    }

    const last = end > 0 ? token.charAt(end - 1) : '';
    const opener = BRACKET_PAIRS[last];

    if (opener !== undefined && bracketTally[last] > bracketTally[opener]) {
      bracketTally[last] -= 1;
      end -= 1;
      changed = true;
    }
  }

  return token.slice(0, end);
}

/**
 * Checks that a trimmed candidate still carries a full scheme literal with at least one character
 * after it. Trailing-punctuation trimming can erode all the way through the scheme's own colon
 * (`tel::` becomes `tel`, `mailto:.` becomes `mailto`), and a bare scheme name would otherwise read
 * as a path segment relative to the base URL instead of being refused - this catches that before
 * `resolveLinkUrl` ever sees it.
 *
 * @param {string} candidate The trimmed URL candidate.
 * @returns {boolean} `true` when the candidate still has a resolvable scheme.
 */
function hasResolvableScheme(candidate: string): boolean {
  const schemeMatch = SCHEME_PREFIX_PATTERN.exec(candidate);

  return schemeMatch !== null && candidate.length > schemeMatch[0].length;
}

/**
 * Finds the offset of a second scheme literal inside an already-matched token, so two URLs joined
 * without whitespace (`https://a.com,https://b.com`) are cut apart instead of merging into one
 * garbled candidate. The search starts one character in, so the token's own leading scheme is never
 * reported as the "embedded" one.
 *
 * @param {string} rawToken The raw regex match, still carrying its own leading scheme.
 * @returns {number} The offset of the next scheme literal, or `-1` when there is none.
 */
function findEmbeddedSchemeIndex(rawToken: string): number {
  EMBEDDED_SCHEME_PATTERN.lastIndex = 1;

  const found = EMBEDDED_SCHEME_PATTERN.exec(rawToken);

  return found === null ? -1 : found.index;
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
    let rawToken = match[0];
    const embeddedSchemeIndex = findEmbeddedSchemeIndex(rawToken);

    if (embeddedSchemeIndex > 0) {
      rawToken = rawToken.slice(0, embeddedSchemeIndex);
      TOKEN_PATTERN.lastIndex = match.index + embeddedSchemeIndex;
    }

    const candidate = trimTokenEnd(rawToken);

    if (hasResolvableScheme(candidate)) {
      const href = resolveLinkUrl(candidate, baseUrl, schemes);

      if (href !== null) {
        tokens.push({ start: match.index, end: match.index + candidate.length, href });
      }
    }

    match = TOKEN_PATTERN.exec(text);
  }

  return tokens;
}
