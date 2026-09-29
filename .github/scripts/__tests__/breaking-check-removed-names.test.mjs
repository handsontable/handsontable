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

test('stillPresent: exit 1 is absent, other errors throw, and the exclusions mirror requiresChangelog', () => {
  const seen = [];
  const absent = (args) => { seen.push(args); throw Object.assign(new Error('no match'), { status: 1 }); };

  assert.equal(stillPresent(absent, 'abc', 'foo'), false);
  assert.deepEqual(seen[0].slice(0, 7), ['grep', '-q', '-F', '-w', '-e', 'foo', 'abc']);

  for (const glob of ['__tests__/**', 'test/**', 'test-helpers/**', 'spec/**', '*.spec.*', '*.unit.*', '*.types.ts', '*.md']) {
    assert.ok(seen[0].includes(`:(exclude)**/${glob}`), glob);
  }

  assert.equal(stillPresent(() => '', 'abc', 'foo'), true);

  const broken = () => { throw Object.assign(new Error('bad ref'), { status: 128 }); };

  assert.throws(() => stillPresent(broken, 'abc', 'foo'), /bad ref/);
});

test('stillPresent matches a hyphenated name with an extended regex that needs a non-name character each side', () => {
  const args = [];

  stillPresent((a) => { args.push(a); return ''; }, 'abc', '--ht-a.b');
  assert.deepEqual(args[0].slice(0, 5), ['grep', '-q', '-E', '-e', '(^|[^A-Za-z0-9_-])--ht-a\\.b([^A-Za-z0-9_-]|$)']);

  const regex = new RegExp(args[0][4]);

  assert.ok(regex.test('  --ht-a.b: 1;'));
  assert.ok(regex.test('var(--ht-a.b)'));
  assert.ok(!regex.test('--ht-a.b-0: 1;'));
  assert.ok(!regex.test('--ht-a.bx'));
  assert.ok(!regex.test('x--ht-a.b'));
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
  const { gone, uncheckedCount } = goneCandidates({ scope, git, ref: 'HEAD' });

  assert.equal(uncheckedCount, 0);
  assert.deepEqual(gone.map((c) => c.name), ['goneExport', 'gone']);
});

test('goneCandidates checks at most 300 candidates, highest priority first', () => {
  const removed = Array.from({ length: 350 }, (_, i) => `  method${i}() {`);

  removed.push('  --ht-late: 1;');

  const scope = [fileDiff('handsontable/src/a.scss', ['  --ht-late: 1;']), fileDiff('handsontable/src/a.ts', removed)];
  let calls = 0;
  const git = () => { calls += 1; throw Object.assign(new Error('no match'), { status: 1 }); };
  const { gone, uncheckedCount } = goneCandidates({ scope, git, ref: 'HEAD' });

  assert.equal(calls, 300);
  assert.equal(uncheckedCount, 51);
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

test('matches modifiers, generics, and return types on a one-line signature', () => {
  const scope = [fileDiff('handsontable/src/plugins/p/p.ts', [
    '  getSetting<T = any>(key: string): T {',
    '  override enablePlugin(): void {',
    '  protected static readonly hidden(): void {',
  ])];

  assert.deepEqual(kinds(scope), { getSetting: 'method', enablePlugin: 'method', hidden: 'method' });
});

test('matches a signature split across lines, but not a call that spans lines', () => {
  const split = [fileDiff('handsontable/src/plugins/p/p.ts', [
    '  calculateColumnsWidth(',
    '    from: number,',
    '    to: number,',
    '  ): number {',
    '    return 1;',
    '  }',
    '  runQueue(',
    '    task,',
    '  );',
  ])];

  assert.deepEqual(kinds(split), { calculateColumnsWidth: 'method' });
  assert.deepEqual(kinds([fileDiff('handsontable/src/plugins/p/p.ts', ['  generic<T>(', '  ): void {'])]), { generic: 'method' });
});

test('a renamed split signature is caught when its closing line is unchanged context', () => {
  const filePath = 'handsontable/src/plugins/p/p.ts';
  const scope = [{
    path: filePath,
    text: [
      `diff --git a/${filePath} b/${filePath}`,
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      '@@ -10,4 +10,4 @@',
      '-  calculateColumnsWidth(',
      '+  computeColumnWidths(',
      '     from: number,',
      '   ): number {',
      '@@ -40,2 +40,2 @@',
      '-  runQueue(',
      '+  drainQueue(',
      '   ): number {',
    ].join('\n'),
  }];

  assert.deepEqual(kinds(scope), { calculateColumnsWidth: 'method', runQueue: 'method' });
});

test('a split signature is not closed by a line from the next hunk', () => {
  const filePath = 'handsontable/src/plugins/p/p.ts';
  const scope = [{
    path: filePath,
    text: [
      `diff --git a/${filePath} b/${filePath}`,
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      '@@ -10,2 +10,2 @@',
      '-  runQueue(',
      '     task,',
      '@@ -90,1 +90,1 @@',
      '   ): number {',
    ].join('\n'),
  }];

  assert.deepEqual(kinds(scope), {});
});

test('a removed `/* ... */` line is a comment', () => {
  assert.deepEqual(kinds([fileDiff('handsontable/src/a.scss', ['/* uses --ht-old-var */'])]), {});
  assert.deepEqual(kinds([fileDiff('handsontable/src/a.ts', ['/* export function x() { */'])]), {});
});
