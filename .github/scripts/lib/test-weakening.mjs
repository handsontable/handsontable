/**
 * Test-weakening detector — the mechanical counterpart to "green is not the goal".
 *
 * The presence gate proves a test exists; the hooks prove it passes; the ESLint
 * guards catch focused/skipped/assertion-free tests at author time. This detector
 * catches the subtler gaming move: quietly *weakening an existing spec* to reach
 * green — dropping assertions, deleting a whole test block, adding a skip/focus,
 * loosening an exact matcher into a bounded one, or widening a `toBeCloseTo`
 * tolerance — especially in the same change that touches source.
 *
 * Counting assertions alone misses two real shapes. Replacing
 * `toHaveBeenCalledTimes(300)` with `toBeGreaterThanOrEqual(300)` while ADDING a
 * third assertion makes the count rise; deleting a committed-value `toBe` while
 * adding another assertion keeps it flat. Both loosen what the spec proves, so
 * the detector also diffs a per-matcher histogram: an exact matcher's count
 * dropping AND a bounded matcher's count rising in the same file, while the
 * total exact count does not rise, reads as a downgrade. Deleting a whole
 * `it()` while growing a survivor is a third shape the count misses, so the
 * detector also compares the number of test blocks.
 *
 * It is intentionally heuristic and text-based (regex over before/after content),
 * so it is a strong SIGNAL to surface (warn), not a proof. It never inspects intent
 * — a reviewer/agent still decides whether a reduction was legitimate (e.g. a real
 * refactor that merged two assertions, or a timing-dependent count that a bound
 * describes more honestly).
 *
 * Known blind spots, so a reviewer reads a finding — or its absence — correctly:
 *
 * - Every counter is a regex over raw text, so an `expect(`, a matcher, or an
 *   `it(` inside a comment or a string literal counts like live code (inherited
 *   from `countAssertions`). Commenting an assertion out therefore does NOT read
 *   as a removal, and a comment that quotes `toBe(` inflates the histogram. The
 *   one scanner that does skip comments is the `toBeCloseTo` argument reader,
 *   because a comment between the arguments is an ordinary shape there.
 * - Only the matchers in the three tables are classified. Playwright's
 *   state-only assertions (`toBeVisible`, `toBeHidden`, `toBeAttached`,
 *   `toBeEnabled`, `toBeChecked`, `toBeFocused`, `toBeInViewport`) assert a
 *   state, not a value, so they are neither exact nor bounded and never enter
 *   the histogram — replacing `toHaveText('A1')` with `toBeVisible()` is an
 *   exact drop with no bounded rise, which only `assertions-removed` could see,
 *   and it does not, because the count is flat. The same holds for value
 *   matchers outside the tables (`toBeNull`, `toBeUndefined`, `toBeNaN`,
 *   `toBeInstanceOf`).
 * - A negated matcher (`.not.toBe(0)`) rules one value out and counts as
 *   bounded, except the two negations that pin a single value
 *   (`not.toHaveBeenCalled()` is zero calls, `not.toBeDefined()` is
 *   `undefined`). A negated bounded matcher stays bounded.
 * - `detectMatcherDowngrade` requires the total exact count not to rise, so a
 *   downgrade made in the same change as a larger addition of exact matchers
 *   (`toBe` → `toBeDefined` beside two new `toEqual`) reports nothing. The rule
 *   exists because, on the calibration replay, a rename toward a MORE exact
 *   matcher (42 `toBeGreaterThan` → `toBe`) beside a real loosening read as a
 *   downgrade when the labels were compared one by one.
 * - `detectPrecisionWidening` never judges a `toBeCloseTo` whose argument list
 *   holds a regex literal — the scanner cannot see the literal's brackets, and a
 *   misread list would turn a scan failure into an invented finding. It also
 *   pairs the digits that changed largest-with-largest once the unchanged ones
 *   cancel out. When one change both widens and tightens in the same file, the
 *   reported pairs need not be the real edits, and a widening can hide behind a
 *   larger tightening: `5 → 4` next to `1 → 6` reports nothing.
 * - `tests-removed` counts `it()`/`test()` openers, so a test moved to another
 *   file reads as removed here, and one deleted `describe` reads as every test
 *   it held.
 */

