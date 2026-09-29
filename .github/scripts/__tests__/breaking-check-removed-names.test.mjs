import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicNameRequest, goneCandidates, removedCandidates, stillPresent,
} from '../lib/breaking-check/removed-names.mjs';

/**
 * A one-file diff whose removed lines are `removed` and added lines are `added`.
 */
function fileDiff(filePath, removed, added = []) {
  return {
    path: filePath,
    text: [
      `diff --git a/${filePath} b/${filePath}`,
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      '@@ -1,3 +1,3 @@',
      ...removed.map((l) => `-${l}`),
      ...added.map((l) => `+${l}`),
    ].join('\n'),
  };
}

const kinds = (scope, options) => Object.fromEntries(removedCandidates(scope, options).map((c) => [c.name, c.kind]));

test('extracts exports, options, hooks, css classes, css variables, and methods from removed lines', () => {
  assert.deepEqual(kinds([fileDiff('handsontable/src/helpers/x.ts', ['export function oldHelper() {'])]), { oldHelper: 'export' });
  assert.deepEqual(
    kinds([fileDiff('handsontable/src/dataMap/metaManager/metaSchema.ts', ['  undo: true,', "  'copyPaste': {"])]),
    { undo: 'option', copyPaste: 'option' },
  );
  assert.deepEqual(
    kinds([fileDiff('handsontable/src/core/hooks/constants.ts', ['  beforeFoo: [],'])]),
    { beforeFoo: 'hook' },
  );
  assert.deepEqual(
    kinds([fileDiff('handsontable/src/styles/a.scss', ['  --ht-old-color: red;', '.htOldClass { color: red; }'])]),
    { '--ht-old-color': 'css-variable', htOldClass: 'css-class' },
  );
  assert.deepEqual(
    kinds([fileDiff('handsontable/src/x.ts', ["addClass(el, 'htLegacy');"])]),
    { htLegacy: 'css-class' },
  );
  assert.deepEqual(kinds([fileDiff('handsontable/src/plugins/p/p.ts', ['  disablePlugin() {'])]), { disablePlugin: 'method' });
});

test('matches the Core `this.name = function` style by default and can turn it off', () => {
  const scope = [fileDiff('handsontable/src/core.ts', ['  this.undoAll = function() {'])];

  assert.deepEqual(kinds(scope), { undoAll: 'method' });
  assert.deepEqual(kinds(scope, { coreStyle: false }), {});
});

test('skips comment lines, added lines, keywords, and short names', () => {
  const scope = [fileDiff(
    'handsontable/src/x.ts',
    ['  * export function inComment() {', '// export const skipped = 1;', '  if (x) {', '  ab() {'],
    ['export function addedOnly() {'],
  )];

  assert.deepEqual(kinds(scope), {});
});

test('ignores 3rdparty methods and does not read css classes out of source files as code names', () => {
  assert.deepEqual(kinds([fileDiff('handsontable/src/3rdparty/walkontable/src/a.ts', ['  render() {'])]), {});
  assert.deepEqual(kinds([fileDiff('handsontable/src/a.scss', ['  color: red;'])]), {});
});

test('a name counts once, at its first occurrence', () => {
  const found = removedCandidates([
    fileDiff('handsontable/src/a.scss', ['.htDup {}']),
    fileDiff('handsontable/src/b.scss', ['.htDup {}']),
  ]);

  assert.equal(found.length, 1);
  assert.equal(found[0].file, 'handsontable/src/a.scss');
});

test('stillPresent: exit 1 is absent, other errors throw, and the grep arguments are the calibrated ones', () => {
  const seen = [];
  const absent = (args) => { seen.push(args); throw Object.assign(new Error('no match'), { status: 1 }); };

  assert.equal(stillPresent(absent, 'abc', 'foo'), false);
  assert.deepEqual(seen[0].slice(0, 6), ['grep', '-q', '-F', '-w', '-e', 'foo']);
  assert.equal(seen[0][6], 'abc');
  assert.ok(seen[0].includes(':(exclude)**/__tests__/**'));
  assert.ok(seen[0].includes(':(exclude)**/*.md'));

  assert.equal(stillPresent(() => '', 'abc', 'foo'), true);

  const broken = () => { throw Object.assign(new Error('bad ref'), { status: 128 }); };

  assert.throws(() => stillPresent(broken, 'abc', 'foo'), /bad ref/);

  // A css variable starts with `--`, so it is matched without `-w`.
  stillPresent(() => '', 'abc', '--ht-x');
  const args = [];

  stillPresent((a) => { args.push(a); return ''; }, 'abc', '--ht-x');
  assert.deepEqual(args[0].slice(0, 5), ['grep', '-q', '-F', '-e', '--ht-x']);
});

test('goneCandidates keeps only names absent at the ref, most public kinds first', () => {
  const scope = [fileDiff('handsontable/src/a.ts', [
    '  this.gone = function() {',
    'export function goneExport() {',
    '  survivor() {',
  ])];
  const git = (args) => {
    const name = args[args.indexOf('-e') + 1];

    if (name === 'survivor') {
      return '';
    }
    throw Object.assign(new Error('no match'), { status: 1 });
  };
  const gone = goneCandidates({ scope, git, ref: 'HEAD' });

  assert.deepEqual(gone.map((c) => c.name), ['goneExport', 'gone']);
});

test('goneCandidates checks at most 300 candidates, highest priority first', () => {
  const removed = Array.from({ length: 350 }, (_, i) => `  method${i}() {`);

  removed.push('  --ht-late: 1;');

  const scope = [fileDiff('handsontable/src/a.scss', ['  --ht-late: 1;']), fileDiff('handsontable/src/a.ts', removed)];
  let calls = 0;
  const git = () => { calls += 1; throw Object.assign(new Error('no match'), { status: 1 }); };
  const gone = goneCandidates({ scope, git, ref: 'HEAD' });

  assert.equal(calls, 300);
  assert.equal(gone[0].name, '--ht-late');
});

test('buildPublicNameRequest asks one question per name, capped at 40, and escapes "<"', () => {
  assert.equal(buildPublicNameRequest([]), null);

  const gone = Array.from({ length: 45 }, (_, i) => ({ name: `n${i}`, kind: 'method', file: 'f', line: i === 0 ? 'a <b> c' : 'x' }));
  const { state, questions } = buildPublicNameRequest(gone);

  assert.equal(Object.keys(questions).length, 40);
  assert.equal(state.removedNames.length, 40);
  assert.match(questions.c3.instructions, /removedNames\[3\]\.name/);
  assert.equal(questions.c0.type, 'noul');
  assert.equal(state.removedNames[0].line, 'a &lt;b> c');
  assert.match(state.note, /untrusted data/);
});
