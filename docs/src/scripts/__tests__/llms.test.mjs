import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  buildLlmsFull,
  buildLlmsIndex,
  buildLlmsSections,
  flattenSectionItems,
  SITE_URL,
} from '../../llms.mjs';
import { buildAllSidebars } from '../../sidebar.mjs';

// Built once: buildAllSidebars() re-reads frontmatter for every content page,
// so every real-content test below shares this result.
const realSidebars = buildAllSidebars();

// ---------------------------------------------------------------------------
// Fixtures: a minimal buildAllSidebars() shape with one shared guide, one
// framework-specific guide, an API section, recipes, and all three changelog
// groups.
// ---------------------------------------------------------------------------

function fixtureSidebars() {
  return {
    javascript: [
      {
        label: 'Getting started',
        items: [
          { label: 'Introduction', link: '/javascript-data-grid/' },
          { label: 'Installation', link: '/javascript-data-grid/installation/' },
          { label: 'GitHub', link: 'https://github.com/handsontable/handsontable' },
          {
            label: 'Nested group',
            items: [{ label: 'Hello world', link: '/javascript-data-grid/hello-world/' }],
          },
        ],
      },
      {
        label: 'API reference',
        items: [{ label: 'Core', link: '/javascript-data-grid/api/core/' }],
      },
    ],
    react: [
      {
        label: 'Getting started',
        items: [
          { label: 'Introduction', link: '/react-data-grid/' },
          { label: 'Installation', link: '/react-data-grid/installation/' },
          { label: 'Instance methods', link: '/react-data-grid/instance-methods/' },
        ],
      },
      {
        label: 'API reference',
        items: [{ label: 'Core', link: '/react-data-grid/api/core/' }],
      },
    ],
    angular: [],
    vue: [],
    javascriptRecipes: [
      {
        label: 'Data management',
        items: [{ label: 'Overview', link: '/javascript-data-grid/recipes/data-management/' }],
      },
    ],
    reactRecipes: [],
    angularRecipes: [],
    vueRecipes: [],
    javascriptChangelog: [
      {
        label: 'Changelog',
        items: [{ label: 'Changelog', link: '/javascript-data-grid/changelog/' }],
      },
      {
        label: 'Policy',
        items: [{ label: 'Versioning policy', link: '/javascript-data-grid/versioning-policy/' }],
      },
      {
        label: 'Migration guides',
        items: [{ label: 'Migrating from 14.0 to 15.0', link: '/javascript-data-grid/migration-from-14.0-to-15.0/' }],
      },
    ],
    reactChangelog: [],
    angularChangelog: [],
    vueChangelog: [],
  };
}

function fixtureRouteMap(sections) {
  const routeMap = new Map();

  for (const section of sections) {
    for (const { label, slug, prefix } of section.items) {
      routeMap.set(`${prefix}/${slug}.md`, `# ${label}\n\nBody of ${slug}.\n\n## A body heading\n\nMore text.`);
    }
  }

  return routeMap;
}

// ---------------------------------------------------------------------------
// flattenSectionItems
// ---------------------------------------------------------------------------

test('flattenSectionItems walks nested groups, keeps the prefix, and maps the framework root to "index"', () => {
  const items = flattenSectionItems(fixtureSidebars().javascript[0].items, 'javascript-data-grid');

  assert.deepEqual(items.map((i) => i.slug), ['index', 'installation', 'hello-world']);
  assert.ok(items.every((i) => i.prefix === 'javascript-data-grid'));
});

test('flattenSectionItems skips external links and links under another prefix', () => {
  const items = flattenSectionItems(fixtureSidebars().react[0].items, 'javascript-data-grid');

  assert.deepEqual(items, []);
});

// ---------------------------------------------------------------------------
// buildLlmsSections
// ---------------------------------------------------------------------------

test('buildLlmsSections merges frameworks by slug: shared pages stay canonical, framework-specific pages keep their prefix', () => {
  const sections = buildLlmsSections(fixtureSidebars());
  const gettingStarted = sections.find((s) => s.label === 'Getting started');
  const bySlug = new Map(gettingStarted.items.map((i) => [i.slug, i]));

  assert.equal(bySlug.get('installation').prefix, 'javascript-data-grid');
  assert.equal(bySlug.get('instance-methods').prefix, 'react-data-grid');
  assert.equal(gettingStarted.items.filter((i) => i.slug === 'installation').length, 1);
});

test('buildLlmsSections excludes the API reference and Changelog groups, includes Recipes, Policy, and Migration guides', () => {
  const labels = buildLlmsSections(fixtureSidebars()).map((s) => s.label);

  assert.deepEqual(labels, ['Getting started', 'Recipes', 'Policy', 'Migration guides']);

  const flat = buildLlmsSections(fixtureSidebars()).flatMap((s) => s.items);

  assert.ok(!flat.some((i) => i.slug.startsWith('api/')), 'API pages must not leak into the sections');
  assert.ok(!flat.some((i) => i.slug === 'changelog'), 'changelog version pages must stay excluded');
  assert.ok(flat.some((i) => i.slug === 'recipes/data-management'));
  assert.ok(flat.some((i) => i.slug === 'versioning-policy'));
});

test('the real sidebar still carries the labels buildLlmsSections matches by name', () => {
  // buildLlmsSections() matches these labels as strings. Renaming one in
  // sidebar.mjs silently changes the published llms.txt/llms-full.txt: a
  // renamed 'API reference' floods the index with ~200 API pages, a renamed
  // changelog group drops its pages from the corpus.
  const sidebarLabels = realSidebars.javascript.map((s) => s.label);

  assert.ok(sidebarLabels.includes('API reference'));

  const changelogLabels = realSidebars.javascriptChangelog.map((s) => s.label);

  assert.ok(changelogLabels.includes('Policy'));
  assert.ok(changelogLabels.includes('Migration guides'));
});

