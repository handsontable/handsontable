// Meaningfulness scorer for a single test file — the dependency-free half of the
// test-generation evals (DEV-2061, part of DEV-2055).
//
// Static signals only: assertion counts, hollow it()/test() blocks, anti-gaming
// markers, and determinism smells. They are necessary conditions for a meaningful
// test, not sufficient ones — the sufficiency half (mutation kill rate via
// StrykerJS) is dependency-gated and reported through the `mutation` field.
//
// Usage: node evals/score.mjs <test-file> [--diff <diff-file>] [--mutate <src,src…>]
// Output: a single JSON score object on stdout.

import { execSync } from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, realpathSync, rmSync, rmdirSync, writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  TEST_CALL_RE, countAssertions, countSkipFocus, countTableRows, matcherHistogram, matcherKind,
} from '../.github/scripts/lib/test-weakening.mjs';

// The handsontable package dir, resolved from THIS file's location (evals/) so
// mutation runs work regardless of the caller's cwd.
const HOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'handsontable');

/**
 * Skip a string literal (single, double, or template quote) starting at `start`.
 * Template literals recurse into `${…}` expressions so braces inside them do not
 * leak into the caller's balance counting.
 *
 * @param {string} src The source text.
 * @param {number} start Index of the opening quote.
 * @returns {number} Index just past the closing quote (or end of input).
 */
function skipString(src, start) {
  const quote = src[start];
  let i = start + 1;

  while (i < src.length) {
    const ch = src[i];

    if (ch === '\\') {
      i += 2;
      continue;
    }

    if (ch === quote) {
      return i + 1;
    }

    if (quote === '`' && ch === '$' && src[i + 1] === '{') {
      const end = scanBalanced(src, i + 1);

      i = end === -1 ? src.length : end + 1;
      continue;
    }
    i += 1;
  }

  return i;
}

/**
 * Find the index of the bracket that closes the one at `openIndex`, skipping
 * string literals and comments. A heuristic scanner — regex literals with
 * unbalanced brackets inside can confuse it — which is acceptable for scoring:
 * the detector surfaces signals, it does not prove intent.
 *
 * @param {string} src The source text.
 * @param {number} openIndex Index of the opening `(`, `{`, or `[`.
 * @returns {number} Index of the matching closer, or -1 when unbalanced.
 */
export function scanBalanced(src, openIndex) {
  const open = src[openIndex];
  const close = { '(': ')', '{': '}', '[': ']' }[open];
  let depth = 0;
  let i = openIndex;

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      const eol = src.indexOf('\n', i);

      if (eol === -1) {
        break;
      }
      i = eol;
      continue;
    }

    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);

      i = end === -1 ? src.length : end + 2;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      i = skipString(src, i);
      continue;
    }

    if (ch === open) {
      depth += 1;

    } else if (ch === close) {
      depth -= 1;

      if (depth === 0) {
        return i;
      }
    }
    i += 1;
  }

  return -1;
}

/**
 * Index of the `(` that opens a parameterized block's title-and-body call — the
 * one that follows the table in `it.each([...])(title, fn)`.
 *
 * @param {string} src The spec file contents.
 * @param {number} tableOpen Index of the `(` that opens the table.
 * @returns {number} The index, or -1 when the table never closes or no call follows it.
 */
function skipEachTable(src, tableOpen) {
  const closeTable = scanBalanced(src, tableOpen);

  if (closeTable === -1) {
    return -1;
  }

  let i = closeTable + 1;

  // Whitespace and comments may both sit between the table and the title call —
  // `it.each([...]) // rows` followed by `('title', fn)` on the next line is legal —
  // so skip both before looking for the second `(`.
  for (;;) {
    while (i < src.length && /\s/.test(src[i])) {
      i += 1;
    }

    if (src.startsWith('//', i)) {
      const eol = src.indexOf('\n', i);

      if (eol === -1) {
        return -1;
      }
      i = eol + 1;
      continue;
    }

    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2);

      if (end === -1) {
        return -1;
      }
      i = end + 2;
      continue;
    }

    break;
  }

  return src[i] === '(' ? i : -1;
}

/**
 * Extract every it()/test() block from a spec source, with its title, the
 * number of assertion-like calls inside its argument list, and the number of
 * tests it registers (`rows`: 1, or the row count of a parameterized table).
 * The block opener (`TEST_CALL_RE`), the row counter, and the assertion regex
 * are shared with the test-weakening detector, so its `tests-removed` count and
 * the `rows` total of this list always agree.
 *
 * @param {string} src The spec file contents.
 * @returns {{marker: string, title: string, assertions: number, rows: number}[]} One entry per test block.
 */
