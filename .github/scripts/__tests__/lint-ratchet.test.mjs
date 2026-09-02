import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import {
  RATCHETED_RULES,
  formatReport,
  parseAddedLines,
  selectRatchetedFiles,
  selectRatchetedFindings,
} from '../lib/lint-ratchet.mjs';

const SLEEP = 'handsontable/no-fixed-sleep-in-spec';
const FLAKY = 'handsontable/no-new-it-flaky';
const SKIP = 'handsontable/no-skipped-test';
const SPEC = 'handsontable/src/plugins/filters/__tests__/filters.spec.js';

/**
 * Build an ESLint `--format json` result entry the way ESLint 8 prints it.
 *
 * @param {string} filePath The linted file (absolute in real output).
 * @param {object[]} messages Lint messages.
 * @returns {object} One result entry.
 */
function result(filePath, messages) {
  return {
    filePath,
    messages,
    errorCount: messages.filter(m => m.severity === 2).length,
    warningCount: messages.filter(m => m.severity === 1).length,
    fatalErrorCount: messages.filter(m => m.fatal).length,
  };
}

/**
 * A single lint message.
 *
 * @param {string|null} ruleId The rule, or null for ESLint's own notices.
 * @param {number} line The reported line.
 * @param {object} [extra] Overrides (severity, fatal, message).
 * @returns {object} The message.
 */
function message(ruleId, line, extra = {}) {
  return { ruleId, severity: 1, message: `${ruleId} fired`, line, column: 1, ...extra };
}

// --- the rule set is the single source of truth, and it must exist in the config ---

test('RATCHETED_RULES names exactly the three warn-level determinism rules', () => {
  assert.deepEqual([...RATCHETED_RULES], [SLEEP, FLAKY, SKIP]);
});

test('every ratcheted rule is configured in handsontable/.eslintrc.js', () => {
  // A renamed or dropped rule would turn the ratchet into a silent no-op: ESLint
  // would emit nothing under the old id and the intersection would always be
  // empty. Pin the ids against the config that produces the warnings.
  const require = createRequire(import.meta.url);
  // The config lives at a path resolved from the repo root at runtime; the rule wants a literal.
  // eslint-disable-next-line import/no-dynamic-require
  const config = require(path.join(repoRoot(), 'handsontable/.eslintrc.js'));
  const configured = new Map();

  for (const override of config.overrides ?? []) {
    for (const [id, level] of Object.entries(override.rules ?? {})) {
      configured.set(id, Array.isArray(level) ? level[0] : level);
    }
  }

  for (const rule of RATCHETED_RULES) {
    assert.ok(configured.has(rule), `${rule} is not configured in handsontable/.eslintrc.js`);
    // The ratchet exists BECAUSE these are warnings. Should one graduate to
    // `error`, ESLint blocks it everywhere already and the id belongs out of
    // this list — the test says so instead of letting the two drift apart.
    assert.equal(configured.get(rule), 'warn', `${rule} is no longer warn-level — drop it from RATCHETED_RULES`);
  }
});

// --- selectRatchetedFiles: where the ratcheted rules apply ---

test('selects the frozen-suite specs and the unit tests under handsontable/, nothing else', () => {
  const changed = [
    SPEC,
    'handsontable/src/3rdparty/walkontable/test/spec/table.spec.js',
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/utils/__tests__/Interval.unit.ts',
    'handsontable/test/__tests__/esTarget.unit.js',
    'handsontable/src/plugins/filters/filters.ts', // source
    'handsontable/test/helpers/common.js', // a helper, not a spec
    'handsontable/tmp/plugins/filters/__tests__/filters.spec.js', // build output
    'tests/e2e/filters.spec.ts', // Playwright — its own config bans sleep at error
    'wrappers/react-wrapper/test/hotTable.spec.tsx',
    'handsontable/src/__tests__/core/settings.types.ts',
  ];

  assert.deepEqual(selectRatchetedFiles(changed), [
    SPEC,
    'handsontable/src/3rdparty/walkontable/test/spec/table.spec.js',
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/utils/__tests__/Interval.unit.ts',
    'handsontable/test/__tests__/esTarget.unit.js',
  ]);
});

// --- parseAddedLines ---

test('parseAddedLines reads -U0 hunks: added lines only, new-side numbering, several files', () => {
  const diff = [
    `diff --git a/${SPEC} b/${SPEC}`,
    'index 3c83c94a5..ffc19f1fd 100644',
    `--- a/${SPEC}`,
    `+++ b/${SPEC}`,
    '@@ -37,0 +38,2 @@ describe(\'Filters\', () => {',
    '+    await sleep(50);',
    '+    expect(true).toBe(true);',
    '@@ -70 +72 @@ describe(\'Filters\', () => {',
    '-    const a = 1;',
    '+    const a = 2;',
    'diff --git a/handsontable/src/core.ts b/handsontable/src/core.ts',
    '--- a/handsontable/src/core.ts',
    '+++ b/handsontable/src/core.ts',
    '@@ -9 +9 @@',
    '-old',
    '+new',
  ].join('\n');
  const added = parseAddedLines(diff);

  assert.deepEqual([...added.get(SPEC)].sort((x, y) => x - y), [38, 39, 72]);
  assert.deepEqual([...added.get('handsontable/src/core.ts')], [9]);
});

