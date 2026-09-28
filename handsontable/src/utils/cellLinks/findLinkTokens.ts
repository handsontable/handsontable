import { LINK_SCHEMES, resolveLinkUrl, type LinkScheme } from './resolveLinkUrl';
import { isKnownTld } from './tlds';

/**
 * A half-open offset range into the scanned text.
 */
export interface Span {
  /**
   * Offset of the first character of the range.
   */
  start: number;
  /**
   * Offset one past the last character of the range.
   */
  end: number;
}

/**
 * A URL found inside a text, as offsets into that text plus the resolved `href`.
 */
export interface LinkToken extends Span {
  /**
   * The resolved absolute URL.
   */
  href: string;
}

// The scheme set is fixed here on purpose: a `javascript:` payload never matches, so there is
// nothing to refuse later. The character class stops at whitespace and at the delimiters that
// commonly wrap a URL in prose. `https?://` is matched unconditionally - a literal `://` glued to a
// word is not a plausible non-URL word, so linking it is harmless. `mailto:`/`tel:` carry a
// lookbehind instead: on its own the bare scheme word appears inside ordinary prose
// ("Grand Hotel:Warsaw" must not yield "tel:Warsaw", "see xmailto:a@b.com" must not link), so the
// scheme is only recognized where a URL word cannot already be continuing - the same rule
// `EMBEDDED_SCHEME_PATTERN` below uses to find a *second*, embedded scheme.
// The lookbehind classes below use `\p{L}\p{N}\p{M}` (Unicode letters, digits and combining marks)
// rather than the ASCII `A-Za-z0-9`, with the `u` flag every one of these regexes now carries. An
// ASCII-only class treats a non-ASCII letter as a non-word character, so a match is free to start
// mid-word right after it ("münchen.de" -> "nchen.de", "hôtel:Nice" -> "tel:Nice") - wrong in every
// mode, and in `strict: false` a `mailto:` candidate can even truncate into someone else's inbox
// ("józef@firma.pl" -> "mailto:zef@firma.pl"). `\p{M}` covers an NFD-decomposed accent (a combining
// mark is its own code point there), which `\p{L}` alone would miss. `LABEL` and the email local-part
// class deliberately stay ASCII: this only turns a wrong link into no link, never into a correct one -
// IDN/punycode support is out of scope.
// Every lookbehind class below also excludes both path separators, `/` and `\`: without the
// backslash a Windows path reads as a URL word boundary rather than as a continuation of it, so under
// `strict: false` `C:\example.com` and `C:\Users\example.com\file` both linkify to
// `https://example.com/` - the backslash is excluded for the same reason `/` already is.
const TOKEN_PATTERN = /(?:https?:\/\/|(?<![\p{L}\p{N}\p{M}._~+\\-])(?:mailto:|tel:))[^\s<>"'`]+/giu;
const SCHEME_PREFIX_PATTERN = /^(?:https?:\/\/|mailto:|tel:)/i;
// Two different rules for the two families of embedded scheme. An embedded `http://`/`https://`
// splits unless it is immediately preceded by a `/`: a literal `://` inside a path is not a
// plausible URL word (unlike "/hotel:deals"), so `https://a.com/xhttps://b.com/y` and
// `See https://a.com,https://b.com end` are two glued URLs each, never one with a garbled path -
// but a `/` right before it means the scheme is itself a path segment of the outer URL
// (`https://web.archive.org/web/2020/https://example.com` stays one token, href unchanged), which
// is also why a redirect-style URL (`?url=https://b.com`) still splits at the `=` by design: `=` is
// not a `/`. `mailto:`/`tel:` keep the narrower lookbehind: it requires the embedded scheme to start
// where a URL word cannot continue, so a path segment that merely contains a scheme word
// ("/hotel:deals", "/wiki/Tel:Aviv", "/x-mailto:y") is not mistaken for a second, joined URL, and
// the excluded class now also covers `/` for the same reason as the `https?://` branch.
// The hyphen sits last in this class, not between `+` and `/`: inside `[...]`, `+-/` is a RANGE from
// `+` (0x2B) to `/` (0x2F) - which also swallows `,` (0x2C) - not three literal characters. Putting
// `-` last (`[...+/-]`) keeps it literal, so this class excludes exactly the URL word characters
// plus `/`, nothing more.
const EMBEDDED_SCHEME_PATTERN = /(?:(?<![/\\])https?:\/\/|(?<![\p{L}\p{N}\p{M}._~+/\\-])(?:mailto:|tel:))/giu;
// A quote is not in this set: `TOKEN_PATTERN`'s character class already excludes `"` and `'`, so a
// raw token can never carry one and a quote-trimming entry here would be unreachable.
const TRAILING_PUNCTUATION_CHARS = new Set(['.', ',', ';', ':', '!', '?']);
const BRACKET_PAIRS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

// `strict: false` only. A DNS label: 1-63 characters, letters/digits/hyphen, never starting or
// ending on a hyphen - the same shape `BARE_DOMAIN_PATTERN` repeats once per label and
// `BARE_EMAIL_PATTERN` repeats for the host part after `@`.
const LABEL = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
// A candidate that carries no scheme of its own: one or more `label.` groups, a final TLD-shaped
// group (letters only - digits are never a real TLD, which is what keeps an IP address or a
// version string like `1.2.3` from matching at all), an optional port, and an optional path/query/
// fragment. The lookbehind blocks a match from starting inside a longer word, an email's local part,
// or a URL that already carries a scheme (`foo.example.com` inside `https://foo.example.com` cannot
// start here, since the character right before it, `/`, is excluded). The TLD captured here is
// provisional - `toDomainToken` re-derives and validates it after `trimTokenEnd` runs, because
// trimming can shorten the tail.
// The WHOLE host - `(?:LABEL\.)+[A-Za-z]{2,63}`, not only its final label - is written as
// `(?=(...))\1`, a lookahead capture plus an immediate backreference, to emulate an atomic group (JS
// has none natively): the lookahead greedily captures the longest run the host shape allows and the
// backreference then requires that EXACT text, so the engine can never retry with a shorter host at
// this position. That matters for the `(?!:\d{6,})` lookahead right after it, which refuses the WHOLE
// candidate when a colon is followed by six or more digits (an out-of-range port) rather than letting
// it degrade into a shorter, truncated match: without the atomic emulation, `\d{1,5}(?!\d)` in the
// port group below correctly fails to consume any of an overlong run, the `(?!:\d{6,})` lookahead then
// fails too, and plain backtracking shrinks the host instead of refusing the candidate.
//
// An EARLIER version of this pattern made only the FINAL label atomic (`(?:LABEL\.)+(?=(TLD))\1`),
// which fixed the single-label case (`example.com:123456` no longer backtracks "com" into "co") but
// left `(?:LABEL\.)+` itself free to backtrack, dropping a WHOLE LEADING LABEL to satisfy the
// lookahead instead: `www.google.co.uk:123456` backtracked to `www.google.co` (a valid host, "co"
// being Colombia's ccTLD) and linked `https://www.google.co/`; `mail.google.com:987654` backtracked to
// `mail.google` (".google" is itself a delegated gTLD) and linked `https://mail.google/`, from a text
// that named no such host. Wrapping the WHOLE host in the lookahead/backreference pair closes that:
// `(?:LABEL\.)+[A-Za-z]{2,63}` is captured and re-asserted as one unit, so there is no shorter host
// substring left for backtracking to fall back to - the candidate is refused outright instead.
const BARE_DOMAIN_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}\\p{M}@._~+/\\\\-])(?=((?:${LABEL}\\.)+[A-Za-z]{2,63}))\\1(?!:\\d{6,})(?::\\d{1,5}(?!\\d))?` +
    '(?:[/?#][^\\s<>"\'`]*)?',
  'gu'
);
// A bare email candidate: an RFC-5322-ish local part, `@`, then the same label-dot-TLD shape as
// `BARE_DOMAIN_PATTERN`, with no port or path (an email address never carries one). The lookbehind
// keeps a match from starting mid-word, the same way the domain pattern's does.
const BARE_EMAIL_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}\\p{M}._%+\\\\-])[A-Za-z0-9._%+-]+@(?:${LABEL}\\.)+([A-Za-z]{2,63})`, 'gu'
);
// Splits a trimmed bare candidate's host from a trailing port/path/query/fragment - `toDomainToken`
// and `toEmailToken` both re-derive the TLD from what remains before this separator.
const HOST_SUFFIX_PATTERN = /[:/?#]/;
const TRAILING_LETTERS_PATTERN = /[A-Za-z]+$/;

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
 * The result of one scanning pass: the tokens it actually produced, plus the span of every candidate
 * it considered along the way - including one it went on to refuse. A later pass treats the LATTER as
 * claimed too, not only the former, so a refused candidate's leftover text is never picked up by a
 * different pass as if the refusal had never happened.
 */
interface ScanResult {
  /**
   * The tokens this pass produced.
   */
  tokens: LinkToken[];
  /**
   * The span of every candidate this pass considered, whether it became a token or was refused.
   */
  consideredSpans: Span[];
}

/**
 * Finds every scheme-carrying URL in a text (`http(s)://`, `mailto:`, `tel:`). Each candidate is
 * trimmed of surrounding punctuation and then passed through `resolveLinkUrl`, so a token that does
 * not parse, or whose scheme is not allowed (a caller-narrowed `schemes`), is dropped rather than
 * linked - but its span is still reported in `consideredSpans`, so a `strict: false` bare pass never
 * links the leftover tail of a scheme the caller deliberately excluded (`tel:example.com` with
 * `schemes: ['https']` must not still link `example.com`). This is the whole of `findLinkTokens`'s
 * `strict: true` behavior - kept as its own function so that path stays provably unchanged by the
 * `strict: false` bare-domain/bare-email pass added below it.
 *
 * @param {string} text The text to scan.
 * @param {string} baseUrl The document URL the candidates are resolved against.
 * @param {LinkScheme[]} schemes The schemes allowed by the caller.
 * @returns {ScanResult} The tokens, in document order (they never overlap), plus every considered span.
 */
