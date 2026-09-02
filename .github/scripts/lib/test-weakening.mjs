/**
 * Test-weakening detector — the mechanical counterpart to "green is not the goal".
 *
 * The presence gate proves a test exists; the hooks prove it passes; the ESLint
 * guards catch focused/skipped/assertion-free tests at author time. This detector
 * catches the subtler gaming move: quietly *weakening an existing spec* to reach
 * green — dropping assertions, adding a skip/focus, loosening an exact matcher
 * into a bounded one, or widening a `toBeCloseTo` tolerance — especially in the
 * same change that touches source.
 *
 * Counting assertions alone misses two real shapes. Replacing
 * `toHaveBeenCalledTimes(300)` with `toBeGreaterThanOrEqual(300)` while ADDING a
 * third assertion makes the count rise; deleting a committed-value `toBe` while
 * adding another assertion keeps it flat. Both loosen what the spec proves, so
 * the detector also diffs a per-matcher histogram: an exact matcher's count
 * dropping AND a bounded matcher's count rising in the same file reads as a
 * downgrade.
 *
 * It is intentionally heuristic and text-based (regex over before/after content),
 * so it is a strong SIGNAL to surface (warn), not a proof. It never inspects intent
 * — a reviewer/agent still decides whether a reduction was legitimate (e.g. a real
 * refactor that merged two assertions, or a timing-dependent count that a bound
 * describes more honestly).
 *
 * Known blind spots, so a reviewer reads a finding — or its absence — correctly:
 *
 * - Every counter is a regex over raw text, so an `expect(` or a matcher inside
 *   a comment or a string literal counts like live code (inherited from
 *   `countAssertions`). Commenting an assertion out therefore does NOT read as a
 *   removal, and a comment that quotes `toBe(` inflates the histogram.
 * - `detectPrecisionWidening` pairs the digits that changed largest-with-largest
 *   once the unchanged ones cancel out. When one change both widens and tightens
 *   in the same file, the reported pairs need not be the real edits, and a
 *   widening can hide behind a larger tightening: `5 → 4` next to `1 → 6`
 *   reports nothing.
 */

/**
 * Matchers that pin a value, a count, or a call exactly. Trading one of these
 * for a `BOUNDED_MATCHERS` entry keeps the assertion count but loosens what the
 * test proves. Names only — the call paren is matched by `MATCHER_CALL_RE`.
 *
 * @type {ReadonlyArray<string>}
 */
export const EXACT_MATCHERS = Object.freeze([
  'toBe',
  'toEqual',
  'toStrictEqual',
  'toHaveBeenCalledTimes',
  'toHaveLength',
  'toHaveBeenCalledWith',
  'toHaveBeenLastCalledWith',
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
]);

/**
 * One matcher call: a dot, the matcher name, the call paren. Requiring the paren
 * right after the name is what keeps `toBe(` from swallowing `toBeGreaterThan(`
 * and `toMatch(` from swallowing `toMatchObject(`; longest-first alternation
 * makes that hold regardless of engine backtracking. `.not.toBe(` and a chain
 * broken across lines (`expect(x)\n  .toBe(1)`) both match.
 */
const MATCHER_CALL_RE = new RegExp(
  `\\.\\s*(${[...EXACT_MATCHERS, ...BOUNDED_MATCHERS].sort((a, b) => b.length - a.length).join('|')})\\s*\\(`,
  'g',
);

/**
 * `toBeCloseTo(value)` without a digits argument compares to 2 decimal places in
 * both Jest and Jasmine, so dropping the argument from `toBeCloseTo(x, 5)` is a
 * widening too.
 */
const CLOSE_TO_DEFAULT_DIGITS = 2;

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
 * Count every `EXACT_MATCHERS` / `BOUNDED_MATCHERS` call in a source string, by
 * matcher name. Matchers that do not occur are absent (not zero), so the result
 * reads as a sparse histogram. Text-based like `countAssertions`: a matcher
 * named inside a comment or a string literal counts too.
 *
 * @param {string} src The spec file contents.
 * @returns {Record<string, number>} Matcher name → number of calls.
 */
export function matcherHistogram(src) {
  const histogram = {};

  if (!src) {
    return histogram;
  }

  for (const match of src.matchAll(MATCHER_CALL_RE)) {
    histogram[match[1]] = (histogram[match[1]] ?? 0) + 1;
  }

  return histogram;
}

/**
 * Diff two histograms over a matcher table, keeping the rows a predicate selects.
 *
 * @param {ReadonlyArray<string>} matchers The matcher names to compare.
 * @param {Record<string, number>} before The base-side histogram.
 * @param {Record<string, number>} after The head-side histogram.
 * @param {(delta: {matcher: string, from: number, to: number}) => boolean} keep Row filter.
 * @returns {{matcher: string, from: number, to: number}[]} The selected rows, in table order.
 */
function histogramDeltas(matchers, before, after, keep) {
  return matchers
    .map(matcher => ({ matcher, from: before[matcher] ?? 0, to: after[matcher] ?? 0 }))
    .filter(keep);
}

/**
 * Detect an exact → bounded matcher downgrade between two revisions of one spec:
 * at least one `EXACT_MATCHERS` count dropped AND at least one `BOUNDED_MATCHERS`
 * count rose. Either half alone is not a finding — a plain removal is already
 * `assertions-removed`, and adding a relational assertion is the documented
 * pattern for values no token derives.
 *
 * @param {string} before The spec contents at the base revision.
 * @param {string} after The spec contents at the head revision.
 * @returns {{kind: 'matcher-downgrade', exactDrops: {matcher: string, from: number, to: number}[],
 *   boundedRises: {matcher: string, from: number, to: number}[]}|null} The finding, or null.
 */
export function detectMatcherDowngrade(before, after) {
  const histogramBefore = matcherHistogram(before);
  const histogramAfter = matcherHistogram(after);
  const exactDrops = histogramDeltas(
    EXACT_MATCHERS, histogramBefore, histogramAfter, delta => delta.to < delta.from,
  );
  const boundedRises = histogramDeltas(
    BOUNDED_MATCHERS, histogramBefore, histogramAfter, delta => delta.to > delta.from,
  );

  if (exactDrops.length === 0 || boundedRises.length === 0) {
    return null;
  }

  return { kind: 'matcher-downgrade', exactDrops, boundedRises };
}

/**
 * Split a call's argument list at its top-level commas, skipping string literals
 * and nested brackets. A heuristic scanner (a regex literal holding an unbalanced
 * bracket can confuse it), which is acceptable here: an unbalanced list yields
 * null, and the caller treats "cannot judge" as "no finding".
 *
 * @param {string} src The source text.
 * @param {number} start Index just past the call's opening `(`.
 * @returns {string[]|null} The raw argument texts, or null when the list never closes.
 */
function splitTopLevelArgs(src, start) {
  const args = [];
  let depth = 0;
  let argStart = start;
  let i = start;

  while (i < src.length) {
    const ch = src[i];

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
        args.push(src.slice(argStart, i));

        return args;
      }
      depth -= 1;

    } else if (ch === ',' && depth === 0) {
      args.push(src.slice(argStart, i));
      argStart = i + 1;
    }
    i += 1;
  }

  return null;
}

/**
 * Collect the `numDigits` argument of every `toBeCloseTo(value, numDigits)` call.
 * An omitted argument counts as the framework default; a call whose argument is
 * not an integer literal (a variable, an expression) is skipped, because a value
 * the detector cannot read must never produce a finding.
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

    if (args === null) {
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
 * a `kind` discriminator; the count-based kinds carry `before`/`after`, the
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
