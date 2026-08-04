import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// postcss is not a direct dependency of docs/ (pnpm keeps transitive deps out of
// docs/node_modules), but vite is - and vite always ships postcss. Resolve it
// through vite's own dependency chain.
const postcss = require(require.resolve('postcss', { paths: [require.resolve('vite')] }));

/**
 * File-path fragments whose stylesheets must NOT be rewritten. Handsontable's own
 * CSS is the library under test - rewriting its rules here would fake an
 * engine-side fix at the docs level. `handsontable-import.css` is listed
 * explicitly because vite inlines its `@import` of the built HT CSS into the
 * docs module id before this transform runs.
 */
const EXCLUDED_ID_FRAGMENTS = [
  'handsontable/tmp/',
  'handsontable/styles/',
  '@handsontable/',
  'handsontable-import.css',
];

/**
 * A selector that contains any of these is driven by live user interaction or
 * runtime element state. Replacing its `:has()` with a JS-stamped class would
 * need per-event restamping to look right, so such selectors are left alone.
 * They are cheap to keep: hover/focus-driven `:has()` rules do not fire on
 * scroll-driven DOM mutations.
 */
const DYNAMIC_STATE_PATTERN =
  /:hover|:focus|:active\b|:checked|:target\b|:popover-open|:empty|:placeholder-shown|:autofill|\[open\]|:enabled|:disabled/;

/**
 * The class and CSS-custom-property prefix shared with the client runtime
 * (`has-fallback-runtime.mjs`). A rewritten rule matches `.ht-nohas-<hash>`;
 * the manifest entry that tells the runtime what to stamp is served as
 * `--ht-nohas-<hash>: "<selector>"` on `:root`.
 */
const FALLBACK_PREFIX = 'ht-nohas-';

/**
 * Hashes a string into a short base36 token (djb2). Deterministic, so the same
 * anchor selector always maps to the same stamped class, across files and runs.
 *
 * @param {string} input The string to hash.
 * @returns {string} A short base36 hash.
 */
function hashString(input) {
  let hash = 5381;

  for (let i = 0; i < input.length; i++) {
    hash = (((hash << 5) + hash) + input.charCodeAt(i)) >>> 0;
  }

  return hash.toString(36);
}

/**
 * Removes CSS comments and collapses all whitespace runs to single spaces.
 * Starlight writes block comments inside multi-line selectors; those are valid
 * in a stylesheet but not in `querySelectorAll`.
 *
 * @param {string} selector The raw selector text.
 * @returns {string} The cleaned selector.
 */
function cleanSelector(selector) {
  return selector.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Splits a selector list on top-level commas (commas inside `()` or `[]` do not
 * split).
 *
 * @param {string} selector The selector list.
 * @returns {string[]} The individual selector items.
 */
function splitSelectorList(selector) {
  const items = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth--;
    } else if (char === ',' && depth === 0) {
      items.push(selector.slice(start, i));
      start = i + 1;
    }
  }

  items.push(selector.slice(start));

  return items.map(item => item.trim()).filter(item => item.length > 0);
}

/**
 * Tokenizes one selector item into alternating compound and combinator tokens
 * (starting and ending with a compound). Combinator tokens include their
 * surrounding whitespace, so joining all tokens reproduces the item.
 *
 * @param {string} item A single (comma-free) selector.
 * @returns {string[]} Alternating [compound, combinator, compound, ...] tokens.
 */
function tokenizeCompounds(item) {
  const tokens = [];
  let depth = 0;
  let current = '';
  let inCombinator = false;

  for (let i = 0; i < item.length; i++) {
    const char = item[i];

    if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth--;
    }

    const isCombinatorChar = depth === 0 && (char === ' ' || char === '>' || char === '+' || char === '~');

    if (isCombinatorChar !== inCombinator) {
      tokens.push(current);
      current = '';
      inCombinator = isCombinatorChar;
    }

    current += char;
  }

  tokens.push(current);

  return tokens;
}