function findSchemeTokens(text: string, baseUrl: string, schemes: readonly LinkScheme[]): ScanResult {
  const tokens: LinkToken[] = [];
  const consideredSpans: Span[] = [];

  if (text.indexOf(':') === -1) {
    return { tokens, consideredSpans };
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
      const span = { start: match.index, end: match.index + candidate.length };

      consideredSpans.push(span);

      const href = resolveLinkUrl(candidate, baseUrl, schemes);

      if (href !== null) {
        tokens.push({ ...span, href });
      }
    }

    match = TOKEN_PATTERN.exec(text);
  }

  return { tokens, consideredSpans };
}

/**
 * Whether a raw regex match's span overlaps any of a set of already-claimed token spans. `strict:
 * false` uses this to keep a bare-domain or bare-email candidate from being linked a second time when
 * it is really a fragment of a URL (or, for a domain, an email) that already produced its own token -
 * `foo.example.com` inside `https://foo.example.com` is the domain case, and the domain half of an
 * already-linked email address is the email case.
 *
 * @param {number} start The candidate's start offset into the text.
 * @param {number} end The candidate's end offset into the text.
 * @param {Span[]} claimed The spans the candidate must not overlap.
 * @returns {boolean} `true` when the candidate overlaps a claimed span.
 */
function overlapsClaimedSpan(start: number, end: number, claimed: readonly Span[]): boolean {
  return claimed.some(span => start < span.end && end > span.start);
}

