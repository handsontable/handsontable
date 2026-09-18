/**
 * Presence-gate advisory warnings — pure detectors.
 *
 * Everything here is WARN-only. The CLI (test-presence-gate.mjs) prints these
 * as a non-blocking section under the verdict and they never touch the exit
 * code, in either GATE_MODE. Each detector is a pure function over a parsed
 * unified diff, a `git diff --name-status` list, or the PR body, so it is
 * unit-testable without git. A gap in the input (no body locally, no diff) is
 * silence, never a finding — a hook that false-positives gets disabled, which
 * is worse than no hook (see .ai/LOCAL-ENFORCEMENT.md §2).
 *
 * The five detectors, and what each one nudges:
 * - frozen-suite growth — ≥3 new `it` blocks appended to MODIFIED frozen
 *   Jasmine specs (the gate accepts an edited `*.spec.js` as coverage, so
 *   appended blocks are otherwise invisible). New E2E belongs in Playwright.
 * - red-spec field — the PR ticks "Bug fix" but leaves the template's "spec
 *   that fails without this fix" line empty. CI only (needs the live body).
 * - RTL correlation — source added `isRtl`/`layoutDirection` logic and no
 *   test-side line mentions RTL. Test-side is a file the gate classifies as
 *   'test' plus anything under `tests/**`: a Playwright page object or helper
 *   there is 'neither' to the gate (it is not coverage), yet it is where the
 *   RTL setup usually lands. The CLI limits its diff to `isAdvisoryPath()`
 *   files, which admits `tests/**` for exactly this reason — a pathspec built
 *   from the gate's classifier alone would drop the page object before the
 *   detector ever saw it, and the warning would fire on a paired change.
 * - Walkontable routing — engine source changed with no engine-tier test. It
 *   deliberately requires classify(path) === 'source' (a spec or helper under
 *   `walkontable/test/` is never "the engine changed") and ignores a D status
 *   (a deletion needs no new coverage).
 * - visual-only coverage — production source changed and every change the
 *   gate counts as coverage is a spec under `visual-tests/` (the gate's
 *   `.spec.ts` rule admits one, whatever its status). A screenshot proves
 *   pixels, not behavior. Added, modified, and renamed specs count; a deleted
 *   one counts on neither side; and it is silent when there is no coverage at
 *   all, because the verdict already says `missing-coverage`. It reads the
 *   `--name-status` list, never the diff, so `isAdvisoryPath()` and the CLI's
 *   pathspec are untouched. Its `::warning` annotations are the month of data
 *   that decides whether a visual spec keeps counting as coverage on its own
 *   (the advisory paragraph in .ai/LOCAL-ENFORCEMENT.md holds the criterion
 *   and the tally recipe).
 */
import { classify, isCoverage, isFrozenJasmineSpec } from './presence-gate.mjs';

/**
 * Matches a NEW test-block opener on an added line: `it(`, `it.each(`, `fit(`.
 * The lookbehind rejects `xit(` (a skipped block does not grow the running
 * suite), member calls (`suite.it(`), and `/re/.test(`.
 */
