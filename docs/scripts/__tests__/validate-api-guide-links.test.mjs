import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { collectSidebarGuides, validateApiGuideLinks } from '../validate-api-guide-links.mjs';
import { apiGuideLinks, buildGuideLinkLine } from '../jsdoc-convert/apiGuideLinks.mjs';

const require = createRequire(import.meta.url);
const realContentDir = resolve(import.meta.dirname, '../../content');
const realSidebar = collectSidebarGuides(require(join(realContentDir, 'guides/sidebar.js')));
const realPlugins = readdirSync(resolve(import.meta.dirname, '../../../handsontable/src/plugins'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

function makeContentDir(pages) {
  const dir = mkdtempSync(join(tmpdir(), 'api-guide-links-'));

  for (const [file, frontmatter] of Object.entries(pages)) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), `---\n${frontmatter}\n---\n\nBody.\n`, 'utf8');
  }

  return dir;
}

test('every entry of the real map points at an existing, framework-neutral guide of a real plugin', () => {
  const errors = validateApiGuideLinks({
    links: apiGuideLinks,
    contentDir: realContentDir,
    pluginNames: realPlugins,
    sidebar: realSidebar,
  });

  assert.deepEqual(errors, []);
});

test('buildGuideLinkLine renders the guide title and the @/guides link form', () => {
  assert.equal(
    buildGuideLinkLine('multiColumnSorting.md'),
    'See the [Rows sorting](@/guides/rows/rows-sorting/rows-sorting.md) guide for examples and configuration details.'
  );
});

test('buildGuideLinkLine accepts the capitalized name the renderer passes', () => {
  assert.equal(buildGuideLinkLine('MultiColumnSorting.md'), buildGuideLinkLine('multiColumnSorting.md'));
  assert.notEqual(buildGuideLinkLine('MultiColumnSorting.md'), '');
});

test('buildGuideLinkLine returns an empty string for an unmapped page, including inherited keys', () => {
  assert.equal(buildGuideLinkLine('core.md'), '');
  assert.equal(buildGuideLinkLine('stretchColumns.md'), '');
  assert.equal(buildGuideLinkLine('constructor'), '');
});

test('validateApiGuideLinks reports a missing guide', () => {
  const contentDir = makeContentDir({});
  const errors = validateApiGuideLinks({
    links: { 'search.md': 'guides/navigation/gone/gone.md' },
    contentDir,
    pluginNames: ['search'],
    sidebar: { all: new Set(), gated: new Set() },
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /does not exist/);
});

test('validateApiGuideLinks reports a non-plugin page, an unregistered guide, and an onlyFor guide', () => {
  const guide = 'guides/a/b/b.md';
  const contentDir = makeContentDir({ [guide]: 'title: B' });

  assert.match(validateApiGuideLinks({
    links: { 'core.md': guide },
    contentDir,
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
  })[0], /plugins only/);

  assert.match(validateApiGuideLinks({
    links: { 'search.md': guide },
    contentDir,
    pluginNames: ['search'],
    sidebar: { all: new Set(), gated: new Set() },
  })[0], /not registered in the sidebar/);

  assert.match(validateApiGuideLinks({
    links: { 'search.md': guide },
    contentDir,
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set([guide]) },
  })[0], /framework-specific/);
});

test('collectSidebarGuides flattens nested children and records onlyFor pages', () => {
  const { all, gated } = collectSidebarGuides({
    guides: [
      { title: 'Section', children: [
        { path: 'guides/x/y/y' },
        { path: 'guides/x/z/z', onlyFor: ['react'] },
      ] },
    ],
  });

  assert.deepEqual([...all].sort(), ['guides/x/y/y.md', 'guides/x/z/z.md']);
  assert.deepEqual([...gated], ['guides/x/z/z.md']);
});