/**
 * Re-derives the top-level domain of a trimmed bare-domain or bare-email host, from what actually
 * survives trimming - `trimTokenEnd` can shorten the tail, so the TLD captured by the original regex
 * match is not trusted as-is.
 *
 * @param {string} host The candidate's host part: for an email, everything after the `@`; for a
 * domain, the whole trimmed candidate (a trailing port or path is stripped here).
 * @returns {string|null} The lowercase TLD, or `null` when the host does not end in a letters-only
 * run.
 */
function deriveTld(host: string): string | null {
  const hostSuffixIndex = host.search(HOST_SUFFIX_PATTERN);
  const hostOnly = hostSuffixIndex === -1 ? host : host.slice(0, hostSuffixIndex);
  const match = TRAILING_LETTERS_PATTERN.exec(hostOnly);

  return match === null ? null : match[0].toLowerCase();
}

/**
 * Turns one raw `BARE_DOMAIN_PATTERN` match into a token: trims it, re-derives and validates its TLD
 * against the bundled IANA list, and resolves it as an `https://` URL.
 *
 * @param {string} rawMatch The raw regex match.
 * @param {number} matchIndex The match's offset into the original text.
 * @param {string} baseUrl The document URL to resolve against.
 * @param {LinkScheme[]} schemes The schemes allowed by the caller - `https` absent disables
 * every bare domain, since a bare domain always resolves as `https`.
 * @returns {LinkToken|null} The token, or `null` when the candidate is not linkable.
 */
function toDomainToken(
  rawMatch: string, matchIndex: number, baseUrl: string, schemes: readonly LinkScheme[]
): LinkToken | null {
  const candidate = trimTokenEnd(rawMatch);
  const tld = candidate === '' ? null : deriveTld(candidate);

  if (tld === null || !isKnownTld(tld)) {
    return null;
  }

  const href = resolveLinkUrl(`https://${candidate}`, baseUrl, schemes);

  return href === null ? null : { start: matchIndex, end: matchIndex + candidate.length, href };
}

/**
 * Turns one raw `BARE_EMAIL_PATTERN` match into a token, the same way {@link toDomainToken} turns a
 * domain match into one: trims it, re-derives and validates the TLD of the part after `@`, and
 * resolves it as a `mailto:` URL.
 *
 * @param {string} rawMatch The raw regex match.
 * @param {number} matchIndex The match's offset into the original text.
 * @param {string} baseUrl The document URL to resolve against.
 * @param {LinkScheme[]} schemes The schemes allowed by the caller - `mailto` absent disables
 * every bare email address.
 * @returns {LinkToken|null} The token, or `null` when the candidate is not linkable.
 */