/**
 * Matchers that pin a value, a count, or a call exactly. Trading one of these
 * for a `BOUNDED_MATCHERS` entry keeps the assertion count but loosens what the
 * test proves. Names only — the call paren is matched by `MATCHER_CALL_RE`.
 * Covers the Jest/Jasmine core and the Playwright locator/page assertions that
 * pin a value; a negated call (`.not.toBe(`) counts as bounded (see `matcherKind`).
 *
 * @type {ReadonlyArray<string>}
 */
export const EXACT_MATCHERS = Object.freeze([
  // Jest and Jasmine.
  'toBe',
  'toEqual',
  'toStrictEqual',
  'toHaveBeenCalledTimes',
  'toHaveLength',
  'toHaveBeenCalledWith',
  'toHaveBeenLastCalledWith',
  // Playwright locator and page assertions that pin a value.
  'toHaveText',
  'toHaveValue',
  'toHaveCount',
  'toHaveAttribute',
  'toHaveClass',
  'toHaveCSS',
  'toHaveId',
  'toHaveJSProperty',
  'toHaveURL',
  'toHaveTitle',
]);

/**
 * Matchers that accept a range, a partial shape, or mere presence. Legitimate
 * on their own (a relational assertion is the documented pattern for values no
 * token derives — see `handsontable/.ai/TESTING.md`), suspicious only when one
 * appears where an exact matcher disappeared.
 *
 * @type {ReadonlyArray<string>}
 */
export const BOUNDED_MATCHERS = Object.freeze([
  'toBeGreaterThanOrEqual',
  'toBeLessThanOrEqual',
  'toBeGreaterThan',
  'toBeLessThan',
  'toBeCloseTo',
  'toBeTruthy',
  'toBeFalsy',
  'toBeDefined',
  'toContain',
  'toContainEqual',
  'toMatch',
  'toMatchObject',
  'toHaveProperty',
  // The loose form of `toHaveBeenCalledTimes`: "at least once".
  'toHaveBeenCalled',
  // Playwright substring and class-subset assertions.
  'toContainText',
  'toContainClass',
]);

/**
 * Matchers whose strictness depends on the argument: `toThrow('message')` pins
 * the error, `toThrow()` only proves that something threw. A call with an
 * argument counts as exact; a bare call counts as bounded and is labelled with
 * a `()` suffix in the histogram (`toThrow()`), so the two forms diff apart.
 *
 * @type {ReadonlyArray<string>}
 */
export const THROW_MATCHERS = Object.freeze([
  'toThrow',
  'toThrowError',
  'toThrowWithCause',
]);

/**
 * Bounded matchers whose negation pins a single value: `not.toHaveBeenCalled()`
 * is exactly zero calls, `not.toBeDefined()` is exactly `undefined`. Every other
 * negation rules one value out and counts as bounded.
 *
 * @type {ReadonlyArray<string>}
 */
export const NEGATION_PINS = Object.freeze([
  'toHaveBeenCalled',
  'toBeDefined',
]);

/**
 * Every classified matcher name in table order — the sort key for finding rows.
 */
const MATCHER_ORDER = [...EXACT_MATCHERS, ...BOUNDED_MATCHERS, ...THROW_MATCHERS];

/**
 * One matcher call: a dot, an optional `not.`, the matcher name, the call paren.
 * Requiring the paren right after the name is what keeps `toBe(` from swallowing
 * `toBeGreaterThan(`, `toMatch(` from swallowing `toMatchObject(`, and
 * `toContain(` from swallowing `toContainText(`; longest-first alternation makes
 * that hold regardless of engine backtracking. A chain broken across lines
 * (`expect(x)\n  .toBe(1)`) matches.
 */
const MATCHER_CALL_RE = new RegExp(
  `\\.\\s*(not\\s*\\.\\s*)?(${[...MATCHER_ORDER].sort((a, b) => b.length - a.length).join('|')})\\s*\\(`,
  'g',
);

/**
 * Sticky probe for an empty argument list right after a call's opening paren.
 */
const EMPTY_ARGS_RE = /\s*\)/y;

/**
 * A `/` that can only open a regex literal: at the start of an argument or right
 * after an operator or an opening bracket. `width / 2` (after an operand) is a
 * division and does not match.
 */