test('parseAddedLines: a deletion-only hunk adds nothing and a deleted file is dropped', () => {
  const diff = [
    `--- a/${SPEC}`,
    `+++ b/${SPEC}`,
    '@@ -12,3 +11,0 @@',
    '-  it.skip(\'gone\', async() => {',
    '-    await sleep(10);',
    '-  });',
    'diff --git a/handsontable/src/x.spec.js b/handsontable/src/x.spec.js',
    'deleted file mode 100644',
    '--- a/handsontable/src/x.spec.js',
    '+++ /dev/null',
    '@@ -1,2 +0,0 @@',
    '-await sleep(1);',
    '-await sleep(2);',
  ].join('\n');
  const added = parseAddedLines(diff);

  assert.equal(added.get(SPEC).size, 0);
  assert.equal(added.has('handsontable/src/x.spec.js'), false);
});

test('parseAddedLines attributes a renamed file\'s hunks to the NEW path only', () => {
  const oldPath = 'handsontable/src/plugins/filters/__tests__/old.spec.js';
  const diff = [
    `diff --git a/${oldPath} b/${SPEC}`,
    'similarity index 98%',
    `rename from ${oldPath}`,
    `rename to ${SPEC}`,
    `--- a/${oldPath}`,
    `+++ b/${SPEC}`,
    '@@ -4,0 +5 @@',
    '+    await sleep(5);',
  ].join('\n');
  const added = parseAddedLines(diff);

  assert.deepEqual([...added.get(SPEC)], [5]);
  assert.equal(added.has(oldPath), false, 'the old path must not appear');
});

test('parseAddedLines: with context lines, only + lines count and context advances the counter', () => {
  const diff = [
    `+++ b/${SPEC}`,
    '@@ -1,3 +1,5 @@',
    ' context line 1',
    '+added line 2',
    '+added line 3',
    ' context line 4',
    ' context line 5',
  ].join('\n');

  assert.deepEqual([...parseAddedLines(diff).get(SPEC)], [2, 3]);
});

test('parseAddedLines: an added line whose CONTENT starts with "++ " is not read as a file header', () => {
  // `+++ b/…` is a header only OUTSIDE a hunk. Inside one, an added line whose
  // text begins with `++ ` prints as `+++ ` too; the hunk's line counts say
  // where the hunk ends, so the parser must not switch files on it.
  const diff = [
    `+++ b/${SPEC}`,
    '@@ -0,0 +1,3 @@',
    '+++ b/not-a-file.spec.js',
    '+    await sleep(5);',
    '+});',
    '+++ b/handsontable/src/other.spec.js',
    '@@ -0,0 +1 @@',
    '+await sleep(1);',
  ].join('\n');
  const added = parseAddedLines(diff);

  assert.deepEqual([...added.get(SPEC)], [1, 2, 3]);
  assert.deepEqual([...added.get('handsontable/src/other.spec.js')], [1]);
  assert.equal(added.has('not-a-file.spec.js'), false);
});

test('parseAddedLines unquotes a path git had to quote', () => {
  const quoted = 'handsontable/src/__tests__/odd\\tname.spec.js';
  const diff = [
    `+++ "b/${quoted}"`,
    '@@ -0,0 +1 @@',
    '+await sleep(1);',
  ].join('\n');

  assert.deepEqual([...parseAddedLines(diff).get('handsontable/src/__tests__/odd\tname.spec.js')], [1]);
});

test('parseAddedLines tolerates CRLF and the no-newline marker', () => {
  const diff = [
    `+++ b/${SPEC}`,
    '@@ -0,0 +1,2 @@',
    '+await sleep(1);',
    '+await sleep(2);',
    '\\ No newline at end of file',
    '+++ b/handsontable/src/other.spec.js',
    '@@ -0,0 +1 @@',
    '+x',
  ].join('\r\n');
  const added = parseAddedLines(diff);

  assert.deepEqual([...added.get(SPEC)], [1, 2]);
  assert.deepEqual([...added.get('handsontable/src/other.spec.js')], [1]);
});

test('parseAddedLines of an empty diff is an empty map', () => {
  assert.equal(parseAddedLines('').size, 0);
});

// --- selectRatchetedFindings: the intersection ---

test('a sleep() on an ADDED line is reported', () => {
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SLEEP, 38, { message: 'Do not use a fixed sleep() delay.' })])],
    new Map([[SPEC, new Set([38, 39])]]),
  );

  assert.deepEqual(findings, [{
    file: SPEC, line: 38, ruleId: SLEEP, message: 'Do not use a fixed sleep() delay.',
  }]);
});

test('a pre-existing sleep() on an UNCHANGED line is not reported', () => {
  // The whole point: existing debt stays a warning; only new debt blocks.
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SLEEP, 12), message(FLAKY, 40), message(SKIP, 90)])],
    new Map([[SPEC, new Set([38, 39])]]),
  );

  assert.deepEqual(findings, []);
});