test('the real sidebars produce the pages each review flagged as missing', () => {
  const flat = buildLlmsSections(realSidebars).flatMap((s) => s.items);
  const bySlug = new Map(flat.map((i) => [i.slug, i]));

  // Introduction (permalink `/`).
  assert.equal(bySlug.get('index')?.prefix, 'javascript-data-grid');
  // Framework-specific guides under their own prefix.
  assert.equal(bySlug.get('instance-methods')?.prefix, 'react-data-grid');
  assert.equal(bySlug.get('vue-pinia')?.prefix, 'vue-data-grid');
  // Policy pages.
  for (const slug of ['versioning-policy', 'deprecation-policy', 'long-term-support']) {
    assert.ok(bySlug.has(slug), slug);
  }
  // Recipes.
  assert.ok(flat.some((i) => i.slug.startsWith('recipes/')));
});

// ---------------------------------------------------------------------------
// buildLlmsIndex
// ---------------------------------------------------------------------------

test('buildLlmsIndex renders sections with per-page descriptions and root-page URLs without a slug segment', () => {
  const sections = buildLlmsSections(fixtureSidebars());
  const pageMeta = new Map([
    ['index', { title: 'Introduction', description: 'What Handsontable is.' }],
    ['installation', { title: 'Installation', description: 'Install the package.' }],
  ]);
  const index = buildLlmsIndex(pageMeta, sections);

  assert.ok(index.startsWith('# Handsontable\n'));
  assert.ok(index.includes(`- [Introduction](${SITE_URL}/docs/javascript-data-grid/): What Handsontable is.`));
  assert.ok(index.includes(`- [Installation](${SITE_URL}/docs/javascript-data-grid/installation/): Install the package.`));
  assert.ok(index.includes(`- [Instance methods](${SITE_URL}/docs/react-data-grid/instance-methods/)`));
  assert.ok(!index.includes('/docs/javascript-data-grid/index/'), 'the root page URL must not carry an index segment');
});

test('buildLlmsIndex prefers the page title over its sidebar label', () => {
  // Recipe group overview pages are labelled 'Overview' in the sidebar (the
  // group heading supplies the context there); the flat index must use the
  // page's own title instead.
  const sections = buildLlmsSections(fixtureSidebars());
  const pageMeta = new Map([
    ['recipes/data-management', { title: 'Data management', description: '' }],
  ]);
  const index = buildLlmsIndex(pageMeta, sections);

  assert.ok(index.includes(`- [Data management](${SITE_URL}/docs/javascript-data-grid/recipes/data-management/)`));
  assert.ok(!index.includes('- [Overview]'));
});

test('buildLlmsIndex ends with the expanded trademark disclaimer and serves no em or en dash', () => {
  const index = buildLlmsIndex(new Map(), buildLlmsSections(fixtureSidebars()));

  assert.ok(index.includes(
    'Microsoft and Excel are registered trademarks of Microsoft Corporation. Google Sheets is a trademark of Google LLC.'
  ));
  assert.ok(!/[–—]/.test(index), 'AGENTS.md 2.2: no en/em dashes in served content');
});

test('no real frontmatter title or description ships an em or en dash into llms.txt', () => {
  // buildLlmsIndex() interpolates `title` and `description` frontmatter
  // verbatim into the published /docs/llms.txt, so AGENTS.md 2.2 (hyphens or
  // double hyphens, never en/em dashes) applies to those fields. The fixture
  // test above cannot see real content; this one scans it.
  const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'content');
  const offenders = [];

  const scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(full);
        continue;
      }

      if (!entry.name.endsWith('.md')) continue;

      const frontmatter = readFileSync(full, 'utf-8').match(/^---\n([\s\S]*?)\n---/);

      if (frontmatter && /^(?:title|description):.*[–—]/m.test(frontmatter[1])) {
        offenders.push(full);
      }
    }
  };

  scan(contentDir);
  assert.deepEqual(offenders, [], 'em/en dash in title/description frontmatter (AGENTS.md 2.2)');
});

// ---------------------------------------------------------------------------
// buildLlmsFull
// ---------------------------------------------------------------------------

test('buildLlmsFull emits each page as an H1 boundary with a URL line, keeping body headings nested', () => {
  const sections = buildLlmsSections(fixtureSidebars());
  const full = buildLlmsFull(fixtureRouteMap(sections), sections);

  assert.ok(full.includes(
    `---\n\n# Installation\n\nURL: ${SITE_URL}/docs/javascript-data-grid/installation/\n\nBody of installation.\n\n## A body heading`
  ));
  // The root page resolves to the prefix root, not /index/.
  assert.ok(full.includes(`URL: ${SITE_URL}/docs/javascript-data-grid/\n`));
  // A framework-specific page embeds its own framework's copy.
  assert.ok(full.includes(`URL: ${SITE_URL}/docs/react-data-grid/instance-methods/`));
  // One H1 per page plus the corpus title: boundaries survive chunking by heading.
  const pageCount = sections.reduce((n, s) => n + s.items.length, 0);

  assert.equal(full.match(/^# /gm).length, pageCount + 1);
});

test('buildLlmsFull fails loudly when a sidebar page has no Markdown twin', () => {
  const sections = buildLlmsSections(fixtureSidebars());
  const routeMap = fixtureRouteMap(sections);

  routeMap.delete('javascript-data-grid/installation.md');

  assert.throws(() => buildLlmsFull(routeMap, sections), /no Markdown twin .*installation/);
});
