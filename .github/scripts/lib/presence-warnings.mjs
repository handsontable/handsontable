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
 * The four detectors, and what each one nudges:
 * - frozen-suite growth — ≥3 new `it` blocks appended to MODIFIED frozen
 *   Jasmine specs (the gate accepts an edited `*.spec.js` as coverage, so
 *   appended blocks are otherwise invisible). New E2E belongs in Playwright.
 * - red-spec field — the PR ticks "Bug fix" but leaves the template's "spec
 *   that fails without this fix" line empty. CI only (needs the live body).
 * - RTL correlation — source added `isRtl`/`layoutDirection` logic and no
 *   test line mentions RTL.
 * - Walkontable routing — engine source changed with no engine-tier test.
 */
import { classify, isFrozenJasmineSpec } from './presence-gate.mjs';

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

  const text = body.replace(/<!--[\s\S]*?-->/g, '');
  const bugFixTicked = /^\s*-\s*\[[xX]\]\s+Bug fix\b/m.test(text);

  if (!bugFixTicked) {
    return false;
  }

  const line = text.match(/^\s*-\s*For a bug fix\s*[-–—]\s*the spec that fails without this fix:(.*)$/m);

  if (!line) {
    return false;
  }

  return line[1].trim() === '';
}

/**
 * RTL correlation: production source gained `isRtl`/`layoutDirection` logic
 * and no test file gained a line that mentions RTL at all.
 *
 * @param {{path: string, added: string[]}[]} files Parsed diff files.
 * @returns {{sourceFiles: string[]}|null} The source files with new RTL logic,
 *   or null when there is none or a test line pairs it.
 */
export function rtlCorrelation(files) {
  const sourceFiles = files
    .filter(file => classify(file.path) === 'source' && file.added.some(line => SOURCE_RTL_RE.test(line)))
    .map(file => file.path);

  if (sourceFiles.length === 0) {
    return null;
  }

  const testMentionsRtl = files.some(file => classify(file.path) === 'test'
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
      message: 'RTL logic changed (`isRtl` / `layoutDirection` added in source) with no test line mentioning RTL. '
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
