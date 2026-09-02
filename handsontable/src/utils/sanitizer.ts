import type { HotInstance } from '../core/types';
import type { SanitizerContext, SanitizerFn, TrustedHTMLLike } from '../core/settings';
import { HTML_CHARACTERS, SANITIZER_WARN_KEY, missingSanitizerMessage } from '../helpers/dom/element';
import { warnOnce } from '../helpers/console';

/**
 * Re-exported for the plugins that hold a resolved sanitizer (`dialog`, `notification`).
 *
 * Treat this as reachable by consumers, not sealed. The published `exports` map has no `./utils/*`
 * entry, but that only blocks subpath resolution under `node16` and `bundler`; classic
 * `moduleResolution: node` ignores `exports` entirely, and `tmp/utils/sanitizer.d.ts` is shipped
 * with no `files` field trimming it. So renaming or narrowing what this module exports can break a
 * consumer. `SanitizerContext` is published from `handsontable` itself, which is where users should
 * take it from.
 */
export type { SanitizerFn, TrustedHTMLLike } from '../core/settings';

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
 * @param {boolean} [warnWhenMissing] Whether an absent sanitizer should produce the one-time
 *   warning. Pass `false` from a read-only API: `true` and `false` both write raw HTML, and the
 *   only difference is the message. See below.
 * @returns {boolean|Function} The configured sanitizer, or `true`/`false` when none is set.
 */
export function getSanitizer(hot: HotInstance, warnWhenMissing = true): boolean | SanitizerFn {
  // `?? false` rather than `?? true` is the whole mechanism: `fastInnerHTML` treats `false` as a
  // deliberate raw write and stays silent, where `true` warns. The written HTML is identical, so a
  // read-only surface changes nothing about what it produces - it just stops telling the user that
  // "HTML content is being written to the DOM", which is not what `toHTML()` is doing.
  return hot.getSettings().sanitizer ?? warnWhenMissing;
}

/**
 * Sanitizes an HTML string for surfaces that build markup as a string instead of writing it
 * into an element through `fastInnerHTML` — the clipboard paste path and the nested-header
 * ghost table.
 *
 * A configured sanitizer sees every payload, markup or not, which is what the clipboard path has
 * always done. Only the missing-sanitizer warning is gated on markup. A caller that must match
 * `fastInnerHTML` exactly, where plain text never reaches the sanitizer at all, has to apply that
 * test itself before calling this. The nested-header ghost table does, so the label it measures is
 * treated the same way as the header that renders it.
 *
 * The warning is bound to `hot.rootElement`, the scope every other surface uses, so all of them
 * collapse into a single message per Handsontable instance.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} html The HTML string to sanitize.
 * @param {SanitizerContext} context The write surface, passed to the sanitizer and named in the warning.
 * @param {boolean} [warnWhenMissing] Whether an absent sanitizer should produce the one-time
 *   warning. Pass `false` from a read-only API, which is not writing to the DOM at all - see
 *   `getSanitizer()` for the same switch on the `fastInnerHTML` path.
 * @returns {string|object} The sanitized value - a `TrustedHTML` when the sanitizer returned one -
 *   or the input unchanged when no sanitizer is configured.
 */
export function sanitizeHTML(
  hot: HotInstance, html: string, context: SanitizerContext, warnWhenMissing = true
): string | TrustedHTMLLike {
  // An absent clipboard flavour reads as `''`. There is nothing to sanitize and nothing to warn
  // about, and calling the sanitizer would add a spurious entry to an auditing one on every paste.
  if (!html) {
    return html;
  }

  const { sanitizer } = hot.getSettings();

  // A configured sanitizer sees every payload, markup or not. Both callers behaved that way before
  // this helper existed, and a sanitizer is not always an XSS filter - it may cap length, normalize
  // whitespace, or record an audit entry, none of which it can do for input it never receives.
  if (typeof sanitizer === 'function') {
    return sanitizer(html, context) ?? '';
  }

  // The warning is the only part gated on markup: plain text cannot inject anything, so warning
  // about it would be noise on every grid that writes an ordinary label.
  if (warnWhenMissing && HTML_CHARACTERS.test(html)) {
    warnOnce(hot.rootElement, SANITIZER_WARN_KEY, missingSanitizerMessage(context));
  }

  return html;
}
