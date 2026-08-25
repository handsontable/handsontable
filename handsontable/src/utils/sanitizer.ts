import type { HotInstance } from '../core/types';
import { HTML_CHARACTERS, SANITIZER_WARN_KEY } from '../helpers/dom/element';
import { warnOnce } from '../helpers/console';

/**
 * Signature of the `sanitizer` grid option. The second argument names the write surface,
 * so a sanitizer can apply different rules per context (for example, stricter for paste).
 */
export type SanitizerFn = (html: string, context: string) => string;

/**
 * Message shared by every missing-sanitizer warning, so the wording stays identical
 * no matter which surface raised it.
 *
 * @param {string} context The write surface that is about to receive raw HTML.
 * @returns {string} The warning message.
 */
function missingSanitizerMessage(context: string): string {
  return `HTML content is being written to the DOM ("${context}") without a sanitizer. ` +
    'Configure the "sanitizer" option to prevent XSS vulnerabilities.';
}

/**
 * Reads the grid-level `sanitizer` option in the form `fastInnerHTML` expects.
 *
 * Every call site that writes cell or header content through `fastInnerHTML` goes through this
 * helper, so they cannot drift apart on the fallback value or on how the option is looked up.
 * `true` is the fallback, which makes `fastInnerHTML` write raw HTML and warn once.
 *
 * The `html` cell type and `allowHtml` autocomplete sources deliberately do not use this helper:
 * they render raw HTML by design (see PR #7368) and pass `false` instead.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {boolean|Function} The configured sanitizer, or `true` when none is set.
 */
export function getSanitizer(hot: HotInstance): boolean | SanitizerFn {
  return hot.getSettings().sanitizer ?? true;
}

/**
 * Sanitizes an HTML string for surfaces that build markup as a string instead of writing it
 * into an element through `fastInnerHTML` — the clipboard paste path and the nested-header
 * ghost table.
 *
 * Plain text short-circuits on the same `HTML_CHARACTERS` test `fastInnerHTML` uses, so a grid
 * whose labels or clipboard payloads carry no markup never triggers the warning.
 *
 * The warning is bound to `hot.rootElement`, the scope every other surface uses, so all of them
 * collapse into a single message per Handsontable instance.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} html The HTML string to sanitize.
 * @param {string} context The write surface, passed to the sanitizer and named in the warning.
 * @returns {string} The sanitized string, or the input unchanged when no sanitizer is configured.
 */
export function sanitizeHTML(hot: HotInstance, html: string, context: string): string {
  if (!HTML_CHARACTERS.test(html)) {
    return html;
  }

  const { sanitizer } = hot.getSettings();

  if (typeof sanitizer === 'function') {
    return sanitizer(html, context);
  }

  warnOnce(hot.rootElement, SANITIZER_WARN_KEY, missingSanitizerMessage(context));

  return html;
}
