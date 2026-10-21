import type { HotInstance } from '../core/types';
import type { SanitizerContext, TextExtractorContext, TextExtractorFn } from '../core/settings';

import { HTML_CHARACTERS } from '../helpers/dom/element';

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
 * Inert is not the same as policy-free. Assigning to `innerHTML` is a Trusted Types sink even on a
 * `<template>`, so under `require-trusted-types-for 'script'` this throws unless the `sanitizer`
 * returns a `TrustedHTML`. That is the same boundary `fastInnerHTML` has, gated on the same
 * `HTML_CHARACTERS` predicate and the same content, and it is reachable only when the user opts in
 * with `textExtractor: true`.
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

  // The same predicate `fastInnerHTML` uses, and it has to stay the same one. That function parses
  // only content matching `HTML_CHARACTERS` - a complete tag, or an entity closed by `;` - and
  // writes everything else as literal text without consulting the sanitizer. A header of `'A<B'`
  // therefore shows those three characters on screen; parsing it here would send `'A'` to the file.
  // Testing the raw string, before the sanitizer, is part of the mirror.
  if (!HTML_CHARACTERS.test(html)) {
    return html;
  }

  const { sanitizer } = hot.getSettings();
  // Read directly rather than through `sanitizeHTML()`: that helper warns when no sanitizer is
  // configured and the content carries markup, which is guidance about writing to the DOM. Repeating
  // it here would fire the warning during an export, where nothing is written to the DOM at all.
  const rendered = typeof sanitizer === 'function' ? sanitizer(html, sanitizerContext) ?? '' : html;

  if (rendered === '') {
    // A sanitizer that stripped the payload entirely leaves nothing to parse, and there is no
    // harmless way to ask for it: `innerHTML = ''` is a Trusted Types sink whatever the value, so
    // under `require-trusted-types-for 'script'` the empty string throws and takes the export down.
    return '';
  }

  const template = hot.rootDocument.createElement('template');

  // The sanitizer's value reaches the sink exactly as returned, the same rule `fastInnerHTML`
  // follows: a page enforcing Trusted Types hands back a `TrustedHTML`, which the sink accepts and
  // a plain string is rejected in place of, so this must never coerce, concatenate, or re-test the
  // value. The cast is only for the DOM lib's `string` typing; `TrustedHTML` is absent from it at
  // this TypeScript version.
  template.innerHTML = rendered as string;

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