function toEmailToken(
  rawMatch: string, matchIndex: number, baseUrl: string, schemes: readonly LinkScheme[]
): LinkToken | null {
  const candidate = trimTokenEnd(rawMatch);
  const atIndex = candidate.indexOf('@');

  if (atIndex === -1) {
    return null;
  }

  const tld = deriveTld(candidate.slice(atIndex + 1));

  if (tld === null || !isKnownTld(tld)) {
    return null;
  }

  const href = resolveLinkUrl(`mailto:${candidate}`, baseUrl, schemes);

  return href === null ? null : { start: matchIndex, end: matchIndex + candidate.length, href };
}

/**
 * Runs one bare-token pattern over the whole text, keeping only the matches that land outside every
 * already-claimed span, and converts each survivor into a token. A match that `toToken` goes on to
 * refuse (an unknown TLD, for example) still has its span reported in `consideredSpans` - a rejected
 * bare-email candidate's local part must not then be linked as a bare domain, which is what claiming
 * only the converted tokens used to allow (`john.uk@intranet.lan` linking `john.uk`).
 *
 * @param {RegExp} pattern `BARE_EMAIL_PATTERN` or `BARE_DOMAIN_PATTERN` - reset to `lastIndex = 0`
 * here, since both are shared, stateful `g`-flagged regexes.
 * @param {string} text The text to scan.
 * @param {string} baseUrl The document URL to resolve against.
 * @param {LinkScheme[]} schemes The schemes allowed by the caller.
 * @param {Span[]} claimed The spans a match may not overlap.
 * @param {Function} toToken Converts one raw, non-overlapping match into a token. Takes the raw match,
 * its offset into the original text, the document URL to resolve against, and the allowed schemes;
 * returns a `LinkToken`, or `null` when the candidate is not linkable.
 * @returns {ScanResult} The tokens, in document order, plus every considered span.
 */
function scanBarePattern(
  pattern: RegExp,
  text: string,
  baseUrl: string,
  schemes: readonly LinkScheme[],
  claimed: readonly Span[],
  toToken: (rawMatch: string, matchIndex: number, baseUrl: string, schemes: readonly LinkScheme[]) => LinkToken | null
): ScanResult {
  const tokens: LinkToken[] = [];
  const consideredSpans: Span[] = [];

  pattern.lastIndex = 0;

  let match = pattern.exec(text);

  while (match !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    if (!overlapsClaimedSpan(start, end, claimed)) {
      consideredSpans.push({ start, end });

      const token = toToken(match[0], match.index, baseUrl, schemes);

      if (token !== null) {
        tokens.push(token);
      }
    }

    match = pattern.exec(text);
  }

  return { tokens, consideredSpans };
}

/**
 * Finds every linkable URL in a text: the scheme-carrying kind always, and - when `strict` is
 * `false` - a bare domain (`example.com`, linked as `https`) or a bare email address
 * (`jane@example.com`, linked as `mailto`) too, wherever one sits outside a span a scheme token
 * already claimed. Email addresses are matched before domains, and a domain match is dropped when it
 * overlaps either an already-found scheme token OR an already-found email token - so the domain half
 * of an email address is never linked again on its own. Every bare TLD is validated against the
 * bundled IANA list (`./tlds.ts`).
 *
 * @param {string} text The text to scan.
 * @param {string} baseUrl The document URL the candidates are resolved against.
 * @param {LinkScheme[]} [schemes] The schemes allowed by the caller.
 * @param {boolean} [strict] `true` (default) links only URLs that carry a scheme. `false` also links
 * bare domains and bare email addresses.
 * @returns {LinkToken[]} The tokens in document order. They never overlap.
 */
export function findLinkTokens(
  text: string, baseUrl: string, schemes: readonly LinkScheme[] = LINK_SCHEMES, strict = true
): LinkToken[] {
  if (typeof text !== 'string') {
    return [];
  }

  const schemeScan = findSchemeTokens(text, baseUrl, schemes);

  if (strict) {
    return schemeScan.tokens;
  }

  // Every pass below claims by CONSIDERED span, not only by produced token: a scheme candidate the
  // caller's `schemes` refused, or a bare-email candidate whose TLD did not validate, still blocks a
  // later pass from linking whatever text sits inside its span.
  const emailScan = scanBarePattern(
    BARE_EMAIL_PATTERN, text, baseUrl, schemes, schemeScan.consideredSpans, toEmailToken
  );
  const claimedByEmail = [...schemeScan.consideredSpans, ...emailScan.consideredSpans];
  const domainScan = scanBarePattern(BARE_DOMAIN_PATTERN, text, baseUrl, schemes, claimedByEmail, toDomainToken);

  return [...schemeScan.tokens, ...emailScan.tokens, ...domainScan.tokens]
    .sort((tokenA, tokenB) => tokenA.start - tokenB.start);
}
