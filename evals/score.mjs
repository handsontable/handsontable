// Meaningfulness scorer for a single test file — the dependency-free half of the
// test-generation evals (DEV-2061, part of DEV-2055).
//
// Static signals only: assertion counts, hollow it()/test() blocks, anti-gaming
// markers, and determinism smells. They are necessary conditions for a meaningful
// test, not sufficient ones — the sufficiency half (mutation kill rate via
// StrykerJS) is dependency-gated and reported through the `mutation` field.
//
// Usage: node evals/score.mjs <test-file> [--diff <diff-file>]
// Output: a single JSON score object on stdout.

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

// The handsontable package dir, resolved from THIS file's location (evals/) so
// mutation runs work regardless of the caller's cwd.
const HOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'handsontable');
import { countAssertions, countSkipFocus } from '../.github/scripts/lib/test-weakening.mjs';

/**
 * Matches the opening of a test block: `it(`, `test(`, the focused/skipped
 * prefix forms (`fit(`, `xit(`, `xtest(`), and the dot-modifier forms
 * (`it.only(`, `test.skip(`, `test.fixme(`, …). The lookbehind rejects member
 * accesses such as `/re/.test(` and `suite.it(`, and `describe`/`beforeEach`
 * never match because the `(` must follow immediately.
 */
const TEST_MODIFIERS = 'only|skip|fixme|fails|failing|flaky|concurrent|serial|todo';
const TEST_CALL_RE = new RegExp(
  `(?<![\\w$.])(?:[xf](?:it|test)|(?:it|test)(?:\\.(?:${TEST_MODIFIERS}))?)\\s*\\(`,
  'g',
);

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
 * Extract every it()/test() block from a spec source, with its title and the
 * number of assertion-like calls inside its argument list (the assertion regex
 * is shared with the test-weakening detector).
 *
 * @param {string} src The spec file contents.
 * @returns {{marker: string, title: string, assertions: number}[]} One entry per test block.
 */
