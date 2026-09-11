import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKIP_MARKER, MULTIPLE_MARKER, requiresChangelog, stripHtmlComments, evaluateChangelogGate,
} from '../lib/changelog-gate.mjs';

// --- requiresChangelog: shippable-source classification ---
const REQUIRES_CASES = [
  // Core source ships → entry required.
  ['handsontable/src/core.ts', true],
  ['handsontable/src/plugins/copyPaste/copyPaste.ts', true],
  ['handsontable/src/i18n/languages/de-DE.js', true],
  // Styling under src ships (broader than the presence gate's testable set).
  ['handsontable/src/styles/themes/main.scss', true],
  // Wrapper source and manifests ship.
  ['wrappers/react-wrapper/src/hotTableInner.tsx', true],
  ['wrappers/vue3/src/HotTable.vue', true],
  ['wrappers/react-wrapper/package.json', true],
  // Tests never demand an entry — by file kind or by directory marker.
  ['handsontable/src/plugins/copyPaste/__tests__/copyPaste.unit.js', false],
  ['handsontable/src/plugins/copyPaste/__tests__/settings/rowsLimit.spec.js', false],
  ['handsontable/src/plugins/copyPaste/__tests__/helpers/setup.js', false],
  ['wrappers/react-wrapper/test/hotColumn.spec.tsx', false],
  ['wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/create-spreadsheet-data.ts', false],
  // Markdown never demands an entry.
  ['wrappers/angular-wrapper/AGENTS.md', false],
  ['handsontable/src/plugins/contextMenu/AGENTS.md', false],
  // Outside the trees: docs, CI, tooling, root files.
  ['docs/content/guides/foo/foo.md', false],
  ['.github/workflows/test.yml', false],
  ['scripts/pre-push.mjs', false],
  ['handsontable/test/e2e/keyboardShortcuts.spec.js', false],
  ['CONTRIBUTING.md', false],
  ['.changelogs/13110.json', false],
];

test('requiresChangelog classifies shippable source', () => {
  for (const [path, want] of REQUIRES_CASES) {
    assert.equal(requiresChangelog(path), want, `${path} should be ${want}`);
  }
});

// --- stripHtmlComments ---
test('stripHtmlComments removes single and multiline comment blocks', () => {
  const body = `real text <!-- hidden ${SKIP_MARKER} --> more\n<!--\nmultiline ${SKIP_MARKER}\n-->tail`;

  const stripped = stripHtmlComments(body);

  assert.equal(stripped.includes(SKIP_MARKER), false);
  assert.equal(stripped.includes('real text'), true);
  assert.equal(stripped.includes('tail'), true);
});

test('a comment reassembled around a removed match cannot smuggle the marker', () => {
  // Single-pass stripping of the inner comment would reconstruct
  // `<!-- [skip changelog] -->` and match the marker; the fixed-point loop
  // removes the reconstruction too (CodeQL js/incomplete-multi-character-sanitization).
  const body = `<!-<!-- x -->- ${SKIP_MARKER} -->`;

  assert.equal(stripHtmlComments(body).includes(SKIP_MARKER), false);
});

test('an unterminated trailing comment hides the marker (comment-to-EOF)', () => {
  assert.equal(stripHtmlComments(`text <!-- dangling ${SKIP_MARKER}`).includes(SKIP_MARKER), false);
  // ...but a marker BEFORE the dangling comment stays visible and active.
  assert.equal(stripHtmlComments(`${SKIP_MARKER} <!-- dangling`).includes(SKIP_MARKER), true);
});

// --- evaluateChangelogGate ---
const src = { status: 'modified', filename: 'handsontable/src/core.ts' };
const scss = { status: 'modified', filename: 'handsontable/src/styles/themes/main.scss' };
const entry = { status: 'added', filename: '.changelogs/13200.json' };
const doc = { status: 'modified', filename: 'docs/content/guides/foo/foo.md' };
const workflow = { status: 'added', filename: '.github/workflows/develop.yml' };
const wrapperTest = { status: 'modified', filename: 'wrappers/react-wrapper/test/hotColumn.spec.tsx' };

test('an added entry passes, whatever else changed', () => {
  const verdict = evaluateChangelogGate({ body: '', files: [src, entry] });

  assert.deepEqual(verdict, {
    pass: true, reason: 'entry-added', sourceFiles: [src.filename], entries: [entry.filename],
  });
});

test('a MODIFIED changelog file is not a new entry', () => {
  // Editing an existing entry (no source change) passes via no-source-change,
  // not via entry-added.
  const verdict = evaluateChangelogGate({
    body: '',
    files: [{ status: 'modified', filename: '.changelogs/13100.json' }],
  });

  assert.equal(verdict.reason, 'no-source-change');
});

test('docs/CI/test-only PRs pass automatically with no entry and no marker', () => {
  for (const files of [[doc], [workflow], [wrapperTest], [doc, workflow, wrapperTest]]) {
    const verdict = evaluateChangelogGate({ body: '', files });

    assert.equal(verdict.pass, true);
    assert.equal(verdict.reason, 'no-source-change');
  }
});

test('a source change with no entry and no marker fails', () => {
  const verdict = evaluateChangelogGate({ body: 'regular description', files: [src, doc] });

  assert.deepEqual(verdict, {
    pass: false, reason: 'missing-entry', sourceFiles: [src.filename], entries: [],
  });
});

test('a styling change under src is a source change', () => {
  const verdict = evaluateChangelogGate({ body: '', files: [scss] });

  assert.equal(verdict.reason, 'missing-entry');
});

