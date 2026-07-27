import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKIP_MARKER, requiresChangelog, stripHtmlComments, evaluateChangelogGate,
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

// --- evaluateChangelogGate ---
const src = { status: 'modified', filename: 'handsontable/src/core.ts' };
const scss = { status: 'modified', filename: 'handsontable/src/styles/themes/main.scss' };
const entry = { status: 'added', filename: '.changelogs/13200.json' };
const doc = { status: 'modified', filename: 'docs/content/guides/foo/foo.md' };
const workflow = { status: 'added', filename: '.github/workflows/develop.yml' };
const wrapperTest = { status: 'modified', filename: 'wrappers/react-wrapper/test/hotColumn.spec.tsx' };

test('an added entry passes, whatever else changed', () => {
  const verdict = evaluateChangelogGate({ body: '', files: [src, entry] });

  assert.deepEqual(verdict, { pass: true, reason: 'entry-added', sourceFiles: [src.filename] });
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

  assert.deepEqual(verdict, { pass: false, reason: 'missing-entry', sourceFiles: [src.filename] });
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

  assert.deepEqual(verdict, { pass: true, reason: 'skipped-explicitly', sourceFiles: [src.filename] });
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
