import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorize, isContentPath } from '../lib/docs-sync/paths.mjs';

test('guides, recipes, and guide images are content', () => {
  assert.equal(isContentPath('docs/content/guides/rows/row-height/row-height.md'), true);
  assert.equal(isContentPath('docs/content/recipes/x/react/example1.tsx'), true);
  assert.equal(isContentPath('docs/public/img/copy_headers_only.png'), true);
});

test('docs tooling, root files, and the rest of docs/public are not content', () => {
  assert.equal(isContentPath('docs/src/plugins/framework-loader.mjs'), false);
  assert.equal(isContentPath('docs/public/_md/x.md'), false);
  assert.equal(isContentPath('docs/astro.config.mjs'), false);
  assert.equal(isContentPath('docs/AGENTS.md'), false);
});

test('a content-only commit has no categories', () => {
  const result = categorize(['docs/content/guides/a.md', 'docs/public/img/a.png']);

  assert.deepEqual(result, { contentOnly: true, categories: [], nonContent: [] });
});

test('categories name what a human has to port by hand', () => {
  const result = categorize([
    'docs/content/guides/a.md',
    'handsontable/src/core.ts',
    '.changelogs/13000.json',
    'docs/src/x.mjs',
    'docs/AGENTS.md',
    '.claude/skills/x/SKILL.md',
    'handsontable/src/plugins/filters/AGENTS.md',
    'README.md',
  ]);

  assert.equal(result.contentOnly, false);
  assert.deepEqual(result.categories, ['agent docs', 'other', 'source', 'tooling']);
  assert.equal(result.nonContent.length, 7);
});

test('an AGENTS.md inside a source tree is agent docs, not source', () => {
  assert.deepEqual(categorize(['handsontable/src/plugins/filters/AGENTS.md']).categories, ['agent docs']);
});