const NEW_TEST_BLOCK_RE = /(?<![\w$.])f?it(?:\.each)?\s*\(/;

/**
 * RTL logic in production source: the API names, case-sensitive.
 */
const SOURCE_RTL_RE = /isRtl|layoutDirection/;

/**
 * RTL awareness in a test: any mention, case-insensitive (`rtl`, `RTL layout`,
 * `layoutDirection: 'rtl'`).
 */
const TEST_RTL_RE = /rtl|layoutDirection/i;

/**
 * The Playwright package: specs, page objects, fixtures, and helpers alike.
 */
const TESTS_PACKAGE_RE = /^tests\//;

/**
 * The visual regression package. Its `*.spec.ts` files satisfy the gate through
 * the `.spec.ts` rule in presence-gate.mjs (`COVERAGE_ANY_STATUS`), which makes
 * a screenshot the cheapest coverage a source change can carry. All 112 visual
 * specs live under `visual-tests/tests/` (measured 2026-09-18: 69 js-only, 23
 * multi-frameworks, 20 cross-browser), and `tests/playwright.config.ts` reserves
 * `tests/visual/` as a later home — so this constant is the one place to widen.
 * Deliberately not `docs/tests/`: its screenshot spec counts as coverage for a
 * core change too, but a docs spec beside a core change is not the shape this
 * warning is about, and admitting it invites the false positive that gets a
 * hook disabled. Exported so the tests assert the prefix instead of re-deriving it.
 */
export const VISUAL_SPEC_RE = /^visual-tests\//;

const WALKONTABLE_SOURCE_RE = /^handsontable\/src\/3rdparty\/walkontable\/src\//;
const WALKONTABLE_TEST_RE = [
  /^handsontable\/src\/3rdparty\/walkontable\/test\//,
  /^tests\/e2e\/walkontable\//,
];

/**
 * Parse a unified diff (`git diff`, ideally `--unified=0`) into per-file added
 * lines. Only the head-side path matters, so renames resolve to their new
 * name; a deleted file (`+++ /dev/null`) contributes nothing. The header region
 * ends at the `+++` line that follows a `---` line, so an added content line
 * that itself starts with `++` is never mistaken for a header.
 *
 * @param {string} diff The unified diff text.
 * @returns {{path: string, isNew: boolean, added: string[]}[]} One entry per
 *   file that has a head side, in diff order.
 */
export function parseUnifiedDiff(diff) {
  const files = [];
  let current = null;
  let sawOldHeader = false;

  for (const line of (diff || '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = { path: null, isNew: false, added: [] };
      sawOldHeader = false;
      continue;
    }

    if (current === null) {
      continue;
    }

    if (current.path === null) {
      // Header region: `index`, `new file mode`, `rename from/to`, `---`, `+++`.
      if (line.startsWith('--- ')) {
        current.isNew = line === '--- /dev/null';
        sawOldHeader = true;

      } else if (sawOldHeader && line.startsWith('+++ ')) {
        const target = line.slice(4).replace(/\t.*$/, '');

        if (target === '/dev/null') {
          // A deletion: nothing is added, and nothing below is content.
          current = null;
        } else {
          current.path = target.replace(/^b\//, '');
          files.push(current);
        }
      }
      continue;
    }

    if (line.startsWith('+')) {
      current.added.push(line.slice(1));
    }
  }

  return files;
}

/**
 * Count the test-block openers (`it(`, `it.each(`, `fit(`) among added lines,
 * ignoring line comments and block-comment continuation lines.
 *
 * @param {string[]} lines Added lines (without the leading `+`).
 * @returns {number} The number of new test blocks.
 */
export function countNewTestBlocks(lines) {
  let count = 0;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
      continue;
    }

    if (NEW_TEST_BLOCK_RE.test(line.replace(/\/\/.*$/, ''))) {
      count += 1;
    }
  }

  return count;
}

/**
 * Frozen-suite growth: new test blocks appended to MODIFIED frozen Jasmine
 * specs. A NEW `*.spec.js` is excluded — the gate already blocks it.
 *
 * @param {{path: string, isNew: boolean, added: string[]}[]} files Parsed diff files.
 * @param {{threshold?: number}} [options] `threshold` — total new blocks that warn (default 3).
 * @returns {{files: {path: string, added: number}[], total: number}|null} The
 *   finding, or null below the threshold.
 */
export function frozenSuiteGrowth(files, { threshold = 3 } = {}) {
  const grown = files
    .filter(file => !file.isNew && isFrozenJasmineSpec(file.path))
    .map(file => ({ path: file.path, added: countNewTestBlocks(file.added) }))
    .filter(file => file.added > 0);
  const total = grown.reduce((sum, file) => sum + file.added, 0);

  return total >= threshold ? { files: grown, total } : null;
}

