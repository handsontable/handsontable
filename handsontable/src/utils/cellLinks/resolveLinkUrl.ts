/**
 * A URL scheme the grid may link a cell to.
 */
export type LinkScheme = 'http' | 'https' | 'mailto' | 'tel';

/**
 * URL schemes a grid-made cell link may point at. Everything outside this list is refused, which is
 * what keeps `javascript:`, `data:` and `vbscript:` payloads out of the anchor's `href`. Default
 * sanitization is a pass-through in this codebase, so the guard cannot be delegated to a sanitizer.
 */
export const LINK_SCHEMES: readonly LinkScheme[] = ['http', 'https', 'mailto', 'tel'];

/**
 * Narrows a user-provided `schemes` value to the fixed allowlist. Anything that is not an array
 * means "all allowed schemes"; unknown entries and duplicates are dropped, so the result can only
 * ever be a subset of `LINK_SCHEMES`.
 *
 * @param {unknown} value The raw `schemes` setting.
 * @returns {LinkScheme[]} The allowed schemes, in allowlist order.
 */
export function normalizeSchemes(value: unknown): LinkScheme[] {
  if (!Array.isArray(value)) {
    return [...LINK_SCHEMES];
  }

  return LINK_SCHEMES.filter(scheme => value.includes(scheme));
}

/**
 * Narrows a user-provided `schemes` value against a caller-supplied fallback, instead of always
 * falling back to the full allowlist the way `normalizeSchemes` does.
 *
 * An EXPLICIT empty array is honored as-is: the author asked for no schemes, and that request is not
 * second-guessed. A non-empty array whose entries do not match any entry of `LINK_SCHEMES` normalizes
 * to an empty array in `normalizeSchemes`, and an empty array read from a non-empty one is a mistake
 * here (a typo, for instance), not "no schemes" - so it falls back to `fallback` instead of failing
 * closed. A partially valid array narrows to its recognized entries only. Anything that is not an
 * array, including `undefined`, also falls back to `fallback`.
 *
 * @param {unknown} value The raw `schemes` setting.
 * @param {LinkScheme[]} fallback The schemes to fall back to when `value` is missing, is not an
 * array, or is a non-empty array with no recognized entry.
 * @returns {LinkScheme[]} The resolved schemes.
 */
export function normalizeSchemesWithFallback(
  value: unknown, fallback: readonly LinkScheme[]
): readonly LinkScheme[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  if (value.length === 0) {
    return [];
  }

  const normalized = normalizeSchemes(value);

  return normalized.length === 0 ? fallback : normalized;
}

/**
 * Resolves the URL of a cell link against the host document, and refuses anything that is not a
 * navigable link.
 *
 * The URL is parsed instead of pattern-matched, so obfuscations that survive a string comparison
 * (`JaVaScRiPt:`, `java\tscript:`, leading whitespace) are normalized before the protocol is read.
 *
 * @param {string} rawUrl The URL as found in the cell or reported by the formula engine.
 * @param {string} baseUrl The document URL that relative URLs are resolved against.
 * @param {LinkScheme[]} [schemes] The schemes allowed by the caller. Narrows the allowlist, never widens it.
 * @returns {string|null} The resolved absolute URL, or `null` when the cell must not become a link.
 */
export function resolveLinkUrl(
  rawUrl: string, baseUrl: string, schemes: readonly LinkScheme[] = LINK_SCHEMES
): string | null {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return null;
  }

  let url: URL;

  try {
    url = new URL(rawUrl, baseUrl);
  } catch (error) {
    return null;
  }

  const scheme = url.protocol.slice(0, -1) as LinkScheme;

  if (!LINK_SCHEMES.includes(scheme) || !schemes.includes(scheme)) {
    return null;
  }

  return url.href;
}