const REGEX_START_RE = /(?:^|[(,=:[!&|?{};+\-*%<>~^])\s*\//;

/**
 * `toBeCloseTo(value)` without a digits argument compares to 2 decimal places in
 * both Jest and Jasmine, so dropping the argument from `toBeCloseTo(x, 5)` is a
 * widening too.
 */
const CLOSE_TO_DEFAULT_DIGITS = 2;

/**
 * Matches the opening of a test block: `it(`, `test(`, the focused/skipped
 * prefix forms (`fit(`, `xit(`, `xtest(`), and the dot-modifier forms
 * (`it.only(`, `test.skip(`, `test.fixme(`, …). The lookbehind rejects member
 * accesses such as `/re/.test(` and `suite.it(`, and `describe`/`beforeEach`
 * never match because the `(` must follow immediately. Shared with the evals
 * scorer (`evals/score.mjs`), so both count the same blocks.
 */
const TEST_MODIFIERS = 'only|skip|fixme|fails|failing|flaky|concurrent|serial|todo';

export const TEST_CALL_RE = new RegExp(
  `(?<![\\w$.])(?:[xf](?:it|test)|(?:it|test)(?:\\.(?:${TEST_MODIFIERS}))?)\\s*\\(`,
  'g',
);

/**
 * Count assertion calls (`expect(` and common assertion-helper names) in a source string.
 * Text-based: a call inside a comment or a string literal counts too (see the
 * module header).
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of assertion-like calls.
 */
export function countAssertions(src) {
  if (!src) {
    return 0;
  }

  return (src.match(/\b(?:expect|assert|verify)\w*\s*\(/g) || []).length;
}

/**
 * Count focus/skip markers (`it.only`, `describe.skip`, `xit`, `fdescribe`, …) in a source string.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of focus/skip markers.
 */
export function countSkipFocus(src) {
  if (!src) {
    return 0;
  }
  const dotForm = src.match(/\b(?:it|test|describe|context)\.(?:skip|only)\s*\(/g) || [];
  const prefixForm = src.match(/\b(?:x(?:it|describe|test)|f(?:it|describe))\s*\(/g) || [];

  return dotForm.length + prefixForm.length;
}

/**
 * Count test blocks (`it(`, `test(`, and their focused/skipped/modifier forms)
 * in a source string. Text-based like `countAssertions`: an opener inside a
 * comment or a string literal counts too.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of test blocks.
 */
export function countTestBlocks(src) {
  if (!src) {
    return 0;
  }

  return (src.match(TEST_CALL_RE) || []).length;
}

/**
 * Build the histogram label of one matcher call: the matcher name, prefixed with
 * `not.` when the call is negated, suffixed with `()` when a `THROW_MATCHERS`
 * entry is called without an argument.
 *
 * @param {string} src The spec file contents.
 * @param {RegExpMatchArray} match A `MATCHER_CALL_RE` match.
 * @returns {string} The label.
 */
function matcherLabel(src, match) {
  const [, negation, name] = match;
  let label = name;

  if (THROW_MATCHERS.includes(name)) {
    EMPTY_ARGS_RE.lastIndex = match.index + match[0].length;

    if (EMPTY_ARGS_RE.test(src)) {
      label += '()';
    }
  }

  return negation ? `not.${label}` : label;
}

/**
 * Split a histogram label back into its parts.
 *
 * @param {string} label A `matcherHistogram` key.
 * @returns {{name: string, negated: boolean, bare: boolean}} The matcher name and its modifiers.
 */
function parseLabel(label) {
  const negated = label.startsWith('not.');
  const bare = label.endsWith('()');
  const name = label.slice(negated ? 4 : 0, bare ? -2 : undefined);

  return { name, negated, bare };
}

/**
 * Classify a histogram label as pinning a value (`exact`) or bounding it
 * (`bounded`). The single source of truth for the detectors and the evals
 * scorer: a table name is exact or bounded by its table; a `THROW_MATCHERS`
 * entry is exact with an argument and bounded when bare; a negated call is
 * bounded unless the negation itself pins a value (`NEGATION_PINS`).
 *
 * @param {string} label A `matcherHistogram` key.
 * @returns {'exact'|'bounded'|null} The kind, or null for a name outside the tables.
 */
export function matcherKind(label) {
  const { name, negated, bare } = parseLabel(label);

  if (!MATCHER_ORDER.includes(name)) {
    return null;
  }

  if (negated) {
    return NEGATION_PINS.includes(name) ? 'exact' : 'bounded';
  }

  if (THROW_MATCHERS.includes(name)) {
    return bare ? 'bounded' : 'exact';
  }

  return EXACT_MATCHERS.includes(name) ? 'exact' : 'bounded';
}

/**
 * Sort key for finding rows: table order, plain before negated, with-argument
 * before bare.
 *
 * @param {string} label A `matcherHistogram` key.
 * @returns {number} The key.
 */
function labelOrder(label) {
  const { name, negated, bare } = parseLabel(label);

  return (MATCHER_ORDER.indexOf(name) * 4) + (negated ? 2 : 0) + (bare ? 1 : 0);
}

/**
 * Count every classified matcher call in a source string, by label. A label is
 * the matcher name (`toBe`), `not.`-prefixed for a negated call (`not.toBe`),
 * and `()`-suffixed for a bare `THROW_MATCHERS` call (`toThrow()`); see
 * `matcherKind` for how a label classifies. Labels that do not occur are absent
 * (not zero), so the result reads as a sparse histogram. Text-based like
 * `countAssertions`: a matcher named inside a comment or a string literal
 * counts too.
 *
 * @param {string} src The spec file contents.
 * @returns {Record<string, number>} Label → number of calls.
 */
export function matcherHistogram(src) {
  const histogram = {};

  if (!src) {
    return histogram;
  }

  for (const match of src.matchAll(MATCHER_CALL_RE)) {
    const label = matcherLabel(src, match);

    histogram[label] = (histogram[label] ?? 0) + 1;
  }

  return histogram;
}

/**
 * Diff two histograms into classified rows, one per label seen on either side.
 *
 * @param {Record<string, number>} before The base-side histogram.
 * @param {Record<string, number>} after The head-side histogram.
 * @returns {{matcher: string, kind: 'exact'|'bounded', from: number, to: number}[]} The rows, in table order.
 */
function histogramRows(before, after) {
  const labels = new Set([...Object.keys(before), ...Object.keys(after)]);

  return [...labels]
    .map(label => ({ matcher: label, kind: matcherKind(label), from: before[label] ?? 0, to: after[label] ?? 0 }))
    .filter(row => row.kind !== null)
    .sort((a, b) => labelOrder(a.matcher) - labelOrder(b.matcher));
}

/**
 * Detect an exact → bounded matcher downgrade between two revisions of one spec:
 * at least one exact label lost calls AND at least one bounded label gained
 * calls, AND the total exact count did not rise. Either half alone is not a
 * finding — a plain removal is already `assertions-removed`, and adding a
 * relational assertion is the documented pattern for values no token derives.
 * The totals rule keeps a rename toward a MORE exact matcher quiet: 42
 * `toBeGreaterThan` becoming `toBe` beside 11 `toEqual` becoming `toContain`
 * loses one exact label and gains one bounded label, yet the file pins more
 * than before. Its price is the mirror image — a downgrade beside a larger
 * addition of exact matchers hides behind the rising total (module header).
 *
 * @param {string} before The spec contents at the base revision.
 * @param {string} after The spec contents at the head revision.
 * @returns {{kind: 'matcher-downgrade', exactDrops: {matcher: string, from: number, to: number}[],
 *   boundedRises: {matcher: string, from: number, to: number}[]}|null} The finding, or null.
 */
export function detectMatcherDowngrade(before, after) {
  const rows = histogramRows(matcherHistogram(before), matcherHistogram(after));
  const exact = rows.filter(row => row.kind === 'exact');
  const bounded = rows.filter(row => row.kind === 'bounded');
  const totalExact = side => exact.reduce((sum, row) => sum + row[side], 0);
  const strip = ({ matcher, from, to }) => ({ matcher, from, to });
  const exactDrops = exact.filter(row => row.to < row.from).map(strip);
  const boundedRises = bounded.filter(row => row.to > row.from).map(strip);

  if (exactDrops.length === 0 || boundedRises.length === 0) {
    return null;
  }

  if (totalExact('to') > totalExact('from')) {
    return null;
  }

  return { kind: 'matcher-downgrade', exactDrops, boundedRises };
}

/**
 * Split a call's argument list at its top-level commas, skipping string literals,
 * line and block comments, and nested brackets. Comments are dropped from the
 * returned texts (a line comment keeps its newline as whitespace), so an
 * argument written as `// relaxed\n 2` reads as `2`. A heuristic scanner — a
 * regex literal holding a bracket can confuse it, which the caller rules out
 * with `REGEX_START_RE` — and an unbalanced or unterminated list yields null,
 * which the caller treats as "cannot judge", never as a finding.
 *
 * @param {string} src The source text.
 * @param {number} start Index just past the call's opening `(`.
 * @returns {string[]|null} The argument texts, or null when the list never closes.
 */
function splitTopLevelArgs(src, start) {
  const args = [];
  let current = '';
  let segmentStart = start;
  let depth = 0;
  let i = start;

  const flush = (end) => {
    current += src.slice(segmentStart, end);
  };

  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '/' && next === '/') {
      const eol = src.indexOf('\n', i);

      if (eol === -1) {
        return null;
      }
      flush(i);
      i = eol;
      segmentStart = eol;
      continue;
    }

    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);

      if (end === -1) {
        return null;
      }
      flush(i);
      current += ' ';
      i = end + 2;
      segmentStart = i;
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      i += 1;

      while (i < src.length && src[i] !== ch) {
        i += src[i] === '\\' ? 2 : 1;
      }
      i += 1;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;

    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth === 0) {
        flush(i);
        args.push(current);

        return args;
      }
      depth -= 1;

    } else if (ch === ',' && depth === 0) {
      flush(i);
      args.push(current);
      current = '';
      segmentStart = i + 1;
    }
    i += 1;
  }

  return null;
}