/**
 * Splits a compound selector into its simple-selector segments: a type name or
 * `&`/`*`, `.class`, `#id`, `[attr]`, `:pseudo-class(...)`, `::pseudo-element`.
 *
 * @param {string} compound A compound selector (no top-level combinators).
 * @returns {string[]} The segments, in order.
 */
function splitSegments(compound) {
  const segments = [];
  let i = 0;

  while (i < compound.length) {
    const start = i;
    const char = compound[i];

    if (char === '[') {
      let depth = 0;

      do {
        if (compound[i] === '[') {
          depth++;
        } else if (compound[i] === ']') {
          depth--;
        }
        i++;
      } while (i < compound.length && depth > 0);

    } else if (char === ':' || char === '.' || char === '#') {
      i++;

      if (char === ':' && compound[i] === ':') {
        i++;
      }

      while (i < compound.length && /[\w\\-]/.test(compound[i])) {
        i++;
      }

      if (compound[i] === '(') {
        let depth = 0;

        do {
          if (compound[i] === '(') {
            depth++;
          } else if (compound[i] === ')') {
            depth--;
          }
          i++;
        } while (i < compound.length && depth > 0);
      }

    } else {
      // type selector, `&`, `*`, or a namespaced name
      i++;

      while (i < compound.length && /[\w\\|*-]/.test(compound[i])) {
        i++;
      }
    }

    segments.push(compound.slice(start, i));
  }

  return segments;
}

/**
 * Computes CSS specificity `[ids, classes, types]` for a selector string,
 * following the same rules the browser uses: `:is()`, `:not()`, and `:has()`
 * count as the highest specificity among their arguments; `:where()` counts as
 * zero.
 *
 * @param {string} selector The selector (may contain combinators and commas).
 * @returns {number[]} The `[a, b, c]` specificity triple.
 */