export function extractTestBlocks(src) {
  const blocks = [];

  for (const match of src.matchAll(TEST_CALL_RE)) {
    const openParen = match.index + match[0].length - 1;
    const closeParen = scanBalanced(src, openParen);
    const body = closeParen === -1 ? src.slice(openParen + 1) : src.slice(openParen + 1, closeParen);
    const titleMatch = body.match(/^\s*(['"`])((?:\\.|(?!\1).)*)\1/);

    blocks.push({
      marker: match[0].replace(/\s*\($/, ''),
      title: titleMatch ? titleMatch[2] : '(untitled)',
      assertions: countAssertions(body),
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
 * A rendered-count read: the legacy-suite helpers (`countVisibleRows()`,
 * `countRenderedCols()`, `getRenderedRowsCount()`) and a `:visible` selector
 * (the Playwright-tier way to count what is on screen).
 */
const RENDERED_COUNT_RE = /(?<![\w$])(?:countVisible\w*|countRendered\w*|getRendered\w*Count)\s*\(|:visible\b/g;

/**
 * What pins a viewport so a rendered count is deterministic across themes:
 * an explicit `width:`/`height:` in the grid setup, or a `scrollViewportTo`.
 * `rowHeights:`/`colWidths:` do not match (case-sensitive, word-bounded).
 */
const VIEWPORT_PIN_RE = /\b(?:width|height)\s*:|\bscrollViewportTo\b/;

/**
 * An awaited value captured into a plain identifier: `const x = await …`.
 * Destructuring captures are out of scope.
 */
const AWAITED_CAPTURE_RE = /(?<![\w$.])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\b/g;

/**
 * The start of an assertion call, including namespaced forms (`expect.poll(`,
 * `assert.equal(`). Shares its name family with `countAssertions`.
 */
const ASSERTION_CALL_RE = /(?<![\w$])(?:expect|assert|verify)\w*(?:\.\w+)*\s*\(/g;

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
 * Locate every test block as its title and body text.
 *
 * @param {string} src The spec file contents.
 * @returns {{title: string, body: string}[]} One entry per it()/test() block.
 */
function testBodies(src) {
  const bodies = [];

  for (const match of src.matchAll(TEST_CALL_RE)) {
    const openParen = match.index + match[0].length - 1;
    const closeParen = scanBalanced(src, openParen);
    const body = closeParen === -1 ? src.slice(openParen + 1) : src.slice(openParen + 1, closeParen);
    const titleMatch = body.match(/^\s*(['"`])((?:\\.|(?!\1).)*)\1/);

    bodies.push({ title: titleMatch ? titleMatch[2] : '(untitled)', body });
  }

  return bodies;
}

/**
 * Count rendered-count reads whose viewport is not pinned: no enclosing
 * describe (or, for a top-level test, the whole file) sets an explicit
 * `width`/`height` or scrolls with `scrollViewportTo`. Row heights differ per
 * theme (main/horizon/classic), so an unpinned "how many rows rendered" count
 * is a different number on each leg of the theme matrix.
 *
 * @param {string} src The spec file contents.
 * @returns {number} The number of unpinned rendered-count reads.
 */
export function findViewportSmells(src) {
  const code = blankComments(src);
  const scopes = describeScopes(code);
  let count = 0;

  for (const match of code.matchAll(RENDERED_COUNT_RE)) {
    const enclosing = scopes.filter(scope => scope.start <= match.index && match.index <= scope.end);
    const texts = enclosing.length > 0 ? enclosing.map(scope => scope.body) : [code];

    if (!texts.some(text => VIEWPORT_PIN_RE.test(text))) {
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
 * Find awaited captures (`const x = await …`) inside test bodies whose
 * identifier never reaches an assertion: not inside an assertion call or its
 * matcher chain, and not the receiver of an assertion helper (`x.expectFoo(`).
 * A value fetched and then dropped is the shape of a test that runs code
 * without checking it.
 *
 * @param {string} src The spec file contents.
 * @returns {{test: string, name: string}[]} One entry per unasserted capture.
 */
export function findUnassertedCaptures(src) {
  const captures = [];

  for (const { title, body } of testBodies(blankComments(src))) {
    const spans = assertionSpans(body);

    for (const capture of body.matchAll(AWAITED_CAPTURE_RE)) {
      const name = capture[1];
      const from = capture.index + capture[0].length;
      const useRe = new RegExp(`(?<![\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');
      const receiverRe = /^\s*\??\.\s*(?:expect|assert|verify)\w*\s*\(/;
      let asserted = false;

      for (const use of body.slice(from).matchAll(useRe)) {
        const index = use.index + from;

        if (spans.some(([start, end]) => index >= start && index <= end)
          || receiverRe.test(body.slice(index + name.length))) {
          asserted = true;
          break;
        }
      }

      if (!asserted) {
        captures.push({ test: title, name });
      }
    }
  }

  return captures;
}

/**
 * Detect determinism smells — fixed sleeps and load-state waits that make a
 * test timing-dependent instead of condition-based (web-first waits), plus a
 * rendered-row count with no pinned viewport, which reads differently on each
 * theme of the matrix.
 *
 * @param {string} src The spec file contents.
 * @returns {{type: string, count: number}[]} One entry per smell type found.
 */
export function findDeterminismSmells(src) {
  const patterns = [
    ['sleep-call', /\bsleep\s*\(/g],
    ['wait-for-timeout', /\bwaitForTimeout\s*\(/g],
    ['network-idle', /\bnetworkidle\b/g],
  ];
  const smells = [];

  for (const [type, re] of patterns) {
    const count = (src.match(re) || []).length;

    if (count > 0) {
      smells.push({ type, count });
    }
  }

  const viewport = findViewportSmells(src);

  if (viewport > 0) {
    smells.push({ type: 'theme-sensitive-viewport', count: viewport });
  }

  return smells;
}

/**
 * Detect structure smells — shapes that let a test run code without checking
 * it. Today: awaited captures that never reach an assertion.
 *
 * @param {string} src The spec file contents.
 * @returns {{type: string, count: number, detail: string}[]} One entry per smell type found.
 */
export function findStructureSmells(src) {
  const captures = findUnassertedCaptures(src);

  if (captures.length === 0) {
    return [];
  }

  return [{
    type: 'unasserted-capture',
    count: captures.length,
    detail: captures.map(capture => `\`${capture.name}\` in "${capture.test}"`).join(', '),
  }];
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

/**
 * Run StrykerJS scoped to the given source files and return the kill-rate
 * summary. ALWAYS scope with `--mutate` (never whole-tree — that is minutes per
 * file). Slow (~40s+/file) and requires `build:styles` once per clone, so it is
 * opt-in, never on the default fast static path.
 *
 * @param {string[]} sourceFiles Source paths to mutate (relative to the handsontable package).
 * @param {{cwd?: string, run?: Function, readReport?: Function}} [deps] Injectable IO for tests.
 * @returns {{available: boolean, reason?: string} & Partial<ReturnType<parseMutationReport>>} The result.
 */
export function runMutation(sourceFiles, deps = {}) {
  const status = deps.status ?? getMutationStatus();

  if (!status.available) {
    return status;
  }

  if (!sourceFiles || sourceFiles.length === 0) {
    return { available: true, reason: 'no source files passed to --mutate' };
  }

  const cwd = deps.cwd ?? HOT_DIR;
  const run = deps.run ?? ((cmd) => execSync(cmd, { cwd, shell: '/bin/bash', stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const readReport = deps.readReport ?? (() => JSON.parse(readFileSync(resolve(cwd, 'reports/mutation/mutation.json'), 'utf8')));

  try {
    // Pinned Babel transform + commonjs env — Stryker's worker cwd breaks
    // cwd-relative Babel discovery (see handsontable/jest.stryker.config.js).
    run(`BABEL_ENV=commonjs npx env-cmd -f ../hot.config.js npx stryker run --mutate ${
      sourceFiles.map(f => `'${f}'`).join(' ')} --reporters json`);

    return { available: true, ...parseMutationReport(readReport()) };
  } catch (error) {
    return { available: true, reason: `stryker run failed: ${error.message.split('\n')[0]}` };
  }
}

/**
 * Score a test source for meaningfulness. `problems` fail the bar (verdict
 * `suspect`); `warnings` are informational.
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
  const problems = [];
  const warnings = [];

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
    problems.push({
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
    tests: blocks.length,
    assertions: countAssertions(src),
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
 * Score a test file from disk, optionally against a source-diff file.
 *
 * @param {string} filePath Path to the test file.
 * @param {{diffPath?: string}} [options={}] Optional path to a unified-diff file.
 * @returns {Promise<object>} The score object, with the file path attached.
 */
export async function scoreTestFile(filePath, options = {}) {
  const src = await readFile(filePath, 'utf8');
  const diff = options.diffPath ? await readFile(options.diffPath, 'utf8') : undefined;
  // Live mutation is opt-in (slow): only when --mutate names source files.
  const mutation = options.mutate?.length ? runMutation(options.mutate) : undefined;

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
