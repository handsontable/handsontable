// Markup escaping shared by everything in this package that writes HTML by string concatenation:
// the self-contained report and the gh-pages history index. One implementation so the two pages
// cannot drift on which characters are escaped.

/**
 * Escapes a value interpolated into markup (text or a double- or single-quoted attribute).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