/**
 * Collect the `numDigits` argument of every `toBeCloseTo(value, numDigits)` call.
 * An omitted argument counts as the framework default; a call whose argument is
 * not an integer literal (a variable, an expression) is skipped, and so is a
 * call whose argument list holds a regex literal — the scanner cannot see the
 * literal's brackets, and a misread list must never turn into a finding.
 *
 * @param {string} src The spec file contents.
 * @returns {number[]} One digits value per judgeable call, in source order.
 */
function closeToDigits(src) {
  const digits = [];

  if (!src) {
    return digits;
  }

  for (const match of src.matchAll(/\.\s*toBeCloseTo\s*\(/g)) {
    const args = splitTopLevelArgs(src, match.index + match[0].length);

    if (args === null || args.some(arg => REGEX_START_RE.test(arg))) {
      continue;
    }

    if (args.length === 1) {
      digits.push(CLOSE_TO_DEFAULT_DIGITS);
      continue;
    }

    const literal = /^\s*(\d+)\s*$/.exec(args[1]);

    if (literal) {
      digits.push(Number(literal[1]));
    }
  }

  return digits;
}

/**
 * Multiset difference: the values of `a` left after removing one occurrence of
 * every value in `b`.
 *
 * @param {number[]} a The values to keep from.
 * @param {number[]} b The values to remove.
 * @returns {number[]} The remaining values of `a`.
 */
function multisetDifference(a, b) {
  const remaining = new Map();

  for (const value of b) {
    remaining.set(value, (remaining.get(value) ?? 0) + 1);
  }

  return a.filter((value) => {
    const count = remaining.get(value) ?? 0;

    if (count > 0) {
      remaining.set(value, count - 1);

      return false;
    }

    return true;
  });
}

/**
 * Detect a widened `toBeCloseTo` tolerance between two revisions of one spec: a
 * digits value that disappeared paired with a smaller one that appeared. The
 * digits that survive both revisions cancel out first, so a reorder is not a
 * finding, and the leftovers pair largest-with-largest — a heuristic, like the
 * rest of this module: when one change both widens and tightens in the same
 * file, the reported pairs need not be the real edits, and a widening can hide
 * behind a larger tightening (`5 → 4` beside `1 → 6` reports nothing). See the
 * module header.
 *
 * @param {string} before The spec contents at the base revision.
 * @param {string} after The spec contents at the head revision.
 * @returns {{kind: 'precision-widened', widenings: {from: number, to: number}[]}|null} The finding, or null.
 */
export function detectPrecisionWidening(before, after) {
  const digitsBefore = closeToDigits(before);
  const digitsAfter = closeToDigits(after);
  const descending = (a, b) => b - a;
  const lost = multisetDifference(digitsBefore, digitsAfter).sort(descending);
  const gained = multisetDifference(digitsAfter, digitsBefore).sort(descending);
  const widenings = [];

  for (let i = 0; i < Math.min(lost.length, gained.length); i++) {
    if (lost[i] > gained[i]) {
      widenings.push({ from: lost[i], to: gained[i] });
    }
  }

  if (widenings.length === 0) {
    return null;
  }

  return { kind: 'precision-widened', widenings };
}

/**
 * Parse `git diff --name-status` output into rows the gate can diff. Handles the
 * rename/copy form (`R100\told\tnew`), where the OLD path anchors the base-side
 * content — comparing a renamed spec against empty would false-positive every
 * pre-existing skip as "added".
 *
 * @param {string} nameStatus Raw `git diff --name-status` output.
 * @returns {{status: string, oldPath: string, path: string}[]} One row per changed
 *   file: `status` is the single-letter code (M/A/D/R/C…), `path` the head-side
 *   path, `oldPath` the base-side path (equal to `path` except for renames/copies).
 */
export function parseNameStatus(nameStatus) {
  return (nameStatus || '').split('\n').filter(Boolean).map((line) => {
    const [status, ...rest] = line.split('\t');

    return {
      status: status.trim()[0],
      oldPath: rest[0].trim(),
      path: rest[rest.length - 1].trim(),
    };
  });
}

/**
 * Detect weakening of a single spec between two revisions. Every finding carries
 * a `kind` discriminator; the count-based kinds (`assertions-removed`,
 * `tests-removed`, `skip-or-focus-added`) carry `before`/`after`, the
 * matcher-based kinds carry their own detail (see the per-detector docs).
 *
 * @param {string} before The spec contents at the base revision.
 * @param {string} after The spec contents at the head revision.
 * @param {{ sourceChanged?: boolean }} [context={}] Extra context; `sourceChanged`
 *   raises the severity from `warn` to `flag` because weakening a test in the same
 *   change that touches source is the classic "make it green" move.
 * @returns {{ findings: {kind: string}[], severity: 'ok'|'warn'|'flag' }}
 *   The findings and an overall severity.
 */
export function detectWeakening(before, after, context = {}) {
  const findings = [];
  const aBefore = countAssertions(before);
  const aAfter = countAssertions(after);

  if (aAfter < aBefore) {
    findings.push({ kind: 'assertions-removed', before: aBefore, after: aAfter });
  }

  // A whole `it()` deleted while a survivor grows keeps the assertion count
  // flat or rising, so the block count is compared on its own.
  const tBefore = countTestBlocks(before);
  const tAfter = countTestBlocks(after);

  if (tAfter < tBefore) {
    findings.push({ kind: 'tests-removed', before: tBefore, after: tAfter });
  }

  const sBefore = countSkipFocus(before);
  const sAfter = countSkipFocus(after);

  if (sAfter > sBefore) {
    findings.push({ kind: 'skip-or-focus-added', before: sBefore, after: sAfter });
  }

  const downgrade = detectMatcherDowngrade(before, after);

  if (downgrade) {
    findings.push(downgrade);
  }

  const widening = detectPrecisionWidening(before, after);

  if (widening) {
    findings.push(widening);
  }

  let severity = 'ok';

  if (findings.length > 0) {
    severity = context.sourceChanged ? 'flag' : 'warn';
  }

  return { findings, severity };
}

/**
 * Render one finding as a single readable line for the gate's console output
 * and the CI step summary.
 *
 * @param {{kind: string}} finding A finding from `detectWeakening`.
 * @returns {string} The rendered line (no leading bullet).
 */
export function formatFinding(finding) {
  switch (finding.kind) {
    case 'assertions-removed':
      return `assertions ${finding.before} → ${finding.after}`;
    case 'tests-removed':
      return `test blocks ${finding.before} → ${finding.after}`;
    case 'skip-or-focus-added':
      return `skip/focus markers ${finding.before} → ${finding.after}`;
    case 'matcher-downgrade': {
      const rows = (label, deltas) => deltas.map(d => `${label} ${d.matcher} ${d.from} → ${d.to}`).join('; ');

      return `matcher downgrade — ${rows('exact', finding.exactDrops)}; ${rows('bounded', finding.boundedRises)}`;
    }
    case 'precision-widened':
      return `toBeCloseTo precision widened — ${finding.widenings.map(w => `${w.from} → ${w.to} digits`).join('; ')}`;
    default:
      return String(finding.kind);
  }
}
