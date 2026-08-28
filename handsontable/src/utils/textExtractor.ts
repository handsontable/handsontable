import type { HotInstance } from '../core/types';
import type { SanitizerContext, TextExtractorContext, TextExtractorFn } from '../core/settings';

/**
 * Matches the only two characters that can make HTML text parsing change a string.
 *
 * Deliberately not `HTML_CHARACTERS` from `helpers/dom/element`: that one requires a closing `;` for
 * an entity, but the parser decodes the legacy named references without it, so `'A &amp B'` becomes
 * `'A & B'`. Skipping the parse on that input would write to a file something the grid never showed.
 */
const PARSEABLE_CHARACTERS = /[<&]/;

/**
 * Re-exported for parity with `utils/sanitizer.ts`, whose consumers hold a resolved function.
 *
 * Treat this as reachable by consumers, not sealed - the published `exports` map has no `./utils/*`
 * entry, but classic `moduleResolution: node` ignores `exports` entirely and `tmp/utils/*.d.ts` ships
 * untrimmed. `TextExtractorContext` is published from `handsontable` itself, which is where users
 * should take it from.
 */
export type { TextExtractorFn } from '../core/settings';

/**
 * Reads the grid-level `textExtractor` option.
 *
 * Every surface that needs a text projection of grid content goes through this module, so they
 * cannot drift apart on the fallback value or on how the option is looked up. `false` is the
 * fallback, which leaves content exactly as it is.
 *
 * @param {object} hot The Handsontable instance.
 * @returns {boolean|Function} The configured extractor, or `false` when none is set.
 */
export function getTextExtractor(hot: HotInstance): boolean | TextExtractorFn {
  const extractor = hot.getSettings().textExtractor;

  // Normalize rather than defaulting with `??`. A JavaScript caller can hand over any falsy value -
  // `0` from a `Number(flag)`, `''` from a form field - and only `null`/`undefined` would be
  // replaced, leaving a value that is not `false` to switch the extraction *on*.
  return extractor || false;
}

/**
 * Reduces an HTML string to the text a user would see if the grid rendered it.
 *
 * The configured `sanitizer` runs first, under the DOM surface the content belongs to. That is not
 * decoration: a sanitizer may delete text rather than only unwrap tags - an allowlist filter drops
 * `<script>alert()</script>` whole - so extracting from the unsanitized string would leak content
 * the grid never displayed.
 *
 * Parsing is also what converts entities back to the characters they stand for, so a header reading
 * `Tom &amp; Jerry` on screen lands in a file as `Tom & Jerry`. A regular expression cannot do that,
 * and {@link stripTags} cannot either - it scans characters rather than parsing, so a label such as
 * `'Loaded 5 < 10 rows'` loses everything from the `<` onwards.
 *
 * The markup is parsed inside a `<template>`, whose content belongs to an inert document: scripts do
 * not run and no resource is fetched, so a hostile string cannot act during extraction.
 *
 * @param {object} hot The Handsontable instance.
 * @param {string} html The HTML string to reduce.
 * @param {string} sanitizerContext The DOM surface passed to a configured `sanitizer`.
 * @returns {string} The text the grid would display.
 */
function extractDisplayText(hot: HotInstance, html: string, sanitizerContext: SanitizerContext): string {
  // Nothing to sanitize and nothing to parse. Guarding here also keeps an auditing or logging
  // sanitizer from recording an entry for every empty cell, which is why `sanitizeHTML` guards it
  // too - the nested-header export asks for one projection per layer cell, most of them empty.
  if (!html) {
    return html;
  }

  const { sanitizer } = hot.getSettings();
  // Read directly rather than through `sanitizeHTML()`: that helper warns when no sanitizer is
  // configured and the content carries markup, which is guidance about writing to the DOM. Repeating
  // it here would fire the warning during an export, where nothing is written to the DOM at all.
  const rendered = typeof sanitizer === 'function' ? sanitizer(html, sanitizerContext) ?? '' : html;

  // A string containing neither `<` nor `&` is a fixed point under HTML text parsing, so the parse
  // can only return it unchanged. Row headers are why this is worth checking: an export can carry
  // one per row, and almost all of them are ordinary text.
  if (!PARSEABLE_CHARACTERS.test(rendered)) {
    return rendered;
  }

  const template = hot.rootDocument.createElement('template');

  template.innerHTML = rendered;

  // `textContent` reports the source text of elements the browser never paints, so a header of
  // `'<script>alert(1)</script>Total'` displays as `Total` but would extract as `'alert(1)Total'`.
  // Dropping the non-rendered elements is what keeps the result equal to what is on screen. A
  // nested `<template>` needs no handling: its children live in its own `content` fragment, which
  // this one's `textContent` does not reach.
  template.content.querySelectorAll('script,style').forEach(element => element.remove());

  return template.content.textContent ?? '';
}

/**
 * Projects a grid value into the form a non-DOM consumer needs, following the `textExtractor` option.
 *
 * This is the extension point: a plugin that hands grid content to a file, the clipboard, a printer
 * or an assistive technology calls this with a context of its own, and inherits whatever policy the
 * user configured. No change to the option or to core is needed to add a consumer.
 *
 * Values that are not strings are returned untouched. Only a string can carry markup, and a
 * spreadsheet cell needs the number `42` rather than the text `"42"`.
 *
 * @param {object} hot The Handsontable instance.
 * @param {*} value The value to project.
 * @param {string} context The consumer surface, passed to a configured extractor function.
 * @param {string} [sanitizerContext='header'] The DOM surface the content belongs to, passed to a
 *   configured `sanitizer` when the built-in extraction runs. Every surface shipping today renders
 *   as a header; a consumer of other content passes its own.
 * @returns {*} The projected value, or the input unchanged when no extractor applies.
 */
export function extractText<T>(
  hot: HotInstance,
  value: T,
  context: TextExtractorContext,
  sanitizerContext: SanitizerContext = 'header'
): T | string {
  const extractor = getTextExtractor(hot);

  if (extractor === false || typeof value !== 'string') {
    return value;
  }

  if (typeof extractor === 'function') {
    return extractor(value, context) ?? '';
  }

  return extractDisplayText(hot, value, sanitizerContext);
}