test('removed and renamed source files count as source changes', () => {
  for (const status of ['removed', 'renamed']) {
    const verdict = evaluateChangelogGate({
      body: '',
      files: [{ status, filename: 'handsontable/src/plugins/oldPlugin/oldPlugin.ts' }],
    });

    assert.equal(verdict.reason, 'missing-entry', `status=${status}`);
  }
});

test('the marker in the description overrides a source change', () => {
  const verdict = evaluateChangelogGate({ body: `Tooling only.\n${SKIP_MARKER}`, files: [src] });

  assert.deepEqual(verdict, {
    pass: true, reason: 'skipped-explicitly', sourceFiles: [src.filename], entries: [],
  });
});

test('the marker inside an HTML comment is inert', () => {
  const templateHint = `### Context\n<!-- To skip, write ${SKIP_MARKER} outside a comment. -->`;

  assert.equal(evaluateChangelogGate({ body: templateHint, files: [src] }).reason, 'missing-entry');
  assert.equal(evaluateChangelogGate({ body: templateHint, files: [doc] }).reason, 'no-source-change');
});

test('a missing body does not crash the gate', () => {
  assert.equal(evaluateChangelogGate({ body: undefined, files: [doc] }).pass, true);
  assert.equal(evaluateChangelogGate({ body: null, files: [src] }).reason, 'missing-entry');
});

// --- the entry ceiling (DEV-2880) ---
// The other half of "one entry per PR" is `bin/changelog`'s repo-wide
// assertion that a file is named after the number it cites, which is what
// makes two entries for the SAME number impossible. What is left here is a PR
// filing more entries than the rule allows, each citing a number of its own.
const added = n => ({ status: 'added', filename: `.changelogs/${n}.json` });

test('one entry, and the sanctioned second one, both pass', () => {
  assert.equal(evaluateChangelogGate({ body: '', files: [src, added(13237)] }).reason,
    'entry-added');
  assert.equal(evaluateChangelogGate({ body: '', files: [src, added(13237), added(7389)] }).reason,
    'entry-added', 'the PR number plus a public issue is the sanctioned pair');
  assert.equal(evaluateChangelogGate({ body: '', files: [src, added(7389)] }).reason,
    'entry-added', 'an entry need not carry the PR number at all');
});

test('every two-entry shape in the repo history passes', () => {
  // Each pair is one merged PR: a private entry for the PR beside a public one
  // for the issue it closes, or two distinct private numbers.
  const pairs = [
    [13294, 5429], [13237, 7389], [13239, 7147], [13307, 4371],
    [10239, 13224], [12766, 12776], [13063, 13068], [13374, 13376],
  ];

  for (const [a, b] of pairs) {
    const verdict = evaluateChangelogGate({ body: '', files: [src, added(a), added(b)] });

    assert.equal(verdict.pass, true, `#${a} + #${b} must pass`);
    assert.equal(verdict.reason, 'entry-added');
  }
});

test('a third entry fails, and names every entry it counted', () => {
  const files = [src, added(13237), added(7389), added(4371)];
  const verdict = evaluateChangelogGate({ body: '', files });

  assert.equal(verdict.pass, false);
  assert.equal(verdict.reason, 'too-many-entries');
  assert.deepEqual(verdict.entries, [
    '.changelogs/13237.json', '.changelogs/7389.json', '.changelogs/4371.json',
  ]);
});

test('[multiple changelogs] lifts the ceiling', () => {
  // #12319 back-filled six entries for OTHER pull requests. That is the one
  // shape the marker exists for.
  const files = [added(12123), added(12129), added(12143), added(12144), added(12205), added(12289)];
  const verdict = evaluateChangelogGate({
    body: `Back-fills missing entries.\n${MULTIPLE_MARKER}`,
    files,
  });

  assert.equal(verdict.pass, true);
  assert.equal(verdict.reason, 'multiple-allowed');
  assert.equal(verdict.entries.length, 6);
});

test('[skip changelog] does NOT lift the ceiling', () => {
  // The two markers answer different questions, and the skip marker is the one
  // an author already has to hand. It must not double as a count override.
  const files = [src, added(13237), added(7389), added(4371)];

  assert.equal(evaluateChangelogGate({ body: `Nope.\n${SKIP_MARKER}`, files }).reason,
    'too-many-entries');
});

test('[multiple changelogs] inside an HTML comment is inert', () => {
  const files = [src, added(13237), added(7389), added(4371)];
  const body = `### Context\n<!-- Over two entries? write ${MULTIPLE_MARKER} outside a comment. -->`;

  assert.equal(evaluateChangelogGate({ body, files }).reason, 'too-many-entries');
});

test('modified and renamed entries do not count toward the ceiling', () => {
  // Only `added` counts: retitling existing entries is routine maintenance,
  // and a rename is caught repo-wide by the filename assertion instead.
  const files = [
    src,
    added(13237),
    { status: 'modified', filename: '.changelogs/13100.json' },
    { status: 'modified', filename: '.changelogs/13101.json' },
    { status: 'renamed', filename: '.changelogs/13102.json' },
  ];
  const verdict = evaluateChangelogGate({ body: '', files });

  assert.equal(verdict.reason, 'entry-added');
  assert.deepEqual(verdict.entries, ['.changelogs/13237.json']);
});

test('a non-numeric entry filename still counts toward the ceiling', () => {
  // The gate never parses the name - `bin/changelog` fails the job over it in
  // the same check. Counting it keeps the two halves from disagreeing about
  // how many entries a PR added.
  const files = [
    src,
    added(13442),
    { status: 'added', filename: '.changelogs/13442-changed.json' },
    { status: 'added', filename: '.changelogs/13442-deprecated.json' },
  ];
  const verdict = evaluateChangelogGate({ body: '', files });

  assert.equal(verdict.reason, 'too-many-entries');
  assert.equal(verdict.entries.length, 3);
});
