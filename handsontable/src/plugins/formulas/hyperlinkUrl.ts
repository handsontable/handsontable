/**
 * URL schemes a `HYPERLINK` cell may link to. Everything outside this list is refused, which is what
 * keeps `javascript:`, `data:` and `vbscript:` payloads out of the anchor's `href`. Default
 * sanitization is a pass-through in this codebase, so the guard cannot be delegated to a sanitizer.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Resolves the URL of a `HYPERLINK` cell against the host document, and refuses anything that is not
 * a navigable link.
 *
 * The URL is parsed instead of pattern-matched, so obfuscations that survive a string comparison
 * (`JaVaScRiPt:`, `java\tscript:`, leading whitespace) are normalized before the protocol is read.
 *
 * @param {string} rawUrl The URL as reported by the formula engine.
 * @param {string} baseUrl The document URL that relative URLs are resolved against.
 * @returns {string|null} The resolved absolute URL, or `null` when the cell must not become a link.
 */
export function resolveHyperlinkUrl(rawUrl: string, baseUrl: string): string | null {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return null;
  }

  let url: URL;

  try {
    url = new URL(rawUrl, baseUrl);
  } catch (error) {
    return null;
  }

  return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
}