/**
 * Strip HTML comments from a Markdown body. An index scanner rather than a
 * regex replace: removing one comment can splice its neighbors into a new
 * `<!--` (`<!<!-- -->--`), which a single pass leaves behind, so after each
 * removal the scan resumes just before the seam and runs until no opener is
 * left. Comments do not nest — the first `-->` closes — and an unterminated
 * `<!--` hides the rest of the text, as it does in the rendered body.
 *
 * @param {string} text The body text.
 * @returns {string} The text with every comment removed.
 */
export function stripHtmlComments(text) {
  let out = text;
  let from = 0;

  for (;;) {
    const open = out.indexOf('<!--', from);

    if (open === -1) {
      return out;
    }

    const close = out.indexOf('-->', open + 4);

    if (close === -1) {
      return out.slice(0, open);
    }

    out = out.slice(0, open) + out.slice(close + 3);
    // The splice may have formed a new opener across the seam: `<!` + `--`.
    from = Math.max(0, open - 3);
  }
}

/**
 * Red-spec field: the PR body ticks "Bug fix" but the template's "For a bug
 * fix — the spec that fails without this fix:" line carries nothing after the
 * colon once HTML comments (the `<!-- name -->` placeholder) are stripped. A
 * body without that line at all is not judged — the author removed the
 * Test-evidence section, or the template predates it — so it stays silent.
 *
 * @param {string|null|undefined} body The live PR body.
 * @returns {boolean} True when the field is demanded and empty.
 */
export function redSpecFieldMissing(body) {
  if (!body) {
    return false;
  }

  const text = stripHtmlComments(body);
  const bugFixTicked = /^\s*-\s*\[[xX]\]\s+Bug fix\b/m.test(text);

  if (!bugFixTicked) {
    return false;
  }

  const line = text.match(/^([ \t]*)-\s*For a bug fix\s*[-–—]\s*the spec that fails without this fix:(.*)$/m);

  if (!line) {
    return false;
  }

  if (line[2].trim() !== '') {
    return false;
  }

  return !hasContinuation(text.slice(line.index + line[0].length), line[1].length);
}

/**
 * Does the text after the template line carry the answer? The next non-blank
 * line counts when it is free text or a list item nested deeper than the
 * template line; a sibling item (the next template line) or a heading (the
 * next section) means nothing was written.
 *
 * @param {string} rest The body text after the template line.
 * @param {number} indent The template line's indentation width.
 * @returns {boolean} True when a continuation line holds content.
 */
function hasContinuation(rest, indent) {
  for (const raw of rest.split('\n')) {
    if (raw.trim() === '') {
      continue;
    }

    if (/^\s*#/.test(raw)) {
      return false;
    }

    const item = raw.match(/^([ \t]*)(?:[-*+]|\d+[.)])\s/);

    return !(item && item[1].length <= indent);
  }

  return false;
}

/**
 * Is the file on the test side for the RTL pairing? The gate's 'test' class
 * plus anything under `tests/**`: a Playwright page object or helper there is
 * 'neither' to the gate (it is not coverage), yet it is where the RTL setup
 * (`initGrid({ layoutDirection: 'rtl' })`) usually lands, and a spec that
 * calls it need not spell "rtl" itself.
 *
 * @param {string} path Repo-relative path.
 * @returns {boolean} True for a test file or any file of the Playwright package.
 */
function isTestSide(path) {
  return classify(path) === 'test' || TESTS_PACKAGE_RE.test(path);
}

/**
 * Does a changed file feed the diff-based detectors at all? Every file the gate
 * classifies as source or test, plus the whole Playwright package — the same
 * set `isTestSide()` accepts, so the CLI's pathspec and the RTL pairing agree
 * on what a page object is. Lockfiles, docs, and CI files stay out of the
 * buffer.
 *
 * @param {string} path Repo-relative path.
 * @returns {boolean} True when the file belongs in the advisory diff.
 */
export function isAdvisoryPath(path) {
  return classify(path) !== 'neither' || TESTS_PACKAGE_RE.test(path);
}

