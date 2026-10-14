import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { collectSidebarGuides, validateApiGuideLinks } from '../validate-api-guide-links.mjs';
import { apiGuideLinks, buildGuideLinkLine, unmappedPlugins } from '../jsdoc-convert/apiGuideLinks.mjs';
import { buildRenderer } from '../jsdoc-convert/renderer/index.mjs';

const require = createRequire(import.meta.url);
const realContentDir = resolve(import.meta.dirname, '../../content');
const realSidebar = collectSidebarGuides(require(join(realContentDir, 'guides/sidebar.js')));
const realPlugins = readdirSync(resolve(import.meta.dirname, '../../../handsontable/src/plugins'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
const guide = 'guides/a/b/b.md';
const emptySidebar = { all: new Set(), gated: new Set() };

function makeContentDir(pages) {
  const dir = mkdtempSync(join(tmpdir(), 'api-guide-links-'));

  for (const [file, frontmatter] of Object.entries(pages)) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), `---\n${frontmatter}\n---\n\nBody.\n`, 'utf8');
  }

  return dir;
}

function validate(overrides) {
  return validateApiGuideLinks({
    links: {},
    contentDir: makeContentDir({}),
    pluginNames: [],
    sidebar: emptySidebar,
    unmapped: [],
    ...overrides,
  });
}

test('the real map and unmapped list cover every plugin and point at valid guides', () => {
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

test('reports a missing guide', () => {
  const errors = validate({
    links: { 'search.md': 'guides/navigation/gone/gone.md' },
    pluginNames: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /search\.md: the guide .* does not exist/);
});

test('reports a guide with no title', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'description: No title here' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /has no title in its frontmatter/);
});

test('reports a guide path that does not start with guides/ or end with .md', () => {
  for (const bad of ['content/guides/a/b/b.md', 'a/b/b.md', 'guides/a/b/b']) {
    const errors = validate({ links: { 'search.md': bad }, pluginNames: ['search'] });

    assert.equal(errors.length, 1, bad);
    assert.match(errors[0], /must be a path like guides\//, bad);
  }
});

test('reports a key that is not a plugin API page', () => {
  const errors = validate({
    links: { 'core.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
    unmapped: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /core\.md: not a plugin API page/);
});

test('reports a guide that is not registered in the sidebar', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B' }),
    pluginNames: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /not registered in the sidebar/);
});

test('reports a framework-gated guide', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set([guide]) },
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /framework-specific/);
});

test('reports a plugin directory that is neither mapped nor listed as unmapped', () => {
  const errors = validate({ pluginNames: ['search', 'freezeBar'], unmapped: ['search'] });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /freezeBar: plugin has no guide link/);
});

test('ignores the base and test directories, and accepts a listed unmapped plugin', () => {
  assert.deepEqual(validate({ pluginNames: ['base', '__tests__', 'touchScroll'], unmapped: ['touchScroll'] }), []);
});

test('reports a plugin that is both mapped and listed as unmapped', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
    unmapped: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /both mapped and listed/);
});

test('the unmapped list names only real plugins', () => {
  for (const name of unmappedPlugins) {
    assert.ok(realPlugins.includes(name), `${name} is not a plugin directory`);
  }
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

test('the renderer writes the guide line for every mapped key, under the name it really receives', () => {
  const dist = mkdtempSync(join(tmpdir(), 'api-guide-render-'));
  const logger = { info() {}, log() {} };
  const render = buildRenderer({
    dist: file => join(dist, file.replace(/^[A-Z]/, upper => upper.toLowerCase())),
    generateMarkdown: () => '## Options\n',
    configuration: { seo: {}, urlPrefix: '/api/' },
    logger,
  });

  const classMembers = [{ kind: 'class', name: 'Page', longname: 'Page', id: 'Page', scope: 'global', meta: { filename: 'page.js' } }];

  for (const key of Object.keys(apiGuideLinks)) {
    // The parser hands the renderer the class name, so the first letter is a capital.
    render(key.replace(/^[a-z]/, lower => lower.toUpperCase()), classMembers, {});

    const output = readFileSync(join(dist, key), 'utf8');

    assert.match(output, /\[\[toc\]\]\n\nSee the \[[^\]]+\]\(@\/guides\/[^)]+\.md\) guide for /, key);
  }

  render('Core.md', classMembers, {});
  assert.doesNotMatch(readFileSync(join(dist, 'core.md'), 'utf8'), /See the \[/);
});

// Needs `npm run docs:api` first (content/api is generated and gitignored), so it skips on a clean checkout.
const generatedApiDir = join(realContentDir, 'api');
const hasGeneratedApi = Object.keys(apiGuideLinks).every(key => existsSync(join(generatedApiDir, key)));

test('generated API pages carry the guide line', { skip: !hasGeneratedApi && 'run npm run docs:api first' }, () => {
  for (const key of Object.keys(apiGuideLinks)) {
    assert.match(readFileSync(join(generatedApiDir, key), 'utf8'), /^See the \[/m, key);
  }
});
