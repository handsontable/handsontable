import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExampleFile, toolFor, parseDiagnostics, introducedErrors, parseNameStatus } from '../lib.mjs';

test('isExampleFile matches the javascript, react and vue examples only', () => {
  assert.ok(isExampleFile('docs/content/guides/a/b/javascript/example1.ts'));
  assert.ok(isExampleFile('docs/content/recipes/x/react/example1.tsx'));
  assert.ok(isExampleFile('docs/content/guides/a/vue/example1.vue'));
  assert.ok(!isExampleFile('docs/content/guides/a/javascript/example1.js'));
  assert.ok(!isExampleFile('docs/content/guides/a/javascript/example1.d.ts'));
  assert.ok(!isExampleFile('docs/content/guides/a/angular/example1.ts'));
  assert.ok(!isExampleFile('docs/content/guides/a/javascript/nested/example1.ts'));
  assert.ok(!isExampleFile('docs/src/javascript/example1.ts'));
});

test('toolFor routes .vue to vue-tsc and the rest to tsc', () => {
  assert.equal(toolFor('a/vue/example1.vue'), 'vue');
  assert.equal(toolFor('a/react/example1.tsx'), 'ts');
  assert.equal(toolFor('a/javascript/example1.ts'), 'ts');
});

test('parseDiagnostics keeps the headline of file errors and collects global ones', () => {
  const out = [
    'docs/content/a/javascript/e.ts(12,5): error TS2305: Module \'"x"\' has no exported member \'Y\'.',
    '  Did you mean something else?',
    'docs/content/a/javascript/e.ts(30,1): error TS2339: Property \'z\' does not exist.',
    'error TS18003: No inputs were found in config file.',
  ].join('\n');
  const { diagnostics, global } = parseDiagnostics(out);

  assert.equal(diagnostics.length, 2);
  assert.deepEqual(diagnostics[0], { file: 'docs/content/a/javascript/e.ts', line: 12, code: 'TS2305', message: 'Module \'"x"\' has no exported member \'Y\'.' });
  assert.equal(global.length, 1);
});

test('introducedErrors ignores old errors even when they move, and flags extra copies and new ones', () => {
  const e = (line, code, message) => ({ line, code, message });
  const base = [e(5, 'TS2345', 'Element vs HTMLElement'), e(9, 'TS2683', 'this')];
  const head = [e(20, 'TS2345', 'Element vs HTMLElement'), e(30, 'TS2345', 'Element vs HTMLElement'), e(2, 'TS2305', 'gone')];
  const { introduced, tolerated } = introducedErrors(head, base);

  assert.equal(tolerated, 1);
  assert.deepEqual(introduced.map(x => x.code).sort(), ['TS2305', 'TS2345']);
  assert.deepEqual(introducedErrors(head.slice(0, 1), base), { introduced: [], tolerated: 1 });
  assert.equal(introducedErrors(head, []).introduced.length, 3);
});

test('parseNameStatus returns added, modified and renamed examples and skips the rest', () => {
  const ex = 'docs/content/g/javascript/e1.ts';
  const raw = [
    'M', ex,
    'A', 'docs/content/g/react/e2.tsx',
    'D', 'docs/content/g/vue/e3.vue',
    'M', 'docs/content/g/page.mdx',
    'R100', 'docs/content/g/javascript/old.ts', 'docs/content/g/javascript/new.ts',
    'R090', 'docs/content/g/page.mdx', 'docs/content/g/javascript/from-mdx.ts',
    '',
  ].join('\0');

  assert.deepEqual(parseNameStatus(raw), [
    { head: ex, base: ex },
    { head: 'docs/content/g/react/e2.tsx', base: null },
    { head: 'docs/content/g/javascript/new.ts', base: 'docs/content/g/javascript/old.ts' },
    { head: 'docs/content/g/javascript/from-mdx.ts', base: null },
  ]);
});