test('a file with warnings but no added lines in the diff is not reported', () => {
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SLEEP, 12)])],
    new Map([['handsontable/src/other.spec.js', new Set([1])]]),
  );

  assert.deepEqual(findings, []);
});

test('a MOVED line (deleted and re-added verbatim) IS reported — the accepted trade-off', () => {
  // A unified diff has no notion of "moved": the re-added line is a `+` line
  // like any other, so a sleep() that only changed position reads as new. The
  // alternative — ignoring an added line whenever the same text was also
  // deleted somewhere — would let a genuinely new sleep() hide behind any
  // deleted one, so the ratchet stays strict. Moving a sleep() is the moment to
  // replace it with a condition wait or to disable the rule on that line with a
  // ticket reference.
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SLEEP, 41)])],
    // The diff: `-    await sleep(50);` at old line 12, `+    await sleep(50);` at new line 41.
    new Map([[SPEC, new Set([41])]]),
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 41);
});

test('a file ESLint could not parse is skipped entirely — a parse gap never blocks', () => {
  const findings = selectRatchetedFindings(
    [
      result(SPEC, [
        { ruleId: null, fatal: true, severity: 2, message: 'Parsing error: Unexpected token', line: 3, column: 1 },
        message(SLEEP, 38),
      ]),
    ],
    new Map([[SPEC, new Set([3, 38])]]),
  );

  assert.deepEqual(findings, []);
});

test('a warning from a non-ratcheted rule on an added line is ignored', () => {
  const findings = selectRatchetedFindings(
    [result(SPEC, [
      message('handsontable/require-assertion-in-test', 38),
      message('no-unused-vars', 39),
      { ruleId: null, severity: 1, message: 'File ignored by default.', line: undefined },
    ])],
    new Map([[SPEC, new Set([38, 39])]]),
  );

  assert.deepEqual(findings, []);
});

test('an ERROR-severity message from a ratcheted rule on an added line is reported too', () => {
  // Harmless: ESLint already blocks on it. The ratchet does not filter by
  // severity, so a rule graduating to `error` cannot make a finding vanish here.
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SKIP, 7, { severity: 2 })])],
    new Map([[SPEC, new Set([7])]]),
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, SKIP);
});

test('an absolute ESLint filePath is matched to the repo-relative diff path through `root`', () => {
  const root = path.resolve('/work/handsontable-repo');
  const abs = path.join(root, ...SPEC.split('/'));
  const findings = selectRatchetedFindings(
    [result(abs, [message(SLEEP, 38)])],
    new Map([[SPEC, new Set([38])]]),
    { root },
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, SPEC, 'the reported path is repo-relative and forward-slashed');
});

test('findings come back sorted by file, then line, across several files', () => {
  const other = 'handsontable/src/__tests__/core/init.spec.js';
  const findings = selectRatchetedFindings(
    [
      result(SPEC, [message(SKIP, 90), message(SLEEP, 38)]),
      result(other, [message(FLAKY, 5)]),
    ],
    new Map([[SPEC, new Set([38, 90])], [other, new Set([5])]]),
  );

  assert.deepEqual(findings.map(f => `${f.file}:${f.line}`), [
    `${other}:5`, `${SPEC}:38`, `${SPEC}:90`,
  ]);
});

test('the rule set can be narrowed for a caller, and a malformed result list is tolerated', () => {
  const findings = selectRatchetedFindings(
    [result(SPEC, [message(SLEEP, 38), message(SKIP, 39)]), { filePath: SPEC }, null],
    new Map([[SPEC, new Set([38, 39])]]),
    { rules: [SKIP] },
  );

  assert.deepEqual(findings.map(f => f.ruleId), [SKIP]);
});

// --- formatReport: what the author reads ---

test('formatReport names every finding as file:line with its rule, and says how to satisfy the gate', () => {
  const report = formatReport([
    { file: SPEC, line: 38, ruleId: SLEEP, message: 'Do not use a fixed sleep() delay.' },
  ]);

  // A plain substring check: building a RegExp from a path needs full metacharacter escaping
  // (CodeQL js/incomplete-sanitization flags a partial one), and nothing here needs a pattern.
  assert.ok(report.includes(`${SPEC}:38`), 'the report names the finding as file:line');
  assert.match(report, /no-fixed-sleep-in-spec/);
  assert.match(report, /Do not use a fixed sleep\(\) delay\./);
  assert.match(report, /waitUntil\(/, 'the fix path (a condition wait) must be named');
  assert.match(report, /eslint-disable-next-line/, 'the documented exception must be named');
  assert.match(report, /LOCAL-ENFORCEMENT\.md/);
  // An author hit by a reformat must learn the trade-off from the report itself,
  // not from a doc they have not opened.
  assert.match(report, /re-indented or moved lines count as added/i);
});

test('formatReport of no findings is a one-line pass', () => {
  const report = formatReport([]);

  assert.equal(report.split('\n').length, 1);
  assert.match(report, /no new/i);
});