/**
 * RTL correlation: production source gained `isRtl`/`layoutDirection` logic
 * and no test-side file gained a line that mentions RTL at all.
 *
 * @param {{path: string, added: string[]}[]} files Parsed diff files.
 * @returns {{sourceFiles: string[]}|null} The source files with new RTL logic,
 *   or null when there is none or a test-side line pairs it.
 */
export function rtlCorrelation(files) {
  const sourceFiles = files
    .filter(file => classify(file.path) === 'source' && file.added.some(line => SOURCE_RTL_RE.test(line)))
    .map(file => file.path);

  if (sourceFiles.length === 0) {
    return null;
  }

  const testMentionsRtl = files.some(file => isTestSide(file.path)
    && file.added.some(line => TEST_RTL_RE.test(line)));

  return testMentionsRtl ? null : { sourceFiles };
}

/**
 * Walkontable routing: engine source changed (added or modified) with no
 * change under either engine-tier test tree.
 *
 * @param {{status: string, path: string}[]} changes Parsed `--name-status` entries.
 * @returns {{engineFiles: string[]}|null} The engine files, or null when
 *   nothing in the engine changed or an engine-tier test changed too.
 */
export function walkontableRouting(changes) {
  const engineFiles = changes
    .filter(change => change.status !== 'D' && WALKONTABLE_SOURCE_RE.test(change.path) && classify(change.path) === 'source')
    .map(change => change.path);

  if (engineFiles.length === 0) {
    return null;
  }

  const engineTestChanged = changes.some(change => WALKONTABLE_TEST_RE.some(re => re.test(change.path)));

  return engineTestChanged ? null : { engineFiles };
}

/**
 * Visual-only coverage: production source changed and every change that
 * satisfies the gate is a spec under `visual-tests/` — no unit test, no
 * `tests/e2e` spec, no wrapper spec, no `*.types.ts`, no edited Jasmine spec.
 * A screenshot proves pixels, not behavior.
 *
 * Deletions count on neither side. A removed source file needs no test, and a
 * removed visual spec is not the coverage this warning is about — that the gate
 * still accepts a deleted `*.spec.ts` as coverage (`COVERAGE_ANY_STATUS` is
 * status-independent) is a separate matter, left alone here because changing
 * it changes verdicts. Added, modified, and renamed specs all count: the
 * question is what proves the source change, not whether the spec is new, and
 * a one-line edit to an existing capture spec is a cheaper gate-pass than a new
 * file. Silent when there is no coverage at all — the verdict already says
 * `missing-coverage`, and a warning under it would repeat it. Pure over the
 * `--name-status` list: it never reads the diff, so `isAdvisoryPath()` and the
 * CLI's pathspec stay as they are.
 *
 * Measured over 1244 first-parent commits since 2026-03-01 (a scratch script
 * running this predicate over `git diff-tree -M --name-status`): one would have
 * fired — #12086, a `preventOverflow` scroll fix in `overlays.js` proven by a
 * new visual spec — and none since the gate shipped on 2026-07-22. A count
 * alone therefore decides nothing, which is why the decision this feeds is
 * written down in advance (the advisory paragraph in .ai/LOCAL-ENFORCEMENT.md):
 * the `::warning` annotations are the month of data, and a month of zero is a
 * result too. #12086 is also the counter-example to keep the wording a nudge —
 * a scroll fix a screenshot did prove — so the message asks for the assertion
 * beside the capture, never instead of it.
 *
 * @param {{status: string, path: string}[]} changes Parsed `--name-status` entries.
 * @returns {{sourceFiles: string[], visualSpecs: string[]}|null} The source
 *   files and the specs (each suffixed with its status letter), or null.
 */
export function visualOnlyCoverage(changes) {
  const live = changes.filter(change => change.status !== 'D');
  const sourceFiles = live
    .filter(change => classify(change.path) === 'source')
    .map(change => change.path);

  if (sourceFiles.length === 0) {
    return null;
  }

  const coverage = live.filter(change => isCoverage(change));

  if (coverage.length === 0 || !coverage.every(change => VISUAL_SPEC_RE.test(change.path))) {
    return null;
  }

  return {
    sourceFiles,
    visualSpecs: coverage.map(change => `${change.path} (${change.status})`),
  };
}