function specificity(selector) {
  const max = (left, right) => {
    for (let i = 0; i < 3; i++) {
      if (left[i] !== right[i]) {
        return left[i] > right[i] ? left : right;
      }
    }

    return left;
  };

  let best = [0, 0, 0];

  for (const item of splitSelectorList(selector)) {
    const total = [0, 0, 0];
    const tokens = tokenizeCompounds(item);

    for (let t = 0; t < tokens.length; t += 2) {
      for (const segment of splitSegments(tokens[t])) {
        if (segment.startsWith('::')) {
          total[2]++;
        } else if (segment.startsWith(':')) {
          const name = segment.slice(1).replace(/\(.*$/s, '').toLowerCase();
          const argsMatch = segment.match(/^:[\w-]+\((.*)\)$/s);

          if (name === 'where') {
            // zero
          } else if (argsMatch && ['is', 'not', 'has', 'matches'].includes(name)) {
            const inner = specificity(argsMatch[1]);

            total[0] += inner[0];
            total[1] += inner[1];
            total[2] += inner[2];
          } else if (['before', 'after', 'first-line', 'first-letter'].includes(name)) {
            total[2]++;
          } else {
            total[1]++;
          }
        } else if (segment.startsWith('.') || segment.startsWith('[')) {
          total[1]++;
        } else if (segment.startsWith('#')) {
          total[0]++;
        } else if (segment !== '*' && segment !== '&') {
          total[2]++;
        }
      }
    }

    best = max(best, total);
  }

  return best;
}

/**
 * Builds an always-true selector suffix whose specificity equals the given
 * triple, so a rewritten rule keeps the exact cascade weight of the segments
 * it dropped. `:not(#_)` adds one id, `:not(._)` one class, `:not(_)` one type;
 * each matches every element on a real page.
 *
 * @param {number[]} spec The `[a, b, c]` specificity to reproduce.
 * @returns {string} The padding suffix (may be empty).
 */
function specificityPadding(spec) {
  return ':not(#_)'.repeat(spec[0]) + ':not(._)'.repeat(spec[1]) + ':not(_)'.repeat(spec[2]);
}

/**
 * Resolves a (possibly nested) selector to an absolute one, per the CSS nesting
 * model: `&` becomes `:is(<parent selector list>)`; a nested selector without
 * `&` gets the parent prepended as a descendant context. At-rule ancestors
 * (`@media`, `@layer`, ...) are skipped - they do not contribute selector text.
 *
 * @param {string} selector The selector item to resolve.
 * @param {import('postcss').Rule} rule The rule the selector belongs to.
 * @returns {string} An absolute selector usable with `querySelectorAll`.
 */
function resolveNested(selector, rule) {
  let parent = rule.parent;

  while (parent && parent.type !== 'root' && parent.type !== 'rule') {
    parent = parent.parent;
  }

  if (!parent || parent.type !== 'rule') {
    return selector;
  }

  const parentList = splitSelectorList(cleanSelector(parent.selector))
    .map(item => resolveNested(item, parent))
    .join(', ');
  const parentRef = `:is(${parentList})`;

  if (selector.includes('&')) {
    return selector.replaceAll('&', parentRef);
  }

  return `${parentRef} ${selector}`;
}

/**
 * Rewrites one selector item: every compound that contains `:has()` has those
 * segments replaced by `:where(.ht-nohas-<hash>)` plus specificity padding.
 * The hash is derived from the "anchor" - the original selector up to and
 * including that compound - which is also what the client runtime evaluates
 * (once, via `querySelectorAll`) to stamp the class on the matching elements.
 *
 * @param {string} item The selector item (comments stripped).
 * @param {import('postcss').Rule} rule The owning rule (for nesting context).
 * @param {Map<string, string>} manifest Accumulates className -> anchor pairs.
 * @returns {string} The rewritten selector item.
 */
function rewriteSelectorItem(item, rule, manifest) {
  const tokens = tokenizeCompounds(item);
  const rewritten = [...tokens];
  let lostAmpersand = false;

  for (let t = 0; t < tokens.length; t += 2) {
    if (!tokens[t].includes(':has(')) {
      continue;
    }

    const anchorRaw = tokens.slice(0, t + 1).join('');
    const anchor = cleanSelector(resolveNested(anchorRaw, rule));
    const className = FALLBACK_PREFIX + hashString(anchor);
    const segments = splitSegments(tokens[t]);
    const kept = segments.filter(segment => !segment.includes(':has('));
    const dropped = segments.filter(segment => segment.includes(':has('));

    if (dropped.some(segment => segment.includes('&'))) {
      lostAmpersand = true;
    }

    const droppedSpec = specificity(
      dropped.map(segment => resolveNested(segment, rule)).join(''),
    );

    rewritten[t] = `${kept.join('')}:where(.${className})${specificityPadding(droppedSpec)}`;
    manifest.set(className, anchor);
  }

  let result = rewritten.join('');

  // A nested selector whose only `&` sat inside a dropped `:has()` (for example
  // `div:has(> &)`) must keep an explicit `&`, otherwise the browser adds an
  // implicit descendant scope that the original selector did not have.
  if (lostAmpersand && item.includes('&') && !result.includes('&')) {
    result += ':where(&, :not(&))';
  }

  return result;
}

/**
 * Rewrites every statically-decidable `:has()` selector in a stylesheet to a
 * stamped-class fallback, and appends a `:root` manifest block that maps each
 * stamped class back to the original selector for the client runtime.
 * Selectors gated on live interaction state (hover, focus, `[open]`, ...) are
 * kept as `:has()` - they are not triggered by scroll-driven DOM mutations.
 *
 * @param {string} css The stylesheet source.
 * @returns {{ css: string, replaced: number, kept: number }} The rewritten
 * stylesheet and how many `:has()` selector items were replaced vs kept.
 */
export function rewriteHasSelectors(css) {
  const root = postcss.parse(css);
  const manifest = new Map();
  let replaced = 0;
  let kept = 0;

  root.walkRules((rule) => {
    if (!rule.selector.includes(':has(')) {
      return;
    }

    const items = splitSelectorList(cleanSelector(rule.selector));
    const output = items.map((item) => {
      if (!item.includes(':has(')) {
        return item;
      }

      if (DYNAMIC_STATE_PATTERN.test(item)) {
        kept++;

        return item;
      }

      replaced++;

      return rewriteSelectorItem(item, rule, manifest);
    });

    rule.selector = output.join(', ');
  });

  let result = root.toString();

  if (manifest.size > 0) {
    const declarations = [...manifest.entries()]
      .map(([className, anchor]) => `--${className}: "${anchor.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`)
      .join('; ');

    result += `\n:root { ${declarations}; }\n`;
  }

  return { css: result, replaced, kept };
}

/**
 * Returns `true` when a Vite module id points at a stylesheet served AS CSS: a
 * plain .css/.scss/.sass/.less file, or a compiled `<style>` block of an
 * .astro/.vue component (their ids carry an `astro&type=style` /
 * `vue&type=style` query and a `lang.css` marker).
 *
 * A `?raw`, `?url`, or `?inline` query means the file is imported as a
 * JavaScript module (`export default "..."`), not served as a stylesheet - the
 * docs example runner imports example CSS this way. Those modules are not CSS
 * at transform time and must be skipped (postcss cannot parse them, and in the
 * production build this failed the whole `astro build`).
 *
 * @param {string} id The Vite module id.
 * @returns {boolean} Whether the id is a stylesheet module.
 */
export function isStylesheetId(id) {
  if (id.includes('&type=style')) {
    return true;
  }

  const [cleanId, query = ''] = id.split('?');
  const params = new URLSearchParams(query);

  if (params.has('raw') || params.has('url') || params.has('inline')) {
    return false;
  }

  return /\.(css|scss|sass|less)$/.test(cleanId);
}

/**
 * Astro integration that replaces statically-decidable `:has()` selectors in
 * every served stylesheet with JS-stamped class fallbacks, and injects the
 * client runtime that stamps those classes.
 *
 * Why: in Chrome, `:has()` rules in a stylesheet register document-global
 * style-invalidation hooks - any structural DOM mutation then pays a
 * host-page-scaled style recalculation. `querySelectorAll(':has(...)')` from
 * JS registers nothing, so moving the matching from CSS to a one-off (plus
 * mutation-observed) stamping pass keeps the pixels identical while removing
 * the per-mutation cost. Hover/focus-driven rules stay as `:has()` in CSS;
 * they measured ~zero scroll cost.
 *
 * Handsontable's own stylesheets are excluded on purpose - see
 * {@link EXCLUDED_ID_FRAGMENTS}.
 *
 * @returns {import('astro').AstroIntegration} The integration.
 */
export function replaceHasSelectors() {
  return {
    name: 'replace-has-selectors',
    hooks: {
      'astro:config:setup': ({ updateConfig, injectScript }) => {
        injectScript('page', readFileSync(new URL('./has-fallback-runtime.mjs', import.meta.url), 'utf8'));

        updateConfig({
          vite: {
            plugins: [
              {
                // No `enforce`: a normal plugin's transform runs after vite:css
                // (preprocessors compiled, @imports resolved - the code is plain
                // CSS) and before vite:css-post (which wraps it for the browser).
                name: 'replace-has-selectors',
                transform(code, id) {
                  if (!isStylesheetId(id) || !code.includes(':has(')) {
                    return null;
                  }

                  if (EXCLUDED_ID_FRAGMENTS.some(fragment => id.includes(fragment))) {
                    return null;
                  }

                  let result;

                  try {
                    result = rewriteHasSelectors(code);
                  } catch (error) {
                    // A module that passed the id check but is not parseable CSS
                    // (e.g. an import mode this plugin does not know about) must
                    // never fail the whole build - serve it untouched and warn.
                    this.warn(`replace-has-selectors: skipping unparseable stylesheet module "${id}": ${error.message}`);

                    return null;
                  }

                  if (result.replaced === 0) {
                    return null;
                  }

                  return { code: result.css, map: null };
                },
              },
            ],
          },
        });
      },
    },
  };
}
