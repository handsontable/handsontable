import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
const tempDirs = [];

function makeTempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));

  tempDirs.push(dir);

  return dir;
}

after(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function makeContentDir(pages) {
  const dir = makeTempDir('api-guide-links-');

  for (const [file, frontmatter] of Object.entries(pages)) {
    mkdirSync(join(dir, file, '..'), { recursive: true });
    writeFileSync(join(dir, file), `---\n${frontmatter}\n---\n\nBody.\n`, 'utf8');
  }

  return dir;
}

const emptyContentDir = makeContentDir({});

function validate(overrides) {
  return validateApiGuideLinks({
    links: {},
    contentDir: emptyContentDir,
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
  assert.equal(buildGuideLinkLine('touchScroll.md'), '');
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
    contentDir: makeContentDir({ [guide]: 'permalink: /b' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /has no title in its frontmatter/);
});

test('reports a guide with no permalink', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /has no permalink/);
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
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
    unmapped: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /core\.md: not a plugin, hooks, or baseEditor API page/);
});

test('buildGuideLinkLine writes one sentence per guide for an array entry', () => {
  const line = buildGuideLinkLine('exportFile.md');

  assert.equal(line.match(/ guide for examples and configuration details\./g).length, 2);
  assert.match(line, /^See the \[Export to CSV\]\(@\/guides\/accessories-and-menus\/export-to-csv\/export-to-csv\.md\) guide for examples and configuration details\. See the \[Export to Excel\]/);
});

test('buildGuideLinkLine keeps a one-element array identical to a plain string', () => {
  const links = { 'search.md': 'guides/navigation/searching-values/searching-values.md' };
  const asArray = { 'search.md': [links['search.md']] };

  assert.equal(buildGuideLinkLine('search.md', { links: asArray }), buildGuideLinkLine('search.md', { links }));
});

test('buildGuideLinkLine covers the Hooks and BaseEditor pages under the names the renderer passes', () => {
  assert.match(buildGuideLinkLine('Hooks.md'), /^See the \[[^\]]+\]\(@\/guides\/getting-started\/events-and-hooks\/events-and-hooks\.md\) guide for /);
  assert.match(buildGuideLinkLine('BaseEditor.md'), /^See the \[[^\]]+\]\(@\/guides\/cell-functions\/cell-editor\/cell-editor\.md\) guide for /);
});

test('buildGuideLinkLine returns an empty string for an empty array', () => {
  assert.equal(buildGuideLinkLine('search.md', { links: { 'search.md': [] } }), '');
});

test('accepts the hooks and baseEditor pages although they are not plugin directories', () => {
  const errors = validate({
    links: { 'hooks.md': guide, 'baseEditor.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
    pluginNames: [],
    sidebar: { all: new Set([guide]), gated: new Set() },
    unmapped: [],
  });

  assert.deepEqual(errors, []);
});

test('still rejects core.md and options.md', () => {
  for (const key of ['core.md', 'options.md']) {
    const errors = validate({
      links: { [key]: guide },
      contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
      pluginNames: [],
      sidebar: { all: new Set([guide]), gated: new Set() },
      unmapped: [],
    });

    assert.equal(errors.length, 1, key);
    assert.match(errors[0], /not a plugin, hooks, or baseEditor API page/, key);
  }
});

test('accepts an array of valid guides', () => {
  const other = 'guides/a/c/c.md';
  const errors = validate({
    links: { 'search.md': [guide, other] },
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b', [other]: 'title: C\npermalink: /c' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide, other]), gated: new Set() },
    unmapped: [],
  });

  assert.deepEqual(errors, []);
});

test('reports only the bad guide of an array', () => {
  const other = 'guides/a/c/c.md';
  const errors = validate({
    links: { 'search.md': [guide, other] },
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b', [other]: 'title: C\npermalink: /c' }),
    pluginNames: ['search'],
    sidebar: { all: new Set([guide]), gated: new Set() },
    unmapped: [],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /search\.md: the guide "guides\/a\/c\/c\.md" is not registered in the sidebar/);
});

test('reports an empty guide array', () => {
  const errors = validate({
    links: { 'search.md': [] },
    contentDir: makeContentDir({}),
    pluginNames: ['search'],
    sidebar: { all: new Set(), gated: new Set() },
    unmapped: [],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /search\.md: the guide list is empty/);
});

test('reports a guide that is not registered in the sidebar', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
    pluginNames: ['search'],
  });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /not registered in the sidebar/);
});

test('reports a framework-gated guide', () => {
  const errors = validate({
    links: { 'search.md': guide },
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
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
    contentDir: makeContentDir({ [guide]: 'title: B\npermalink: /b' }),
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

test('reports an unmapped name that is not a plugin directory', () => {
  const errors = validate({ pluginNames: ['search'], unmapped: ['search', 'oldName'] });

  assert.equal(errors.length, 1);
  assert.match(errors[0], /oldName: listed in unmappedPlugins but is not a plugin directory/);
});

test('collectSidebarGuides treats onlyFor as gating whether it is an array or a string', () => {
  const { gated } = collectSidebarGuides({
    guides: [
      { path: 'guides/x/a/a', onlyFor: 'react' },
      { path: 'guides/x/b/b', onlyFor: ['vue'] },
      { path: 'guides/x/c/c' },
    ],
  });

  assert.deepEqual([...gated].sort(), ['guides/x/a/a.md', 'guides/x/b/b.md']);
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
  const dist = makeTempDir('api-guide-render-');
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

// Needs `npm run docs:api` first (content/api is generated and gitignored). `core.md` is always
// generated, so its absence means "not generated yet" and the test skips. Once the pages exist,
// a mapped key whose page is missing fails here instead of skipping.
const generatedApiDir = join(realContentDir, 'api');
const hasGeneratedApi = existsSync(join(generatedApiDir, 'core.md'));

test('generated API pages carry the guide line', { skip: !hasGeneratedApi && 'run npm run docs:api first' }, () => {
  for (const key of Object.keys(apiGuideLinks)) {
    const file = join(generatedApiDir, key);

    assert.ok(existsSync(file), `${key}: page was not generated, re-run npm run docs:api`);
    assert.match(
      readFileSync(file, 'utf8'),
      /^See the \[/m,
      `${key}: no guide line, content/api may be stale, re-run npm run docs:api`
    );
  }
});