export function extractTestBlocks(src) {
  const blocks = [];

  for (const match of src.matchAll(TEST_CALL_RE)) {
    let openParen = match.index + match[0].length - 1;
    let rows = 1;

    // A parameterized opener (`it.each([...])(title, fn)`) takes the table
    // first; the title and the body follow in a second call. Skip the table so
    // its rows are not read as the block's arguments — every table would come
    // back untitled and hollow. A table with no call after it stays as it is:
    // the runner registers no test for it, so "untitled, hollow" is the honest read.
    if (match.groups.each) {
      const callParen = skipEachTable(src, openParen);

      rows = countTableRows(src, openParen + 1);

      if (callParen !== -1) {
        openParen = callParen;
      }
    }

    const closeParen = scanBalanced(src, openParen);
    const body = closeParen === -1 ? src.slice(openParen + 1) : src.slice(openParen + 1, closeParen);
    const titleMatch = body.match(/^\s*(['"`])((?:\\.|(?!\1).)*)\1/);

    blocks.push({
      marker: match[0].replace(/\s*\($/, ''),
      title: titleMatch ? titleMatch[2] : '(untitled)',
      assertions: countAssertions(body),
      rows,
    });
  }

  return blocks;
}

/**
 * Count try/catch clauses that swallow a failure: a catch body with no
 * assertion, no `throw`, and no explicit failure call. Promise `.catch(…)`
 * member calls are out of scope (the lookbehind rejects them).
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of swallowing catch clauses.
 */
export function findCatchSwallows(src) {
  let count = 0;

  for (const match of src.matchAll(/(?<![\w$.])catch\b/g)) {
    let i = match.index + match[0].length;

    while (i < src.length && /\s/.test(src[i])) {
      i += 1;
    }

    if (src[i] === '(') {
      const closeParam = scanBalanced(src, i);

      if (closeParam === -1) {
        continue;
      }
      i = closeParam + 1;

      while (i < src.length && /\s/.test(src[i])) {
        i += 1;
      }
    }

    if (src[i] !== '{') {
      continue;
    }

    const closeBody = scanBalanced(src, i);

    if (closeBody === -1) {
      continue;
    }

    const body = src.slice(i + 1, closeBody);
    const handlesFailure = countAssertions(body) > 0
      || /\bthrow\b/.test(body)
      || /\bfail\s*\(/.test(body)
      || /\bprocess\.exitCode/.test(body);

    if (!handlesFailure) {
      count += 1;
    }
  }

  return count;
}

/**
 * Detect anti-gaming markers: focus/skip (shared regex with the test-weakening
 * detector), flaky/fixme/todo annotations, and failure-swallowing try/catch.
 *
 * @param {string} src The spec file contents.
 * @returns {{type: string, count: number}[]} One entry per signal type found.
 */
export function findGamingSignals(src) {
  const signals = [];
  const skipFocus = countSkipFocus(src);

  if (skipFocus > 0) {
    signals.push({ type: 'skip-or-focus', count: skipFocus });
  }

  const flaky = (src.match(/\b(?:it|test)\.flaky\s*\(/g) || []).length;

  if (flaky > 0) {
    signals.push({ type: 'flaky-marker', count: flaky });
  }

  const fixmeTodo = (src.match(/\b(?:it|test)\.(?:fixme|todo)\s*\(/g) || []).length;

  if (fixmeTodo > 0) {
    signals.push({ type: 'fixme-or-todo', count: fixmeTodo });
  }

  const swallows = findCatchSwallows(src);

  if (swallows > 0) {
    signals.push({ type: 'try-catch-swallow', count: swallows });
  }

  return signals;
}

/**
 * Matches the opening of a describe block: `describe(`, `fdescribe(`,
 * `xdescribe(`, and the dot forms (`test.describe(`, `describe.only(`,
 * `test.describe.serial(`). `describe.each([…])(` is excluded — its first paren
 * holds the table, not the suite body.
 */
const DESCRIBE_CALL_RE = /(?<![\w$.])(?:[xf]describe|(?:test\.)?describe(?:\.(?!each\b)\w+)*)\s*\(/g;

/**
 * A rendered-count read through the legacy-suite helpers, by exact name:
 * `countVisibleRows()`, `countVisibleCols()`, `countRenderedRows()`,
 * `countRenderedCols()`, `getRenderedRowsCount()`. Exact names rather than a
 * `countVisible\w*` prefix — a page-object helper such as
 * `countVisibleCustomBorders()` counts drawn borders, which no theme's row
 * height can change.
 */
const RENDERED_COUNT_HELPER_SOURCE = String.raw`(?<![\w$])(?:`
  + String.raw`countVisible(?:Rows|Cols|Columns)`
  + String.raw`|countRendered(?:Rows|Cols|Columns)`
  + String.raw`|getRendered(?:Rows|Cols|Columns)Count`
  + String.raw`)\s*\(`;
const RENDERED_COUNT_HELPER_RE = new RegExp(RENDERED_COUNT_HELPER_SOURCE, 'g');

/**
 * A `:visible` selector — the Playwright-tier way to name what is on screen.
 * It is a rendered-count read only when something counts it (see
 * `isCountedVisibleSelector`); a `:visible` click or `.first()` counts nothing.
 */
const VISIBLE_SELECTOR_RE = /:visible\b/g;

/**
 * A count taken inside one statement: the `toHaveCount(` matcher, a `.count()`
 * call, or a legacy rendered-count helper.
 */
const COUNT_SHAPE_RE = new RegExp(String.raw`\btoHaveCount\s*\(|\.count\s*\(|${RENDERED_COUNT_HELPER_SOURCE}`);

/**
 * The one call that pins the viewport without naming a size.
 */
const SCROLL_PIN_RE = /\bscrollViewportTo\b/;

/**
 * A `width`/`height` key opening an object-literal entry, with a value after
 * the colon rather than a TypeScript type (`{ width: number }` in a generic or
 * a signature). The whitespace lives inside the lookahead so it cannot
 * backtrack around the type name. Sticky: the caller positions it at a
 * top-level key of an options object. `rowHeights:`/`colWidths:` never match
 * (case-sensitive).
 */
const VIEWPORT_KEY_RE = /(?:width|height)\s*:(?!\s*(?:number|string|boolean|any|unknown)\b)/y;

/**
 * Any call: `handsontable(`, `grid.initGrid(`, `new Handsontable(host,`. The
 * viewport scan looks inside every argument list and drops assertion calls by
 * span, so no name list is needed here.
 */
const CALL_OPEN_RE = /[A-Za-z_$][\w$]*\s*\(/g;

/**
 * A local initialized with an object literal: `const ROOMY_VIEWPORT = {`.
 */
const OBJECT_INIT_RE = /(?<![\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;

/**
 * A local declaration with an initializer: `const tokens =`. The awaited
 * capture below is the subset whose initializer starts with `await`.
 */
const DECLARATION_RE = /(?<![\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;

/**
 * An awaited value captured into a plain identifier: `const x = await …`.
 * Destructuring captures are out of scope.
 */
const AWAITED_CAPTURE_RE = /(?<![\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\b/g;

/**
 * The receiver position of an assertion helper: `x.expectVisible(`.
 */
const RECEIVER_RE = /^\s*\??\.\s*(?:expect|assert|verify)\w*\s*\(/;

/**
 * The start of an assertion call, including namespaced forms (`expect.poll(`,
 * `assert.equal(`). Shares its name family with `countAssertions`.
 */
const ASSERTION_CALL_RE = /(?<![\w$])(?:expect|assert|verify)\w*(?:\.\w+)*\s*\(/g;

/**
 * Escape a string for literal use inside a RegExp.
 *
 * @param {string} text The literal text.
 * @returns {string} The text with every regex metacharacter escaped.
 */
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace every comment with spaces of the same length, so a prose mention
 * ("no width/height: …", a commented-out `expect(rows)`) cannot satisfy or
 * trigger a detector, while every index stays valid. String literals are
 * skipped so a `//` inside one (a URL) is not read as a comment.
 *
 * @param {string} src The spec file contents.
 * @returns {string} The source with comment bodies blanked.
 */
function blankComments(src) {
  let out = '';
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(src, i);

      out += src.slice(i, end);
      i = end;
      continue;
    }

    if (ch === '/' && next === '/') {
      const eol = src.indexOf('\n', i);
      const stop = eol === -1 ? src.length : eol;

      out += ' '.repeat(stop - i);
      i = stop;
      continue;
    }

    if (ch === '/' && next === '*') {
      const close = src.indexOf('*/', i + 2);
      const stop = close === -1 ? src.length : close + 2;

      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * Locate every describe block as an index range plus its body text.
 *
 * @param {string} src The spec file contents.
 * @returns {{start: number, end: number, body: string}[]} One entry per describe.
 */
function describeScopes(src) {
  const scopes = [];

  for (const match of src.matchAll(DESCRIBE_CALL_RE)) {
    const open = match.index + match[0].length - 1;
    const close = scanBalanced(src, open);
    const end = close === -1 ? src.length : close;

    scopes.push({ start: open, end, body: src.slice(open + 1, end) });
  }

  return scopes;
}

/**
 * Locate every test block as its title, body text, and where the body starts
 * in `src`. A parameterized opener (`it.each([...])(title, fn)`) is read the
 * way `extractTestBlocks` reads it: the table is skipped and the title call
 * that follows it is the block, so the smells scoped to a test body see the
 * body and not the table.
 *
 * @param {string} src The spec file contents.
 * @returns {{title: string, body: string, start: number}[]} One entry per it()/test() block.
 */
function testBodies(src) {
  const bodies = [];

  for (const match of src.matchAll(TEST_CALL_RE)) {
    let openParen = match.index + match[0].length - 1;

    // The shared opener matches `it.each(` at the table's `(`. A table with no
    // call after it stays as it is — the runner registers no test for it.
    if (match.groups.each) {
      const callParen = skipEachTable(src, openParen);

      if (callParen !== -1) {
        openParen = callParen;
      }
    }

    const closeParen = scanBalanced(src, openParen);
    const body = closeParen === -1 ? src.slice(openParen + 1) : src.slice(openParen + 1, closeParen);
    const titleMatch = body.match(/^\s*(['"`])((?:\\.|(?!\1).)*)\1/);

    bodies.push({ title: titleMatch ? titleMatch[2] : '(untitled)', body, start: openParen + 1 });
  }

  return bodies;
}

/**
 * Bounds of the statement holding `index`: from the previous `;` to the next
 * one (or the text's ends). Semicolons rather than newlines, so a matcher
 * chain wrapped over several lines stays one statement.
 *
 * @param {string} code The source text (comments blanked).
 * @param {number} index An index inside the statement.
 * @returns {[number, number]} The `[start, end)` bounds.
 */
function statementBounds(code, index) {
  const start = code.lastIndexOf(';', index) + 1;
  const next = code.indexOf(';', index);

  return [start, next === -1 ? code.length : next];
}

/**
 * Is the `:visible` selector at `index` counted? Either its own statement
 * counts it (`await expect(page.locator('tr:visible')).toHaveCount(12)`,
 * `expect(await grid.locator('td:visible').count())`), or the statement
 * captures the locator into an identifier that a later statement in the same
 * scope counts (`const rows = page.locator('tr:visible'); … rows.count()`,
 * `expect(rows).not.toHaveCount(…)`). A `:visible` that is clicked, hovered,
 * or narrowed with `.first()` is not a count.
 *
 * @param {string} code The source text (comments blanked).
 * @param {number} index Index of the `:visible` match.
 * @param {number} scopeEnd End index of the test body holding the selector, or of the innermost enclosing describe (or the text) when the selector sits outside any test.
 * @returns {boolean} True when the selector feeds a count.
 */
function isCountedVisibleSelector(code, index, scopeEnd) {
  const [start, end] = statementBounds(code, index);
  const statement = code.slice(start, end);

  if (COUNT_SHAPE_RE.test(statement)) {
    return true;
  }

  const capture = statement.match(/(?<![\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);

  if (!capture) {
    return false;
  }

  const name = escapeRegExp(capture[1]);
  const countedLater = new RegExp(
    `(?<![\\w$.])${name}\\s*\\.\\s*count\\s*\\(`
    + `|expect\\s*\\(\\s*${name}\\s*\\)(?:\\s*\\.\\s*\\w+)*\\s*\\.\\s*toHaveCount\\s*\\(`,
  );

  return countedLater.test(code.slice(end, scopeEnd));
}

/**
 * Does the bracketed region `[start, end)` hold a `width`/`height` key at the
 * top level of an object literal? Inside a call's argument list that is depth
 * one (the `{` is itself an argument); inside an object body it is depth zero.
 * Strings are skipped, and anything nested deeper — `border: { width: 2 }`,
 * `columns: [{ width: 100 }]`, an arrow function's own object — is not the
 * grid's size.
 *
 * @param {string} code The source text (comments blanked).
 * @param {number} start First index of the region.
 * @param {number} end Index just past the region.
 * @param {number} objectDepth Braces that must be open for a key to count: 1 in an argument list, 0 in an object body.
 * @returns {boolean} True when a top-level viewport key is present.
 */
function hasTopLevelViewportKey(code, start, end, objectDepth) {
  const stack = [];
  let i = start;

  while (i < end) {
    const ch = code[i];

    if (ch === '\'' || ch === '"' || ch === '`') {
      i = skipString(code, i);
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);

    } else if (ch === ')' || ch === ']' || ch === '}') {
      stack.pop();

    } else if (stack.length === objectDepth && stack.every(bracket => bracket === '{')
      && !/[\w$.]/.test(code[i - 1] ?? '')) {
      VIEWPORT_KEY_RE.lastIndex = i;

      if (VIEWPORT_KEY_RE.test(code)) {
        return true;
      }
    }
    i += 1;
  }

  return false;
}

/**
 * Does the text pin the viewport? A `scrollViewportTo` call, or a
 * `width`/`height` key at the top level of an options object — one passed
 * straight to a call (`handsontable({ width: 400 })`, `grid.initGrid({ height:
 * 150 })`, `new Handsontable(host, { … })`), or one held in a local that is
 * later passed to a call, whole or spread (`const ROOMY = { width: 900, height:
 * 520 }` … `grid.initGrid(ROOMY)`). Anything inside an assertion call or its
 * matcher chain is an expected value, not a setup — `toEqual({ width: 2, color:
 * 'red' })` pins nothing — and a nested `width` (`border: { width: 2 }`,
 * `columns: [{ width: 100 }]`) is not the grid's size.
 *
 * @param {string} text A describe body or the whole file (comments blanked).
 * @returns {boolean} True when the viewport is pinned somewhere in the text.
 */
function hasViewportPin(text) {
  if (SCROLL_PIN_RE.test(text)) {
    return true;
  }

  const spans = assertionSpans(text);
  const asserted = index => spans.some(([start, end]) => index >= start && index <= end);

  for (const call of text.matchAll(CALL_OPEN_RE)) {
    const open = call.index + call[0].length - 1;
    const close = scanBalanced(text, open);

    if (close !== -1 && !asserted(call.index) && hasTopLevelViewportKey(text, open + 1, close, 1)) {
      return true;
    }
  }

  for (const init of text.matchAll(OBJECT_INIT_RE)) {
    const open = init.index + init[0].length - 1;
    const close = scanBalanced(text, open);

    if (close === -1 || !hasTopLevelViewportKey(text, open + 1, close, 0)) {
      continue;
    }

    // Passed to a call as-is or spread into its options: `initGrid(ROOMY)`,
    // `initGrid({ ...ROOMY, layoutDirection: 'rtl' })`. A property value
    // (`top: GREEN_BORDER`) or an expected value (`toEqual(GREEN_BORDER)`) is not.
    const passed = new RegExp(`\\(\\s*(?:\\{\\s*\\.\\.\\.\\s*)?${escapeRegExp(init[1])}(?![\\w$])`, 'g');

    if ([...text.matchAll(passed)].some(use => !asserted(use.index))) {
      return true;
    }
  }

  return false;
}

/**
 * The viewport-sizing locals declared outside every recognized describe, as a list of their
 * declarations (`const ROOMY = { width: 900, height: 520 };`).
 *
 * Only the declarations carry over to a suite, never the surrounding code: a pin needs a
 * declaration AND a call that passes it, so a suite that never names the local stays unpinned.
 * Handing over the raw top-level text instead would let a complete pin out there — a file-scope
 * helper that builds a sized grid, a stray `scrollViewportTo`, or a `describe.each` body, which
 * `DESCRIBE_CALL_RE` does not treat as a suite — silence the smell in every sibling suite.
 *
 * @param {string} code The source text (comments blanked).
 * @param {{start: number, end: number}[]} scopes Every describe range, innermost ones included.
 * @returns {string} The declarations, one per line; empty when there are none.
 */
function fileScopeViewportLocals(code, scopes) {
  const outermost = scopes.filter(scope => !scopes.some(other => other !== scope
    && other.start < scope.start && scope.end <= other.end));
  const inSuite = index => outermost.some(scope => scope.start <= index && index <= scope.end);
  const declarations = [];

  for (const init of code.matchAll(OBJECT_INIT_RE)) {
    const open = init.index + init[0].length - 1;
    const close = scanBalanced(code, open);

    if (close === -1 || inSuite(init.index) || !hasTopLevelViewportKey(code, open + 1, close, 0)) {
      continue;
    }

    declarations.push(`${code.slice(init.index, close + 1)};`);
  }

  return declarations.join('\n');
}

/**
 * Count rendered-count reads whose viewport is not pinned: no enclosing
 * describe (or, for a top-level test, the whole file) hands the grid setup an
 * options object with a top-level `width`/`height`, or scrolls with
 * `scrollViewportTo` (see `hasViewportPin`). Row heights differ per theme
 * (main/horizon/classic), so an unpinned "how many rows rendered" count is a
 * different number on each leg of the theme matrix. A read is one of the
 * legacy `countVisibleRows`-family helpers or a `:visible` selector that
 * something counts.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of unpinned rendered-count reads.
 */
export function findViewportSmells(src) {
  const code = blankComments(src);
  const scopes = describeScopes(code);
  const bodies = testBodies(code);
  const enclosingOf = index => scopes.filter(scope => scope.start <= index && index <= scope.end);
  const helperReads = [...code.matchAll(RENDERED_COUNT_HELPER_RE)].map(match => match.index);
  const visibleReads = [...code.matchAll(VISIBLE_SELECTOR_RE)]
    .map(match => match.index)
    .filter((index) => {
      // A captured locator is followed up only inside the test that captured it: a
      // sibling test counting a same-named locator says nothing about this one. A
      // capture outside any test (a describe-level const) is shared by the tests
      // below it, so there the describe scope is the right reach.
      const test = bodies.find(body => body.start <= index && index < body.start + body.body.length);
      const scopeEnd = test
        ? test.start + test.body.length
        : Math.min(code.length, ...enclosingOf(index).map(scope => scope.end));

      return isCountedVisibleSelector(code, index, scopeEnd);
    });
  let count = 0;

  // A pin's two halves can sit in different scopes: `const ROOMY = { width: 900 }` at file
  // scope, `initGrid(ROOMY)` inside a suite. Neither text holds both, so each suite is searched
  // with the file-scope viewport DECLARATIONS in front of it — the declarations only, so a
  // complete pin outside the suites cannot silence one that never uses it.
  const topLevel = fileScopeViewportLocals(code, scopes);

  for (const index of [...helperReads, ...visibleReads]) {
    const enclosing = enclosingOf(index);
    const texts = enclosing.length > 0 ? enclosing.map(scope => `${topLevel}\n${scope.body}`) : [code];

    if (!texts.some(hasViewportPin)) {
      count += 1;
    }
  }

  return count;
}

/**
 * Index ranges covered by assertion calls in a test body: the argument list of
 * `expect(…)`/`assert…(…)`/`verify…(…)` plus the matcher chain that follows
 * (`.not.toBe(…)`, `.resolves.toEqual(…)`), so a value used only as the
 * expected side still counts as asserted.
 *
 * @param {string} body The test body.
 * @returns {[number, number][]} Inclusive `[start, end]` index pairs.
 */
function assertionSpans(body) {
  const spans = [];

  for (const match of body.matchAll(ASSERTION_CALL_RE)) {
    const start = match.index;
    let close = scanBalanced(body, start + match[0].length - 1);

    if (close === -1) {
      spans.push([start, body.length]);
      continue;
    }

    // Follow the matcher chain: `.name` segments, then a call.
    for (;;) {
      const chain = /^\s*(?:\??\.\s*[A-Za-z_$][\w$]*\s*)+\(/.exec(body.slice(close + 1));

      if (!chain) {
        break;
      }

      const next = scanBalanced(body, close + chain[0].length);

      if (next === -1) {
        close = body.length;
        break;
      }
      close = next;
    }
    spans.push([start, close]);
  }

  return spans;
}

/**
 * A whole-identifier match for `name`: not a prefix, suffix, or member.
 *
 * @param {string} name The identifier.
 * @param {string} [flags] RegExp flags.
 * @returns {RegExp} The pattern.
 */
function identifierRe(name, flags) {
  return new RegExp(`(?<![\\w$.])${escapeRegExp(name)}(?![\\w$])`, flags);
}

/**
 * Does `name`, used at or after `from`, reach an assertion in this body: a use
 * inside an assertion call or its matcher chain, or as the receiver of an
 * assertion helper (`x.expectVisible(`)?
 *
 * @param {string} body The test body.
 * @param {[number, number][]} spans The body's assertion spans.
 * @param {string} name The identifier.
 * @param {number} from Index in `body` where the uses begin.
 * @returns {boolean} True when one use is asserted.
 */
function isAssertedUse(body, spans, name, from) {
  for (const use of body.slice(from).matchAll(identifierRe(name, 'g'))) {
    const index = use.index + from;

    if (spans.some(([start, end]) => index >= start && index <= end)
      || RECEIVER_RE.test(body.slice(index + name.length))) {
      return true;
    }
  }

  return false;
}

/**
 * Locals declared after `from` whose initializer uses `name` — one level of
 * derivation: `const tokens = String(className).split(' ')`, `const spilling =
 * layouts.filter(…)`, `const borders = await lab.cellBorders(2, 2)`. An
 * initializer runs to the next `;`; each derived name's own uses begin there.
 *
 * @param {string} body The test body.
 * @param {string} name The captured identifier.
 * @param {number} from Index in `body` just past the capture.
 * @returns {{name: string, from: number}[]} The derived locals.
 */
function derivedDeclarations(body, name, from) {
  const useRe = identifierRe(name);
  const derived = [];

  for (const declaration of body.slice(from).matchAll(DECLARATION_RE)) {
    const start = from + declaration.index + declaration[0].length;
    const [, end] = statementBounds(body, start);

    if (useRe.test(body.slice(start, end))) {
      derived.push({ name: declaration[1], from: end });
    }
  }

  return derived;
}

/**
 * Find awaited captures (`const x = await …`) inside test bodies whose value
 * never reaches an assertion: neither the identifier itself nor a local
 * derived from it in one step (`const tokens = String(x).split(' ')`) is used
 * inside an assertion call or its matcher chain, or as the receiver of an
 * assertion helper (`x.expectFoo(`). A value fetched and then dropped is the
 * shape of a test that runs code without checking it.
 *
 * Each capture is reported once, under the innermost test that holds it. The
 * bracket scanner does not know regex literals, so a `/inset\(/` in one test
 * makes that body run on over the tests after it; without the guard every
 * capture in those tests would be counted twice, once under the wrong title.
 *
 * @param {string} src The spec file contents.
 * @returns {{test: string, name: string}[]} One entry per unasserted capture, in source order.
 */
export function findUnassertedCaptures(src) {
  const captures = [];
  const seen = new Set();
  const bodies = testBodies(blankComments(src));

  // Latest-starting body first: it is the innermost when bodies overlap.
  for (const { title, body, start } of bodies.reverse()) {
    const spans = assertionSpans(body);

    for (const capture of body.matchAll(AWAITED_CAPTURE_RE)) {
      const at = start + capture.index;

      if (seen.has(at)) {
        continue;
      }
      seen.add(at);

      const name = capture[1];
      const from = capture.index + capture[0].length;
      const asserted = isAssertedUse(body, spans, name, from)
        || derivedDeclarations(body, name, from).some(local => isAssertedUse(body, spans, local.name, local.from));

      if (!asserted) {
        captures.push({ test: title, name, at });
      }
    }
  }

  return captures
    .sort((a, b) => a.at - b.at)
    .map(({ test, name }) => ({ test, name }));
}

/**
 * Split a call's argument list — between its `(` at `openIndex` and the matching `)` at
 * `closeIndex` — into top-level arguments. Strings, comments, and nested brackets are
 * skipped, so a comma inside an arrow-function body does not split the list.
 *
 * @param {string} src The source text.
 * @param {number} openIndex Index of the call's opening `(`.
 * @param {number} closeIndex Index of the matching `)`.
 * @returns {string[]} The trimmed argument texts; empty for `()`.
 */
function splitTopLevelArgs(src, openIndex, closeIndex) {
  const args = [];
  let start = openIndex + 1;
  let i = start;

  while (i < closeIndex) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      const eol = src.indexOf('\n', i);

      i = eol === -1 ? closeIndex : eol;
      continue;
    }

    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);

      i = end === -1 ? closeIndex : end + 2;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      i = skipString(src, i);
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') {
      const end = scanBalanced(src, i);

      i = end === -1 ? closeIndex : end + 1;
      continue;
    }

    if (ch === ',') {
      args.push(src.slice(start, i));
      start = i + 1;
    }
    i += 1;
  }
  args.push(src.slice(start, closeIndex));

  const trimmed = args.map(arg => stripComments(arg).trim());

  return trimmed.length === 1 && trimmed[0] === '' ? [] : trimmed;
}

/**
 * The argument text with its comments removed, so `100 /* ms *\/` reads as the literal `100`.
 * Strings are copied through untouched, so a `//` inside a string literal is not a comment.
 *
 * @param {string} text One argument's raw source text.
 * @returns {string} The text without comments.
 */
function stripComments(text) {
  let out = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '/' && next === '/') {
      const eol = text.indexOf('\n', i);

      if (eol === -1) {
        break;
      }
      i = eol;
      continue;
    }

    if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);

      i = end === -1 ? text.length : end + 2;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      const end = skipString(text, i);

      out += text.slice(i, end);
      i = end;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * A JavaScript numeric literal: decimal (`100`, `1_000`, `1e3`, `.5`), hex, octal, or binary.
 */
const NUMERIC_RE = /^(?:0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|(?:\d[\d_]*)?(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)$/;

/**
 * The value of a numeric-literal argument, or NaN when the text is not a numeric literal
 * (an identifier, a member expression, a call — anything the rule cannot judge statically).
 *
 * @param {string|undefined} text One argument's source text.
 * @returns {number} The literal's value, or NaN.
 */
function numericLiteralValue(text) {
  if (!text || !NUMERIC_RE.test(text)) {
    return NaN;
  }

  return Number(text.replaceAll('_', ''));
}

/**
 * Count the calls matched by `callRe` whose argument list `isSmell` accepts. `callRe`
 * must end on the call's `(`. A call whose brackets the scanner cannot balance — a regex
 * literal holding a bracket, an unterminated string — counts as a smell: the text-based
 * scorer cannot prove it harmless, and the AST-based lint tiers judge the real call.
 *
 * @param {string} src The source text.
 * @param {RegExp} callRe A global regex ending on the opening parenthesis.
 * @param {(args: string[]) => boolean} isSmell Whether this call's arguments make it a smell.
 * @returns {number} The number of smelly calls.
 */
function countCalls(src, callRe, isSmell) {
  let count = 0;

  for (const match of src.matchAll(callRe)) {
    const openIndex = match.index + match[0].length - 1;
    const closeIndex = scanBalanced(src, openIndex);

    if (closeIndex === -1 || isSmell(splitTopLevelArgs(src, openIndex, closeIndex))) {
      count += 1;
    }
  }

  return count;
}

/**
 * The global timer only — bare `setTimeout(`, `window.setTimeout(`, `globalThis.setTimeout(`.
 * The lookbehind rejects `test.setTimeout(` / `testInfo.setTimeout(` (a Playwright budget, not a
 * wait), any other object's `setTimeout` method, and look-alikes such as `_registerTimeout(`.
 */
const GLOBAL_TIMER_CALL_RE = /(?<![\w$.])(?:(?:window|globalThis)\.)?setTimeout\s*\(/g;
const FRAME_WAIT_CALL_RE = /(?<![\w$.])waitForNextAnimationFrames\s*\(/g;

/**
 * The determinism smells, in the order they are reported. Each entry is one signal: its
 * id (the `type` in a score's `determinismSmells`, and the name a counterexample fixture
 * carries) and the detector that counts it. `DETERMINISM_SIGNALS` below is derived from
 * this table, so a signal added here is automatically demanded a fixture by the harness
 * self-test.
 */
const DETERMINISM_SMELLS = [
  { type: 'sleep-call', detect: src => (src.match(/\bsleep\s*\(/g) || []).length },
  { type: 'wait-for-timeout', detect: src => (src.match(/\bwaitForTimeout\s*\(/g) || []).length },
  { type: 'network-idle', detect: src => (src.match(/\bnetworkidle\b/g) || []).length },
  {
    // The frozen rule's `noSetTimeout`: the global timer with a non-zero numeric-literal delay.
    // A literal `0` is a macrotask hand-off (the scheduling barrier the Playwright tier
    // sanctions), and a computed delay cannot be judged statically; both pass, as in the rule.
    type: 'set-timeout',
    detect: src => countCalls(src, GLOBAL_TIMER_CALL_RE, (args) => {
      const delay = numericLiteralValue(args[1]);

      return Number.isFinite(delay) && delay !== 0;
    }),
  },
  {
    // The frozen rule's `noFrameWait`: any frame-count wait except a literal `0`, which the
    // helper resolves at once (its `totalFramesToWait === 0` branch) — a hand-off, not a wait.
    type: 'fixed-frame-wait',
    detect: src => countCalls(src, FRAME_WAIT_CALL_RE, args => numericLiteralValue(args[0]) !== 0),
  },
  {
    // A rendered-count read with no pinned viewport (`findViewportSmells`): row height differs
    // per theme, so the count is a different number on each leg of the theme matrix — the test
    // depends on the stylesheet the way a fixed sleep depends on the clock.
    type: 'theme-sensitive-viewport',
    detect: findViewportSmells,
  },
];

/**
 * The ids of every determinism smell the scorer knows. The harness self-test compares the
 * counterexample fixtures against this list, so a new smell cannot land without the fixture
 * that proves it fires (`evals/README.md`).
 */
export const DETERMINISM_SIGNALS = DETERMINISM_SMELLS.map(smell => smell.type);

/**
 * Detect determinism smells — fixed sleeps, fixed timers, frame-count waits, and
 * load-state waits that make a test timing-dependent instead of condition-based
 * (web-first waits, `expect.poll`, the frozen tier's `waitUntil()`). Mirrors the
 * lint bans in `tests/.eslintrc.cjs` and `handsontable/no-fixed-sleep-in-spec`,
 * exemptions included: only the global timer is judged (`test.setTimeout(ms)` is a
 * budget), only a non-zero numeric-literal delay is a fixed timer (a literal `0` is a
 * macrotask hand-off, a computed delay is not judged), and `waitForNextAnimationFrames(0)`
 * resolves at once so it passes too. Plus a rendered-row count with no pinned viewport
 * (`theme-sensitive-viewport`), which reads differently on each theme of the matrix.
 *
 * @param {string} src The spec file contents.
 * @returns {{type: string, count: number}[]} One entry per smell type found.
 */
export function findDeterminismSmells(src) {
  const smells = [];

  for (const { type, detect } of DETERMINISM_SMELLS) {
    const count = detect(src);

    if (count > 0) {
      smells.push({ type, count });
    }
  }

  return smells;
}

/**
 * The structure smells — shapes that let a test run code without checking it — in the
 * order they are reported. Each entry is one signal: its id (the `type` in a score's
 * `structureSmells`, and the name a counterexample fixture carries) and the detector that
 * lists its hits, one label per hit. A structure smell is reported as a warning, not a
 * problem, while its precision is measured. `STRUCTURE_SIGNALS` below is derived from this
 * table, so a signal added here is demanded a fixture by the harness self-test the same
 * way a determinism smell is.
 */
const STRUCTURE_SMELLS = [
  {
    // Awaited captures that never reach an assertion (`findUnassertedCaptures`).
    type: 'unasserted-capture',
    detect: src => findUnassertedCaptures(src).map(capture => `\`${capture.name}\` in "${capture.test}"`),
  },
];

/**
 * The ids of every structure smell the scorer knows — the warning-tier counterpart of
 * `DETERMINISM_SIGNALS`. A counterexample fixture may declare one of these; it is caught
 * when the smell is reported as the `structure-smells` warning, since it never flips the
 * verdict (`evals/lib/counterexamples.mjs`).
 */
export const STRUCTURE_SIGNALS = STRUCTURE_SMELLS.map(smell => smell.type);

/**
 * Detect structure smells — shapes that let a test run code without checking
 * it. Today: awaited captures that never reach an assertion. Reported as a
 * warning, not a problem, until its precision is measured: over the shipped
 * Playwright specs the remaining hits are values fetched to drive an action (a
 * bounding box for a pointer move, a count for a keyboard loop) whose outcome
 * the test asserts by other means.
 *
 * @param {string} src The spec file contents.
 * @returns {{type: string, count: number, detail: string}[]} One entry per smell type found.
 */
export function findStructureSmells(src) {
  const smells = [];

  for (const { type, detect } of STRUCTURE_SMELLS) {
    const hits = detect(src);

    if (hits.length > 0) {
      smells.push({ type, count: hits.length, detail: hits.join(', ') });
    }
  }

  return smells;
}

/**
 * Extract the symbols a unified diff touches: identifiers declared or called on
 * added lines, plus the enclosing-declaration names from `@@ … @@` hunk headers.
 * Member calls (`foo.bar(`) are ignored to keep the noise down.
 *
 * @param {string} diff The unified diff text.
 * @returns {string[]} The changed-symbol names, deduplicated.
 */
export function extractChangedSymbols(diff) {
  if (!diff) {
    return [];
  }

  const KEYWORDS = new Set([
    'function', 'return', 'while', 'switch', 'catch', 'constructor',
    'typeof', 'await', 'async', 'import', 'require', 'export',
  ]);
  const symbols = new Set();
  const collectCalls = (code) => {
    for (const m of code.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]{3,})\s*\(/g)) {
      if (!KEYWORDS.has(m[1])) {
        symbols.add(m[1]);
      }
    }
  };

  for (const line of diff.split('\n')) {
    if (line.startsWith('@@')) {
      collectCalls(line.replace(/^@@[^@]*@@/, ''));

    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      const code = line.slice(1);

      for (const m of code.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
        symbols.add(m[1]);
      }
      collectCalls(code);
    }
  }

  return [...symbols];
}

/**
 * Relate a test source to a source diff: does the test reference any symbol the
 * change touched? Informational only (E2E tests legitimately assert behavior
 * without naming source symbols), so it feeds `warnings`, never `problems`.
 *
 * @param {string} src The spec file contents.
 * @param {string} diff The unified diff text.
 * @returns {{symbols: string[], referenced: string[], covered: boolean}|null}
 *   Null when there is no diff or no extractable symbol.
 */
export function assessRelevance(src, diff) {
  const symbols = extractChangedSymbols(diff);

  if (symbols.length === 0) {
    return null;
  }

  const referenced = symbols.filter(symbol => src.includes(symbol));

  return { symbols, referenced, covered: referenced.length > 0 };
}

/**
 * Report whether the mutation layer is usable (StrykerJS installed). When it is,
 * pass `--mutate` (CLI) or `mutate` (API) to actually run it — see `runMutation`.
 *
 * @param {(id: string) => string} [resolveModule] Module resolver, injectable for tests.
 * @returns {{available: boolean, reason: string}} The mutation-layer status.
 */
export function getMutationStatus(resolveModule = createRequire(import.meta.url).resolve) {
  try {
    resolveModule('@stryker-mutator/core');

    return { available: true, reason: 'stryker installed — pass --mutate <files> to run the kill-rate check' };
  } catch {
    return { available: false, reason: 'stryker not installed' };
  }
}

/**
 * Aggregate a StrykerJS JSON mutation report into a kill-rate summary. Pure so
 * it is unit-testable independent of a live Stryker run. The mutation score is
 * the standard `detected / valid` (killed+timeout over killed+timeout+survived+
 * no-coverage) — a survived or never-covered mutant means the test did not
 * catch that change.
 *
 * @param {{files?: Record<string, {mutants?: {status: string}[]}>}} report The mutation.json report.
 * @returns {{score: number|null, killed: number, survived: number, timeout: number,
 *   noCoverage: number, total: number}} The kill-rate summary.
 */
export function parseMutationReport(report) {
  const counts = { Killed: 0, Survived: 0, Timeout: 0, NoCoverage: 0, RuntimeError: 0, CompileError: 0, Ignored: 0 };

  for (const file of Object.values(report?.files ?? {})) {
    for (const mutant of file.mutants ?? []) {
      counts[mutant.status] = (counts[mutant.status] ?? 0) + 1;
    }
  }

  const detected = counts.Killed + counts.Timeout;
  const valid = detected + counts.Survived + counts.NoCoverage;

  return {
    score: valid === 0 ? null : (detected / valid) * 100,
    killed: counts.Killed,
    survived: counts.Survived,
    timeout: counts.Timeout,
    noCoverage: counts.NoCoverage,
    total: valid,
  };
}

// Stryker 9 prints its own log lines to stdout as `HH:MM:SS (pid) LEVEL Category message`,
// colored even when the output is piped.
const STRYKER_LOG_LINE = /^\d{2}:\d{2}:\d{2} \(\d+\) ([A-Z]+) (.+)$/;
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;
// Node reports an uncaught error on a line that starts with its name (`TypeError: boom`),
// below an indented excerpt of the line that threw it.
const NODE_ERROR_LINE = /^\w*Error: /;
const STDERR_ERROR_LINE = /\b(?:error|not found|denied)\b/i;
// The most a run may print. Past it, `execSync` kills the run and reports `ENOBUFS`.
const OUTPUT_LIMIT_MB = 64;
// A `--mutate` pattern without these characters is a plain path. It may end in a mutation
// range (`src/a.ts:10-20`), which names lines of that one file.
const GLOB_CHARACTERS = /[*?[\]{}!]/;
const MUTATION_RANGE = /:\d+(?::\d+)?-\d+(?::\d+)?$/;

/**
 * Quote a value for a POSIX shell command line.
 *
 * @param {string} value The value.
 * @returns {string} The value in single quotes, each single quote inside it escaped.
 */
export function shellQuote(value) {
  return `'${String(value).replace(/'/g, String.raw`'\''`)}'`;
}

/**
 * Stryker's log lines of the given levels, without their time, process id, and level,
 * each with the raw line printed after it.
 *
 * @param {string|undefined} output What Stryker printed to stdout.
 * @param {string[]} levels The levels to keep, such as `ERROR`.
 * @returns {{message: string, next: string}[]} The matching lines, in order.
 */
function strykerLogLines(output, levels) {
  const lines = String(output ?? '').replace(ANSI_ESCAPE, '').split('\n');

  return lines.flatMap((line, index) => {
    const [, level, message] = line.match(STRYKER_LOG_LINE) ?? [];

    return levels.includes(level) ? [{ message, next: lines[index + 1] ?? '' }] : [];
  });
}

/**
 * Explain why a Stryker run failed, in Stryker's own words. The first line of an
 * `execSync` error message is only `Command failed: <the command>`. Stryker gives its
 * reason in ERROR and FATAL log lines on stdout (`Initial test run timed out!`, a broken
 * config); a test that failed in the initial run is named on the tab-indented line after
 * its ERROR line. When Stryker logged no such line, the reason comes from stderr: Node's
 * report of an uncaught error (`Error: Unable to locate env file …` from env-cmd), else the
 * first error-like line (the shell's `env-cmd: command not found`), else the first line
 * (`Detecting unexpected exit, …` after a SIGTERM). A run that `execSync` killed for printing
 * past its buffer says so, rather than reading as a SIGTERM from outside.
 *
 * @param {{message?: string, code?: string, stdout?: string, stderr?: string, status?: number|null,
 *   signal?: string|null}} error The error `execSync` threw, or any other error.
 * @returns {string} The `mutation.reason`, with the exit code or signal when there is one.
 */
function strykerFailureReason(error) {
  const logged = strykerLogLines(error.stdout, ['ERROR', 'FATAL']).map(({ message, next }) => {
    const named = next.match(/^\t(.+)$/)?.[1];

    return named ? `${message.replace(/:$/, '')}: ${named}` : message;
  });
  const stderr = String(error.stderr ?? '').replace(ANSI_ESCAPE, '').split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const reason = logged.slice(0, 3).join(' | ')
    || stderr.find(line => NODE_ERROR_LINE.test(line))
    || stderr.find(line => STDERR_ERROR_LINE.test(line))
    || stderr[0]
    || String(error.message ?? error).split('\n')[0];
  const exit = error.code === 'ENOBUFS'
    ? `its output passed ${OUTPUT_LIMIT_MB} MB`
    : error.signal ?? (Number.isInteger(error.status) ? `exit ${error.status}` : '');

  return `stryker run failed${exit ? ` (${exit})` : ''}: ${reason}`;
}

/**
 * Why the mutation layer cannot measure these tests against these sources, if it cannot,
 * checked before Stryker starts, because Stryker rewrites the mutated sources in place.
 * Test files go through `handsontable/jest.stryker.testFiles.js`, the resolver the Stryker
 * Jest config uses too, so the two checks cannot drift apart. A plain `--mutate` path must
 * exist: for one that matches nothing, Stryker only prints an English warning, which a later
 * version may reword. Each list reaches Stryker as one comma-separated value, so no path may
 * contain a comma.
 *
 * @param {string[]} sourceFiles Source paths or globs to mutate.
 * @param {string[]} testFiles Unit test paths.
 * @param {string} cwd The handsontable package directory.
 * @returns {string|null} The reason, or null when the scope can run.
 */
function scopeProblem(sourceFiles, testFiles, cwd) {
  const withComma = [...sourceFiles, ...testFiles].find(file => file.includes(','));

  if (withComma) {
    return `a path passed to Stryker cannot contain a comma: ${withComma}`;
  }

  const { resolveTestFile } = createRequire(import.meta.url)(resolve(cwd, 'jest.stryker.testFiles.js'));
  const testProblem = testFiles.map(file => resolveTestFile(file).problem).find(Boolean);

  if (testProblem) {
    return testProblem;
  }

  const missing = sourceFiles
    .filter(pattern => !GLOB_CHARACTERS.test(pattern))
    .filter(pattern => !existsSync(resolve(cwd, pattern.replace(MUTATION_RANGE, ''))));

  return missing.length > 0
    ? `--mutate matched no file (paths are relative to handsontable/): ${missing.join(', ')}`
    : null;
}

/**
 * Is a process with this id running? A process the user may not signal still counts.
 *
 * @param {number} pid The process id.
 * @returns {boolean} True while it runs.
 */
function isRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);

    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/**
 * Take this checkout's mutation lock, or name the process that holds it. Stryker rewrites the
 * mutated sources in place, and every run shares `.stryker-tmp/` and the report, so two runs
 * in one checkout would load each other's mutants or read each other's report. The lock file
 * holds its owner's process id, so a lock left by a run that died is taken over.
 *
 * @param {string} lockFile The lock file's path.
 * @returns {{release: Function}|{holder: number|string}} A release function, or the holder.
 */
function acquireMutationLock(lockFile) {
  mkdirSync(dirname(lockFile), { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      writeFileSync(lockFile, String(process.pid), { flag: 'wx' });

      return {
        release: () => {
          rmSync(lockFile, { force: true });

          // Stryker keeps an emptied temp directory after a failed run; remove it if empty.
          try {
            rmdirSync(dirname(lockFile));
          } catch {
            // Not empty (another run's backup, say) or already gone: leave it.
          }
        },
      };
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    let holder = Number.NaN;

    try {
      holder = Number(readFileSync(lockFile, 'utf8'));
    } catch {
      // Released between the two calls: the next attempt takes it.
    }

    if (isRunning(holder)) {
      return { holder };
    }

    rmSync(lockFile, { force: true });
  }

  return { holder: 'unknown' };
}

/**
 * Why a run that finished still did not measure what was asked: a `--mutate` pattern that
 * matched no file (Stryker only warns, then mutates the rest), or no valid mutant at all.
 *
 * @param {string|undefined} output What Stryker printed to stdout.
 * @param {string[]} sourceFiles The `--mutate` patterns.
 * @param {{total: number}} summary The parsed report.
 * @returns {string|null} The reason, or null when every pattern was measured.
 */
function incompleteRunReason(output, sourceFiles, summary) {
  const unmatched = strykerLogLines(output, ['WARN'])
    .map(({ message }) => message.match(/Glob pattern "(.+)" did not result in any files/)?.[1])
    .filter(Boolean);

  if (unmatched.length > 0) {
    return `--mutate matched no file (paths are relative to handsontable/): ${unmatched.join(', ')}`;
  }

  return summary.total === 0 ? `stryker reported no valid mutant in ${sourceFiles.join(', ')}` : null;
}

/**
 * Express a file the caller named (relative to `cwd`, or absolute) relative to the
 * handsontable package, which is how Stryker and the mutation Jest config address it.
 * Both ends are real paths in the case the file system stores, so a file reached through
 * a symlinked directory, or typed in another case, still counts as inside the package.
 *
 * @param {string} file The path the caller passed. The file must exist.
 * @param {string} [cwd] The directory a relative `file` is resolved against.
 * @returns {string} The path relative to `handsontable/`, starting with `..` when outside it.
 */
export function toPackagePath(file, cwd = process.cwd()) {
  return relative(realpathSync.native(HOT_DIR), realpathSync.native(resolve(cwd, file)));
}

/**
 * Run StrykerJS on the given source files and return the kill rate of the given unit
 * tests: the initial run and every mutant run execute those tests and nothing else.
 * `handsontable/jest.stryker.config.js` reads them from `HOT_MUTATION_TEST_FILES` and
 * refuses to start without them. ALWAYS scope with `--mutate` (never whole-tree). A run
 * takes seconds for a helper (`src/helpers/errors.ts`: 3 mutants in about 6s), but it
 * starts Stryker, so it is opt-in, never on the default fast static path.
 *
 * `reason` is set whenever the run did not measure what was asked: a scope the layer
 * cannot run, another run holding the checkout, a failed run, an unreadable report, a
 * `--mutate` pattern that matched no file, or no valid mutant. Both lists are relative
 * to the handsontable package.
 *
 * @param {string[]} sourceFiles Source paths or globs to mutate.
 * @param {string[]} testFiles Unit test paths whose kill rate is measured.
 * @param {{cwd?: string, run?: Function, readReport?: Function, status?: object, lockFile?: string}} [deps]
 *   Injectable IO for tests.
 * @returns {{available: boolean, reason?: string} & Partial<ReturnType<parseMutationReport>>} The result.
 */
export function runMutation(sourceFiles, testFiles, deps = {}) {
  const status = deps.status ?? getMutationStatus();

  if (!status.available) {
    return status;
  }

  if (!sourceFiles || sourceFiles.length === 0) {
    return { available: true, reason: 'no source files passed to --mutate' };
  }

  if (!testFiles || testFiles.length === 0) {
    return { available: true, reason: 'no unit test to measure the mutants against' };
  }

  const cwd = deps.cwd ?? HOT_DIR;
  const problem = scopeProblem(sourceFiles, testFiles, cwd);

  if (problem) {
    return { available: true, reason: problem };
  }

  const lockFile = deps.lockFile ?? resolve(cwd, '.stryker-tmp', 'mutation.lock');
  const lock = acquireMutationLock(lockFile);

  if (!lock.release) {
    return {
      available: true,
      reason: `another mutation run (process ${lock.holder}) is using this checkout: wait for it, `
        + `or delete ${lockFile} if no run is active`,
    };
  }

  try {
    return runStryker(sourceFiles, testFiles, cwd, deps);
  } finally {
    lock.release();
  }
}

/**
 * Run Stryker for `runMutation()`, which has checked the scope and holds the lock, and
 * read its report.
 *
 * @param {string[]} sourceFiles Source paths or globs to mutate.
 * @param {string[]} testFiles Unit test paths whose kill rate is measured.
 * @param {string} cwd The handsontable package directory.
 * @param {{run?: Function, readReport?: Function}} deps Injectable IO for tests.
 * @returns {{available: boolean, reason?: string} & Partial<ReturnType<parseMutationReport>>} The result.
 */
function runStryker(sourceFiles, testFiles, cwd, deps) {
  const run = deps.run ?? (cmd => execSync(cmd, {
    cwd, shell: '/bin/bash', stdio: 'pipe', encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_MB * 1024 * 1024,
  }));
  const readReport = deps.readReport
    ?? (() => JSON.parse(readFileSync(resolve(cwd, 'reports/mutation/mutation.json'), 'utf8')));
  let output;
  let summary;

  try {
    // Pinned Babel transform + commonjs env — Stryker's worker cwd breaks
    // cwd-relative Babel discovery (see handsontable/jest.stryker.config.js).
    // `--mutate` takes ONE comma-separated value: a second word would be read as
    // Stryker's config file.
    output = run(`HOT_MUTATION_TEST_FILES=${shellQuote(testFiles.join(','))} BABEL_ENV=commonjs `
      + 'npx env-cmd -f ../hot.config.js npx stryker run '
      + `--mutate ${shellQuote(sourceFiles.join(','))} --reporters json`);
  } catch (error) {
    return { available: true, reason: strykerFailureReason(error) };
  }

  try {
    summary = parseMutationReport(readReport());
  } catch (error) {
    return { available: true, reason: `stryker report unreadable: ${error.message.split('\n')[0]}` };
  }

  const reason = incompleteRunReason(output, sourceFiles, summary);

  return reason ? { available: true, ...summary, reason } : { available: true, ...summary };
}

/**
 * Split a spec's matcher calls into the exact and bounded halves of the weakening
 * detector's classification. The single-file counterpart of its
 * `matcher-downgrade` finding: there is no base revision to diff, but a spec
 * whose every assertion resolves to a bounded matcher is the shape a downgrade
 * ends in. The histogram the totals were summed from comes back too, so a
 * caller that needs the per-label detail does not run a second pass.
 *
 * @param {string} src The spec file contents.
 * @returns {{exact: number, bounded: number, histogram: Record<string, number>}} How many
 *   calls pin a value versus bound it, and the per-label histogram behind the totals.
 */
export function countMatchers(src) {
  const histogram = matcherHistogram(src);
  const totals = { exact: 0, bounded: 0 };

  for (const [label, count] of Object.entries(histogram)) {
    const kind = matcherKind(label);

    if (kind) {
      totals[kind] += count;
    }
  }

  return { ...totals, histogram };
}

/**
 * Score a test source for meaningfulness. `problems` fail the bar (verdict
 * `suspect`); `warnings` are informational — the relevance signal, the
 * `loose-matchers-only` matcher shape, and, while its precision is being
 * measured, the `unasserted-capture` structure smell.
 *
 * @param {string} src The spec file contents.
 * @param {{diff?: string, mutation?: {available: boolean, reason: string}}} [options={}]
 *   Optional source diff for the relevance signal and a mutation-status override.
 * @returns {object} The score object.
 */
export function scoreTestSource(src, options = {}) {
  const blocks = extractTestBlocks(src);
  const hollowTests = blocks.filter(block => block.assertions === 0).map(block => block.title);
  const gamingSignals = findGamingSignals(src);
  const determinismSmells = findDeterminismSmells(src);
  const structureSmells = findStructureSmells(src);
  const relevance = options.diff ? assessRelevance(src, options.diff) : null;
  const assertions = countAssertions(src);
  const { histogram, ...matchers } = countMatchers(src);
  const problems = [];
  const warnings = [];

  // Warning-only: a relational assertion is the documented pattern for values no
  // token derives. The bound-count must account for EVERY assertion, because a
  // helper such as `grid.expectCell()` may pin a value the scorer cannot see.
  // `toBeCloseTo` is bounded in the table, but it pins a float to N digits, so
  // it does not make a spec "loose" — the detector's `precision-widened` owns
  // its loosening.
  const pinning = matchers.exact + (histogram.toBeCloseTo ?? 0);

  if (pinning === 0 && matchers.bounded > 0 && matchers.bounded >= assertions) {
    const used = Object.keys(histogram)
      .filter(label => matcherKind(label) === 'bounded')
      .map(label => `${label} ×${histogram[label]}`);

    warnings.push({
      type: 'loose-matchers-only',
      detail: `every assertion uses a bounded matcher (${used.join(', ')}); nothing pins an exact value`,
    });
  }

  if (blocks.length === 0) {
    problems.push({ type: 'no-test-blocks', detail: 'no it()/test() block found' });
  }

  if (hollowTests.length > 0) {
    problems.push({
      type: 'hollow-tests',
      detail: `no assertion in: ${hollowTests.map(title => `"${title}"`).join(', ')}`,
    });
  }

  if (gamingSignals.length > 0) {
    problems.push({
      type: 'gaming-signals',
      detail: gamingSignals.map(signal => `${signal.type}(${signal.count})`).join(', '),
    });
  }

  if (determinismSmells.length > 0) {
    problems.push({
      type: 'determinism-smells',
      detail: determinismSmells.map(smell => `${smell.type}(${smell.count})`).join(', '),
    });
  }

  if (structureSmells.length > 0) {
    warnings.push({
      type: 'structure-smells',
      detail: structureSmells.map(smell => `${smell.type}(${smell.count}): ${smell.detail}`).join('; '),
    });
  }

  if (relevance && !relevance.covered) {
    warnings.push({
      type: 'diff-not-referenced',
      detail: `test references none of the changed symbols: ${relevance.symbols.join(', ')}`,
    });
  }

  return {
    // One per plain block, one per row of a parameterized table — the count the
    // detector's `countTestBlocks` reports.
    tests: blocks.reduce((sum, block) => sum + block.rows, 0),
    assertions,
    matchers,
    hollowTests,
    gamingSignals,
    determinismSmells,
    structureSmells,
    relevance,
    mutation: options.mutation ?? getMutationStatus(),
    problems,
    warnings,
    verdict: problems.length === 0 ? 'meaningful' : 'suspect',
  };
}

/**
 * Score a test file from disk, optionally against a source-diff file, and with
 * `mutate` also measure the test's kill rate on those source files.
 *
 * @param {string} filePath Path to the test file, relative to the working directory or absolute.
 * @param {{diffPath?: string, mutate?: string[]}} [options={}] Optional path to a unified-diff
 *   file, and source paths to mutate (relative to the handsontable package).
 * @param {object} [deps] Injectable IO for `runMutation`, for tests.
 * @returns {Promise<object>} The score object, with the file path attached.
 */
export async function scoreTestFile(filePath, options = {}, deps = {}) {
  const src = await readFile(filePath, 'utf8');
  const diff = options.diffPath ? await readFile(options.diffPath, 'utf8') : undefined;
  // Live mutation is opt-in (it runs Stryker): only when --mutate names source files.
  // The mutants are checked against this test file only, addressed from the package.
  const mutation = options.mutate?.length
    ? runMutation(options.mutate, [toPackagePath(filePath)], deps)
    : undefined;

  return { file: filePath, ...scoreTestSource(src, { diff, mutation }) };
}

// CLI entry — prints one JSON score object; exits 2 on usage errors.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const files = [];
  let diffPath;
  let mutate;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--diff') {
      diffPath = args[i + 1];
      i += 1;
    } else if (args[i] === '--mutate') {
      // Comma-separated source files to mutation-test (paths relative to the
      // handsontable package), e.g. --mutate src/helpers/errors.ts
      mutate = (args[i + 1] || '').split(',').filter(Boolean);
      i += 1;
    } else {
      files.push(args[i]);
    }
  }

  if (files.length !== 1) {
    console.error('Usage: node evals/score.mjs <test-file> [--diff <diff-file>] [--mutate <src,src…>]');
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify(await scoreTestFile(files[0], { diffPath, mutate }), null, 2));
  }
}
