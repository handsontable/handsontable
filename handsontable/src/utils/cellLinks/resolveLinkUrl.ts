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