/**
 * Run every detector and return the warnings to print. The body-dependent
 * check runs only when a body is supplied (CI); locally it is skipped silently.
 *
 * @param {{changes?: {status: string, path: string}[], diff?: string, prBody?: string|null}} [input] The inputs.
 * @returns {{type: string, message: string, files: string[]}[]} The warnings, possibly empty.
 */
export function collectWarnings({ changes = [], diff = '', prBody } = {}) {
  const warnings = [];
  const files = parseUnifiedDiff(diff);
  const growth = frozenSuiteGrowth(files);

  if (growth) {
    warnings.push({
      type: 'frozen-suite-growth',
      message: `${growth.total} new \`it\` block(s) in modified frozen Jasmine specs: large Jasmine additions — `
        + 'new E2E belongs in Playwright (tests/e2e); state the justification in the PR if the frozen tier is right.',
      files: growth.files.map(file => `${file.path} (+${file.added})`),
    });
  }

  if (prBody !== undefined && prBody !== null && redSpecFieldMissing(prBody)) {
    warnings.push({
      type: 'red-spec-field',
      message: 'The PR is marked as a **Bug fix** but the "spec that fails without this fix" line in the '
        + 'Test-evidence section is empty. Name the regression test that was red before the fix — '
        + 'a regression guard that was never red proves nothing.',
      files: [],
    });
  }

  const rtl = rtlCorrelation(files);

  if (rtl) {
    warnings.push({
      type: 'rtl-correlation',
      message: 'RTL logic changed (`isRtl` / `layoutDirection` added in source) with no test-side line mentioning RTL. '
        + 'Cover the change under `layoutDirection: \'rtl\'` too — mirrored offsets are the classic escape.',
      files: rtl.sourceFiles,
    });
  }

  const walkontable = walkontableRouting(changes);

  if (walkontable) {
    warnings.push({
      type: 'walkontable-routing',
      message: 'Walkontable engine source changed with no engine-tier test change. The rendering engine has its own '
        + 'tiers — `tests/e2e/walkontable/` (Playwright, preferred) or an existing spec under '
        + '`handsontable/src/3rdparty/walkontable/test/` — a core-level test rarely pins the overlay/viewport math.',
      files: walkontable.engineFiles,
    });
  }

  const visualOnly = visualOnlyCoverage(changes);

  if (visualOnly) {
    warnings.push({
      type: 'visual-only-coverage',
      // One line, no backticks or asterisks: the CLI's annotation() strips both
      // before the text becomes a `::warning`, and the pointer has to survive it.
      message: 'Source changed and the only test changes beside it are visual specs under visual-tests/. A screenshot '
        + 'proves pixels, not behavior — add the Playwright assertion in tests/e2e/ (or a unit test) that would fail '
        + 'if the behavior broke, and keep the visual spec for what only pixels can show. '
        + 'Rule: visual-tests/AGENTS.md → Decision rule.',
      files: [...visualOnly.sourceFiles, ...visualOnly.visualSpecs],
    });
  }

  return warnings;
}

/**
 * Render warnings as a GitHub-flavored Markdown section for the step summary /
 * sticky comment. Empty input renders nothing.
 *
 * @param {{type: string, message: string, files?: string[]}[]} warnings The warnings.
 * @returns {string[]} Markdown lines, empty when there is nothing to say.
 */
export function renderWarnings(warnings) {
  if (!warnings || warnings.length === 0) {
    return [];
  }

  const lines = [
    '### Advisory warnings (non-blocking)',
    '',
    'Heuristic signals for the author and the reviewer. They never affect the verdict above.',
    '',
  ];

  for (const warning of warnings) {
    lines.push(`- ⚠️ **${warning.type}** — ${warning.message}`);

    for (const file of warning.files ?? []) {
      lines.push(`    - \`${file}\``);
    }
  }

  return lines;
}
