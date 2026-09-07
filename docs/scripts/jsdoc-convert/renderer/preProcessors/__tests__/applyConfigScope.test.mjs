import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { applyConfigScope } from '../applyConfigScope.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));

test('lifts the configscope custom tag onto a top-level field', () => {
  const [member] = applyConfigScope([
    { name: 'readOnly', customTags: [{ tag: 'configscope', value: 'grid columns cells cell' }] },
  ]);

  assert.deepEqual(member.configScopeLevels, ['grid', 'columns', 'cells', 'cell']);
});

test('removes the tag from customTags so it is not auto-rendered', () => {
  // Left in customTags, `customTags.hbs` prints `**Configscope**: grid` on every option.
  const [member] = applyConfigScope([
    { name: 'ariaTags', customTags: [{ tag: 'configscope', value: 'grid' }] },
  ]);

  assert.equal(member.customTags, undefined);
});

test('keeps other custom tags intact', () => {
  const [member] = applyConfigScope([
    {
      name: 'comments',
      customTags: [{ tag: 'plugin', value: 'Comments' }, { tag: 'configscope', value: 'grid' }],
    },
  ]);

  assert.deepEqual(member.customTags, [{ tag: 'plugin', value: 'Comments' }]);
  assert.deepEqual(member.configScopeLevels, ['grid']);
});

test('matches the tag name case-insensitively', () => {
  // jsdoc lowercases unknown tag names, but do not depend on that.
  const [member] = applyConfigScope([
    { name: 'title', customTags: [{ tag: 'configScope', value: 'columns' }] },
  ]);

  assert.deepEqual(member.configScopeLevels, ['columns']);
});

test('throws when an option declares the tag twice', () => {
  // A leftover duplicate would stay in customTags and render as `**Configscope**: ...`
  // beneath the badge, which is the output this pre-processor exists to prevent.
  assert.throws(() => applyConfigScope([
    {
      name: 'readOnly',
      customTags: [{ tag: 'configscope', value: 'grid' }, { tag: 'configscope', value: 'columns' }],
    },
  ]), /declares @configScope 2 times/);
});

test('leaves members without the tag untouched', () => {
  const input = [{ name: 'somethingElse', customTags: [{ tag: 'plugin', value: 'X' }] }, { name: 'noTags' }];
  const output = applyConfigScope(input);

  assert.equal(output[0].configScopeLevels, undefined);
  assert.deepEqual(output[0].customTags, [{ tag: 'plugin', value: 'X' }]);
  assert.equal(output[1].configScopeLevels, undefined);
});

test('the option heading template carries no config-scope markup', () => {
  // Regression guard. The badges must render BELOW the heading, never inside it: a
  // markdown heading's anchor is derived from its text, so markup in the heading rewrote
  // every option anchor (`#readonly` -> `#readonly-grid-columns-cells-cell`) and broke
  // 656 in-page links plus every inbound link to the API reference.
  //
  // This asserts on the template rather than the generated reference. `content/api/` is
  // gitignored and the `plugins` CI job runs no `docs:api` step, so a check that reads
  // the generated file passes by doing nothing on every CI run.
  const template = resolve(
    currentDir,
    '../../../integrations/jsdoc-to-markdown/dmd/partials/all-docs/docs/hot-header.hbs'
  );
  const source = readFileSync(template, 'utf8');
  const headingLine = source.split('\n').find(line => line.startsWith('### '));

  assert.ok(headingLine, 'expected hot-header.hbs to render an `### ` option heading');
  assert.doesNotMatch(
    headingLine,
    /configScope/,
    `the option heading renders config-scope markup, which would change every option anchor: ${headingLine}`
  );
  // The badge block still has to exist, just outside the heading.
  assert.match(source, /configScopeLevels/, 'expected hot-header.hbs to render the level badges');
});
