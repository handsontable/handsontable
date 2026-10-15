import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExampleFile, toolFor, parseDiagnostics, introducedErrors, parseNameStatus, escapeCommand, stripQuoted } from '../lib.mjs';

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
  assert.deepEqual(diagnostics[0], { file: 'docs/content/a/javascript/e.ts', line: 12, code: 'TS2305', message: 'Module \'"x"\' has no exported member \'Y\'.', detail: ' Did you mean something else?' });
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

test('elaboration lines are part of the key: two different TS2769 overload failures do not cancel', () => {
  const out = reason => [
    'a/javascript/e.ts(10,1): error TS2769: No overload matches this call.',
    "  Overload 1 of 2, '(a: number): void', gave the following error.",
    `    ${reason}`,
  ].join('\n');
  const base = parseDiagnostics(out("Argument of type 'string' is not assignable to parameter of type 'number'.")).diagnostics;
  const head = parseDiagnostics(out("Type 'string' is not assignable to type 'number'.")).diagnostics;

  assert.equal(introducedErrors(head, base).introduced.length, 1);
  assert.equal(introducedErrors(base, base).introduced.length, 0);
});

test('quoted names and types are not part of the key, so a rename or a new property keeps it', () => {
  const error = message => ({ line: 1, code: 'TS2339', message, detail: '' });
  const base = [error("Property 'clear' does not exist on type '{ name: string; }'.")];
  const head = [error("Property 'clear' does not exist on type '{ name: string; disabled: boolean; }'.")];

  assert.equal(introducedErrors(head, base).introduced.length, 0);
  assert.equal(introducedErrors([...head, ...head], base).introduced.length, 1, 'a second copy still fails');
  assert.equal(stripQuoted("Parameter 'value' implicitly has an 'any' type."), "Parameter '' implicitly has an '' type.");
});

test('positions inside elaboration lines are stripped, so a line shift keeps the key', () => {
  const at = n => `a/javascript/e.ts(${n},1): error TS2345: Bad.\n  e.ts(${n},9): 'x' is declared here.`;

  assert.equal(introducedErrors(parseDiagnostics(at(40)).diagnostics, parseDiagnostics(at(4)).diagnostics).introduced.length, 0);
});

test('the same message under a different code is a different error', () => {
  const e = code => ({ line: 1, code, message: 'same', detail: '' });

  assert.equal(introducedErrors([e('TS2322')], [e('TS2345')]).introduced.length, 1);
});

test('escapeCommand escapes workflow-command metacharacters', () => {
  assert.equal(escapeCommand('100%\r\nx: y,z'), '100%25%0D%0Ax: y,z');
  assert.equal(escapeCommand('a:b,c%', true), 'a%3Ab%2Cc%25');
});
