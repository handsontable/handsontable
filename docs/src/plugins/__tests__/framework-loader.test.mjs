import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frameworkLoader } from '../framework-loader.mjs';
import { setRenderedHtmlDirForTests, readRenderedHtml } from '../rendered-html-store.mjs';
import { LATEST_CHANGELOG_MAJOR } from '../changelog-parser.mjs';
import { CURRENT_DOCS_VERSION, CURRENT_EXAMPLES_BRANCH } from '../docs-version.mjs';

// The loader writes each entry's rendered HTML to a file and stores only a
// marker in the data store (see rendered-html-store.mjs) — keep test writes
// out of the real docs/.astro directory.
const renderedHtmlDir = mkdtempSync(join(tmpdir(), 'hot-rendered-'));

setRenderedHtmlDirForTests(renderedHtmlDir);
test.after(() => rmSync(renderedHtmlDir, { recursive: true, force: true }));

/**
 * Resolves an entry's rendered HTML through the marker + file indirection.
 *
 * @param {Map<string, object>} store
 * @param {string} id
 * @returns {string}
 */
function renderedHtmlOf(store, id) {
  const marker = store.get(id).rendered.html;

  assert.match(marker, /^<!--hot-rendered:[\w./-]+-->$/, 'store must hold a marker, not HTML');

  return readRenderedHtml(id);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Builds a temp content tree with one embedded JS example and returns paths.
 *
 * @returns {{ contentDir: string, root: string, introMd: string, exampleJs: string }}
 */
function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-'));
  const contentDir = join(root, 'content');
  const introDir = join(contentDir, 'guides', 'intro');
  const jsDir = join(introDir, 'javascript');

  mkdirSync(jsDir, { recursive: true });

  // Root splash page (special-cased as the bare "index" entry).
  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');

  const introMd = join(introDir, 'intro.md');

  writeFileSync(
    introMd,
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      'Intro body v1.',
      '',
      '::: example #ex1',
      '@[code](@/content/guides/intro/javascript/example1.js)',
      ':::',
      '',
    ].join('\n')
  );

  const exampleJs = join(jsDir, 'example1.js');

  writeFileSync(exampleJs, "const grid = 'EXAMPLE_CODE_V1';\n");

  return { contentDir, root, introMd, exampleJs };
}

/**
 * Builds a fake Astro loader context with a Map-backed store that mirrors
 * Astro's digest-skip semantics (set() is a no-op when the digest is unchanged).
 *
 * @returns {{ ctx: object, store: Map<string, object>, watcher: EventEmitter }}
 */
function createContext() {
  const entries = new Map();
  const watcher = new EventEmitter();

  watcher.add = () => {};

  const store = {
    set(entry) {
      const existing = entries.get(entry.id);

      if (existing && existing.digest === entry.digest) {
        return false;
      }

      entries.set(entry.id, entry);

      return true;
    },
    get: id => entries.get(id),
    has: id => entries.has(id),
    delete: id => entries.delete(id),
    keys: () => [...entries.keys()],
  };

  const ctx = {
    store,
    watcher,
    parseData: async ({ data }) => data,
    generateDigest: data => String(data),
    renderMarkdown: async body => ({
      html: body,
      metadata: { headings: [], imagePaths: [], frontmatter: {} },
    }),
    logger: { warn() {}, info() {}, debug() {}, error() {} },
  };

  return { ctx, store: entries, watcher };
}

test('initial load emits one entry per framework and inlines example code', async () => {
  const { contentDir, root } = createFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    for (const prefix of ['javascript-data-grid', 'react-data-grid', 'angular-data-grid', 'vue-data-grid']) {
      assert.ok(store.has(`${prefix}/intro`), `missing entry for ${prefix}`);
    }

    assert.ok(store.has('index'), 'missing root index entry');
    assert.match(renderedHtmlOf(store, 'javascript-data-grid/intro'), /EXAMPLE_CODE_V1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('editing a markdown file hot reloads its entries', async () => {
  const { contentDir, root, introMd } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const before = renderedHtmlOf(store, 'javascript-data-grid/intro');

    assert.match(before, /Intro body v1\./);

    writeFileSync(
      introMd,
      [
        '---',
        'title: Introduction',
        'permalink: /intro',
        '---',
        '',
        'Intro body v2 EDITED.',
        '',
        '::: example #ex1',
        '@[code](@/content/guides/intro/javascript/example1.js)',
        ':::',
        '',
      ].join('\n')
    );

    watcher.emit('change', introMd);
    await sleep(250);

    const after = renderedHtmlOf(store, 'javascript-data-grid/intro');

    assert.match(after, /Intro body v2 EDITED\./);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('editing an embedded example source hot reloads the pages that embed it', async () => {
  const { contentDir, root, exampleJs } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    assert.match(renderedHtmlOf(store, 'react-data-grid/intro'), /EXAMPLE_CODE_V1/);

    // Rewrite the example and force a distinct mtime so the digest changes even
    // on filesystems with coarse mtime granularity.
    writeFileSync(exampleJs, "const grid = 'EXAMPLE_CODE_V2';\n");
    const future = new Date(Date.now() + 10_000);

    utimesSync(exampleJs, future, future);

    watcher.emit('change', exampleJs);
    await sleep(250);

    assert.match(renderedHtmlOf(store, 'react-data-grid/intro'), /EXAMPLE_CODE_V2/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('deleting a markdown file removes its entries from the store', async () => {
  const { contentDir, root, introMd } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    assert.ok(store.has('vue-data-grid/intro'));

    watcher.emit('unlink', introMd);
    await sleep(250);

    for (const prefix of ['javascript-data-grid', 'react-data-grid', 'angular-data-grid', 'vue-data-grid']) {
      assert.ok(!store.has(`${prefix}/intro`), `entry for ${prefix} should be removed`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('renaming a permalink removes the entries at the old URL', async () => {
  const { contentDir, root, introMd } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    assert.ok(store.has('javascript-data-grid/intro'));

    writeFileSync(
      introMd,
      [
        '---',
        'title: Introduction',
        'permalink: /getting-started',
        '---',
        '',
        'Body.',
        '',
      ].join('\n')
    );

    watcher.emit('change', introMd);
    await sleep(250);

    assert.ok(!store.has('javascript-data-grid/intro'), 'stale entry at old permalink should be removed');
    assert.ok(store.has('javascript-data-grid/getting-started'), 'entry at new permalink should exist');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('changes outside the content directory are ignored', async () => {
  const { contentDir, root } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const keysBefore = store.size;

    watcher.emit('change', join(root, 'src', 'components', 'Header.astro'));
    await sleep(250);

    assert.equal(store.size, keysBefore);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Builds a temp content tree with a React example that embeds both a .jsx and a
 * .tsx source file, so the fenced-code language mapping can be asserted.
 *
 * @param {object} [options]
 * @param {string[]} [options.order] The order the example lists its sources in, by extension.
 * @returns {{ contentDir: string, root: string }}
 */
function createReactFixture({ order = ['jsx', 'tsx'] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-'));
  const contentDir = join(root, 'content');
  const reactDir = join(contentDir, 'guides', 'intro', 'react');

  mkdirSync(reactDir, { recursive: true });

  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');

  writeFileSync(
    join(contentDir, 'guides', 'intro', 'intro.md'),
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      'Intro body.',
      '',
      '::: example #ex1',
      ...order.map(ext => `@[code](@/content/guides/intro/react/example1.${ext})`),
      ':::',
      '',
    ].join('\n')
  );

  writeFileSync(join(reactDir, 'example1.jsx'), 'export const Grid = () => <HotTable data={[]} />;\n');
  writeFileSync(join(reactDir, 'example1.tsx'), 'export const Grid = (): JSX.Element => <HotTable data={[]} />;\n');

  return { contentDir, root };
}

test('.jsx/.tsx examples render with jsx/tsx code fences, not js/ts', async () => {
  const { contentDir, root } = createReactFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'react-data-grid/intro');

    // The fix: .jsx/.tsx extensions map to the jsx/tsx Shiki grammars, so the
    // angle-bracket markup highlights correctly.
    assert.ok(html.includes('````jsx title="JavaScript"'), 'expected a jsx code fence');
    assert.ok(html.includes('````tsx title="TypeScript"'), 'expected a tsx code fence');

    // Regression guard: before the fix these fell back to the plain js/ts
    // grammars, which mis-colored JSX. The tab labels stay JavaScript/TypeScript.
    assert.ok(!html.includes('````javascript title='), '.jsx must not fall back to a javascript fence');
    assert.ok(!html.includes('````typescript title='), '.tsx must not fall back to a typescript fence');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// The runner (src/scripts/example-runner.ts) has modules for `example*.jsx` only, so a React example
// handed its .tsx path renders nothing. The View state page lists the .tsx first, TypeScript being the
// primary language for new examples, and its React example showed no grid.
for (const order of [['jsx', 'tsx'], ['tsx', 'jsx']]) {
  test(`a React example runs its .jsx when the sources are listed ${order.join(' then ')}`, async () => {
    const { contentDir, root } = createReactFixture({ order });

    try {
      const { ctx, store } = createContext();

      await frameworkLoader({ contentDir }).load(ctx);

      const html = renderedHtmlOf(store, 'react-data-grid/intro');

      assert.ok(html.includes('data-example-jsx="/content/guides/intro/react/example1.jsx"'),
        'the runner must get the .jsx, the only React source it can load');
      assert.ok(!html.includes('data-example-jsx="/content/guides/intro/react/example1.tsx"'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

/**
 * Builds a temp content tree with a server-side-only example (a .cs file with
 * no runnable JS/TS/Vue entry point), so the fenced-code language mapping for
 * non-JS backend languages can be asserted.
 *
 * @returns {{ contentDir: string, root: string }}
 */
function createCsharpFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-'));
  const contentDir = join(root, 'content');
  const serverDir = join(contentDir, 'guides', 'intro', 'server');

  mkdirSync(serverDir, { recursive: true });

  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');

  writeFileSync(
    join(contentDir, 'guides', 'intro', 'intro.md'),
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      'Intro body.',
      '',
      '::: example #ex1',
      '@[code csharp](@/content/guides/intro/server/Order.cs)',
      ':::',
      '',
    ].join('\n')
  );

  writeFileSync(join(serverDir, 'Order.cs'), 'public class Order\n{\n    public int Id { get; set; }\n}\n');

  return { contentDir, root };
}

test('.cs examples render with a csharp code fence, not a plain-text fence', async () => {
  const { contentDir, root } = createCsharpFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/intro');

    // The fix: .cs extensions map to the csharp Shiki grammar, so the code
    // highlights instead of rendering as flat, uncolored text.
    assert.ok(html.includes('````csharp title="C#"'), 'expected a csharp code fence');

    // Regression guard: before the fix, .cs had no EXT_TO_LANG entry and fell
    // back to the plain-text grammar (no highlighting).
    assert.ok(!html.includes('````text title='), '.cs must not fall back to a plain-text fence');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Builds a temp content tree with an intro page whose "Changelog" link uses
 * the {{$latestChangelogVersion}} placeholder inside an @/...md reference,
 * plus a matching changelog-N target page (DEV-2031).
 *
 * @returns {{ contentDir: string, root: string }}
 */
function createChangelogLinkFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-changelog-'));
  const contentDir = join(root, 'content');
  const introDir = join(contentDir, 'guides', 'intro');
  const changelogDir = join(contentDir, 'guides', 'upgrade-and-migration', `changelog-${LATEST_CHANGELOG_MAJOR}`);

  mkdirSync(introDir, { recursive: true });
  mkdirSync(changelogDir, { recursive: true });

  writeFileSync(
    join(introDir, 'intro.md'),
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      '[Changelog](@/guides/upgrade-and-migration/changelog-{{$latestChangelogVersion}}/changelog-{{$latestChangelogVersion}}.md)',
      '',
    ].join('\n')
  );

  writeFileSync(
    join(changelogDir, `changelog-${LATEST_CHANGELOG_MAJOR}.md`),
    ['---', 'title: Changelog', `permalink: /changelog-${LATEST_CHANGELOG_MAJOR}`, '---', '', 'Changelog body.', ''].join('\n')
  );

  return { contentDir, root };
}

/**
 * Builds a temp content tree with a vanilla guide example that embeds both a
 * .js and a .ts source file, so the runner-link tab-follow data can be asserted.
 *
 * @returns {{ contentDir: string, root: string }}
 */
function createVanillaJsTsFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-jsts-'));
  const contentDir = join(root, 'content');
  const jsDir = join(contentDir, 'guides', 'intro', 'javascript');

  mkdirSync(jsDir, { recursive: true });

  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');

  writeFileSync(
    join(contentDir, 'guides', 'intro', 'intro.md'),
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      'Intro body.',
      '',
      '::: example #ex1 --js 1 --ts 2',
      '@[code](@/content/guides/intro/javascript/example1.js)',
      '@[code](@/content/guides/intro/javascript/example1.ts)',
      ':::',
      '',
    ].join('\n')
  );

  writeFileSync(join(jsDir, 'example1.js'), "const grid = 'EXAMPLE_CODE_V1';\n");
  writeFileSync(join(jsDir, 'example1.ts'), "const grid: string = 'EXAMPLE_CODE_V1';\n");

  return { contentDir, root };
}

test('vanilla JS/TS guide example gets a runner link that follows the active tab', async () => {
  const { contentDir, root } = createVanillaJsTsFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/intro');

    assert.ok(html.includes('class="hot-example-runner-btn"'), 'expected a runner link');
    assert.ok(
      html.includes(`href="https://demos.handsontable.com/?docs=guides/intro/javascript/example1.js&amp;v=${CURRENT_DOCS_VERSION}"`),
      'runner href should point at the .js variant with the resolved docs version'
    );
    assert.ok(html.includes('data-docs-ts="guides/intro/javascript/example1.ts"'), 'expected the .ts variant path for the client-side tab rewrite');
    assert.ok(html.includes('data-runner-version="'), 'expected the version to be carried for the client-side rewrite');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('React example links the runner to the .tsx variant, not .jsx, with no tab-follow data', async () => {
  const { contentDir, root } = createReactFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'react-data-grid/intro');

    assert.ok(
      html.includes(`href="https://demos.handsontable.com/?docs=guides/intro/react/example1.tsx&amp;v=${CURRENT_DOCS_VERSION}"`),
      'runner href should point at the .tsx variant even though .jsx is listed first'
    );
    assert.ok(!html.includes('data-docs-js'), 'React examples have no manifest-eligible JS variant to follow');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Builds a temp content tree with a recipe example (not under guides/), to
 * confirm recipe examples get a runner link just like guide examples do.
 *
 * @returns {{ contentDir: string, root: string }}
 */
function createRecipeFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-recipe-'));
  const contentDir = join(root, 'content');
  const jsDir = join(contentDir, 'recipes', 'themes', 'base-theme', 'javascript');

  mkdirSync(jsDir, { recursive: true });

  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');

  writeFileSync(
    join(contentDir, 'recipes', 'themes', 'base-theme', 'base-theme.md'),
    [
      '---',
      'title: Base theme',
      'permalink: /recipes/themes/base-theme',
      '---',
      '',
      '::: example #ex1',
      '@[code](@/content/recipes/themes/base-theme/javascript/example1.js)',
      ':::',
      '',
    ].join('\n')
  );

  writeFileSync(join(jsDir, 'example1.js'), "const grid = 'RECIPE_EXAMPLE';\n");

  return { contentDir, root };
}

test('recipe examples (outside guides/) get a runner link too', async () => {
  const { contentDir, root } = createRecipeFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/recipes/themes/base-theme');

    assert.ok(
      html.includes(`href="https://demos.handsontable.com/?docs=recipes/themes/base-theme/javascript/example1.js&amp;v=${CURRENT_DOCS_VERSION}"`),
      'recipe examples should link the runner the same way guide examples do'
    );
    assert.ok(!html.includes('hot-example-stackblitz-btn'), 'StackBlitz button should not render');
    assert.ok(!html.includes('hot-example-sb-data'), 'StackBlitz data blob should not render');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('server-side-only examples still render no toolbar at all (regression guard)', async () => {
  const { contentDir, root } = createCsharpFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/intro');

    assert.ok(!html.includes('hot-example-runner-btn'), 'no runnable entry point means no toolbar, including the runner link');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('{{$latestChangelogVersion}} placeholder resolves to the latest changelog page inside an @/...md link', async () => {
  const { contentDir, root } = createChangelogLinkFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/intro');

    // The fix: the placeholder is resolved before @/...md link resolution,
    // so the link lands on the real latest changelog-N page.
    assert.ok(
      html.includes(`/docs/javascript-data-grid/changelog-${LATEST_CHANGELOG_MAJOR}/`),
      `expected link to resolve to the latest changelog (changelog-${LATEST_CHANGELOG_MAJOR})`
    );

    // Regression guard: if the placeholder were substituted after (or never),
    // the literal "{{" would leak into the link or the fallback path.
    assert.ok(!html.includes('{{'), 'no unresolved {{$latestChangelogVersion}} placeholder should remain');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('{{$examplesBranch}} placeholder resolves to the matching handsontable/examples branch', async () => {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-examples-branch-'));
  const contentDir = join(root, 'content');
  const recipeDir = join(contentDir, 'recipes', 'themes', 'mui-theme');

  mkdirSync(recipeDir, { recursive: true });
  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');
  writeFileSync(
    join(recipeDir, 'mui-theme.md'),
    [
      '---',
      'title: MUI theme',
      'permalink: /mui-theme',
      '---',
      '',
      '[**View source on GitHub**](https://github.com/handsontable/examples/tree/{{$examplesBranch}}/examples/mui)',
      '',
    ].join('\n')
  );

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const html = renderedHtmlOf(store, 'javascript-data-grid/mui-theme');

    assert.ok(
      html.includes(`https://github.com/handsontable/examples/tree/${CURRENT_EXAMPLES_BRANCH}/examples/mui`),
      `expected the starter link to point at ${CURRENT_EXAMPLES_BRANCH}`
    );

    // DEV-2214: a hardcoded tree/master link sends a reader on older docs to a
    // starter that no longer matches their version.
    assert.ok(!html.includes('{{'), 'no unresolved {{$examplesBranch}} placeholder should remain');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Builds a temp content tree whose page holds `@/` in code (a project path
 * alias, as in the custom-theme recipe) and in prose, plus an API page that a
 * fenced `@/...md` link resolves to.
 *
 * @returns {{ contentDir: string, root: string }}
 */
function createCodeAliasFixture() {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-code-alias-'));
  const contentDir = join(root, 'content');
  const introDir = join(contentDir, 'guides', 'intro');
  const apiDir = join(contentDir, 'api');

  mkdirSync(introDir, { recursive: true });
  mkdirSync(apiDir, { recursive: true });
  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');
  writeFileSync(
    join(introDir, 'intro.md'),
    [
      '---',
      'title: Introduction',
      'permalink: /intro',
      '---',
      '',
      '```tsx',
      'import { colorsShadcn } from "@/lib/theme/colorsShadcn";',
      '```',
      '',
      'Use it: `import DataGrid from "@/lib/DataGrid"` and render it.',
      '',
      '::: tip',
      'Aside code: `@/lib/asideHelper`',
      ':::',
      '',
      '```js',
      '/**',
      ' * The [`BasePlugin`](@/api/basePlugin.md)\'s constructor adds `this.hot`.',
      ' */',
      '```',
      '',
      '[Data file](@/react/files/data.csv)',
      '',
    ].join('\n')
  );
  writeFileSync(
    join(apiDir, 'basePlugin.md'),
    ['---', 'title: BasePlugin', 'permalink: /api/base-plugin', '---', '', 'API body.', ''].join('\n')
  );

  return { contentDir, root };
}

/**
 * Loads the code-alias fixture and returns the vanilla intro page.
 *
 * @returns {Promise<string>}
 */
async function loadCodeAliasPage() {
  const { contentDir, root } = createCodeAliasFixture();

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    return renderedHtmlOf(store, 'javascript-data-grid/intro');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('an @/ path alias inside a code fence is not stripped', async () => {
  const html = await loadCodeAliasPage();

  assert.ok(html.includes('import { colorsShadcn } from "@/lib/theme/colorsShadcn";'), 'fenced import keeps @/lib/');
  assert.ok(!html.includes('"/theme/colorsShadcn"'), 'the @/lib/ segment must not be stripped from the fence');
});

test('an @/ path alias inside inline code is not stripped', async () => {
  const html = await loadCodeAliasPage();

  assert.ok(html.includes('`import DataGrid from "@/lib/DataGrid"`'), 'inline code keeps @/lib/');
  // Asides turn inline code into <code> HTML before the strip runs.
  assert.ok(html.includes('<code>@/lib/asideHelper</code>'), 'aside inline code keeps @/lib/');
});

test('an @/...md link inside a code fence still resolves', async () => {
  const html = await loadCodeAliasPage();

  assert.ok(
    html.includes('[`BasePlugin`](/docs/javascript-data-grid/api/base-plugin/)'),
    'the fenced JSDoc link resolves to the API page permalink'
  );
  assert.ok(!html.includes('@/api/'), 'no unresolved @/api/ link should remain');
});

test('an @/framework/ prefix outside code is still stripped', async () => {
  const html = await loadCodeAliasPage();

  assert.ok(html.includes('[Data file](/files/data.csv)'), 'prose link loses its @/react/ prefix');
  assert.ok(!html.includes('@/react/'), 'no @/react/ prefix should remain');
});

/**
 * Loads a one-page fixture whose body is `body` and returns the vanilla page HTML.
 *
 * @param {string} body
 * @returns {Promise<string>}
 */
async function loadPageWithBody(body) {
  const root = mkdtempSync(join(tmpdir(), 'hot-loader-aside-'));
  const contentDir = join(root, 'content');
  const introDir = join(contentDir, 'guides', 'intro');

  mkdirSync(introDir, { recursive: true });
  writeFileSync(join(contentDir, 'index.md'), '---\ntitle: Home\n---\n\nWelcome.\n');
  writeFileSync(
    join(introDir, 'intro.md'),
    ['---', 'title: Introduction', 'permalink: /intro', '---', '', body, ''].join('\n')
  );

  try {
    const { ctx, store } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    return renderedHtmlOf(store, 'javascript-data-grid/intro');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('a fenced code block inside an aside stays a markdown fence between its paragraphs', async () => {
  const html = await loadPageWithBody([
    '::: warning',
    '',
    'First paragraph with `code`.',
    '',
    'Second paragraph, **bold**:',
    '',
    '```js',
    'hot.batch(() => {',
    '  hot.render();',
    '});',
    '```',
    '',
    'Closing paragraph.',
    '',
    ':::',
    '',
    'After the aside.',
  ].join('\n'));

  const lines = html.split('\n');
  const open = lines.indexOf('```js');
  const close = lines.indexOf('```', open + 1);

  assert.ok(open > 0 && close > open, 'the fence survives as its own markdown lines');
  assert.deepEqual(lines.slice(open + 1, close), ['hot.batch(() => {', '  hot.render();', '});'], 'fence body is untouched');
  assert.equal(lines[open - 1], '', 'a blank line precedes the fence so markdown parses it');
  assert.equal(lines[close + 1], '', 'a blank line follows the fence so markdown parses it');
  assert.ok(html.includes('<p>First paragraph with <code>code</code>.</p>'), 'first paragraph is its own <p>');
  assert.ok(html.includes('<p>Second paragraph, <strong>bold</strong>:</p>'), 'second paragraph is its own <p>');
  assert.ok(html.includes('<p>Closing paragraph.</p>'), 'text after the fence is its own <p>');
  assert.ok(html.indexOf('</aside>') > close, 'the aside closes after the fence');
  assert.equal(html.match(/<aside /g).length, 1, 'one aside');
  assert.equal(html.match(/<\/aside>/g).length, 1, 'aside closed once');
});

test('an aside without a fence keeps its single-paragraph HTML', async () => {
  const html = await loadPageWithBody('::: tip\nUse `foo` **now**.\n:::');

  assert.ok(
    html.includes('<div class="starlight-aside__content"><p>Use <code>foo</code> <strong>now</strong>.</p></div>'),
    'unchanged output for a fence-free aside'
  );
});

test('a longer fence in an aside is not closed by a shorter fence line inside it', async () => {
  const html = await loadPageWithBody([
    '::: note',
    'Intro.',
    '````md',
    '```js',
    'inner();',
    '```',
    '````',
    ':::',
  ].join('\n'));

  const lines = html.split('\n');
  const open = lines.indexOf('````md');
  const close = lines.indexOf('````', open + 1);

  assert.ok(open > 0 && close > open, 'outer four-backtick fence is kept whole');
  assert.deepEqual(lines.slice(open + 1, close), ['```js', 'inner();', '```'], 'inner fence lines stay inside');
  assert.ok(html.indexOf('</aside>') > close, 'the aside closes after the outer fence');
});

test('a fenced block that is the whole aside body keeps the aside well formed', async () => {
  const html = await loadPageWithBody(['::: tip', '~~~js', 'hot.render();', '~~~', ':::'].join('\n'));
  const lines = html.split('\n');

  assert.ok(lines.includes('~~~js') && lines.includes('hot.render();'), 'tilde fence is kept as markdown');
  assert.equal(html.match(/<aside /g).length, 1);
  assert.equal(html.match(/<\/aside>/g).length, 1);
  assert.ok(!html.includes('<p></p>'), 'no empty paragraph for a body that is only a fence');
});

test('an unclosed fence in an aside is closed before the aside ends', async () => {
  const html = await loadPageWithBody(['::: tip', 'Text.', '```js', 'hot.render();', ':::', '', 'After the aside.'].join('\n'));
  const lines = html.split('\n');
  const open = lines.indexOf('```js');

  assert.deepEqual(lines.slice(open, open + 3), ['```js', 'hot.render();', '```'], 'the fence gets its closing line');
  assert.ok(html.indexOf('</aside>') > html.lastIndexOf('```'), 'the aside closes after the fence');
  assert.ok(html.includes('After the aside.'), 'text after the aside is kept outside the fence');
});

test('a tilde fence is not closed by a backtick line, and an inline backtick run is not a fence', async () => {
  const tilde = await loadPageWithBody(['::: tip', '~~~md', '```', 'x', '```', '~~~', ':::'].join('\n'));
  const tildeLines = tilde.split('\n');
  const open = tildeLines.indexOf('~~~md');

  assert.deepEqual(tildeLines.slice(open + 1, tildeLines.indexOf('~~~', open + 1)), ['```', 'x', '```']);

  const inline = await loadPageWithBody('::: tip\n```code``` stays a paragraph.\n:::');

  assert.ok(
    inline.includes('<div class="starlight-aside__content"><p>'),
    'an info string with a backtick is not a fence, so the aside keeps the single-paragraph path'
  );
});

test('a fence-free aside with a blank line keeps its single <p>', async () => {
  const html = await loadPageWithBody('::: tip\nFirst.\n\nSecond.\n:::');

  assert.ok(html.includes('<div class="starlight-aside__content"><p>First.\n\nSecond.</p></div>'));
});

test('the real markdown renderer highlights an aside fence and keeps the aside markup out of it', async () => {
  const { createMarkdownProcessor } = await import('@astrojs/markdown-remark');
  const markdown = await loadPageWithBody([
    '::: warning',
    '',
    'Before the code:',
    '',
    '```js',
    'hot.render();',
    '```',
    '',
    ':::',
    '',
    'After the aside.',
  ].join('\n'));
  const { code } = await (await createMarkdownProcessor({})).render(markdown);
  const aside = code.match(/<aside[\s\S]*<\/aside>/)[0];

  assert.match(aside, /<p>Before the code:<\/p>\s*<pre[^>]*data-language="js"/, 'paragraph, then a highlighted block');
  assert.ok(!aside.includes('```'), 'no literal fence markers in the aside');
  assert.ok(!/<pre[\s\S]*<\/aside>[\s\S]*<\/pre>/.test(code), 'the aside markup is not inside the code block');
  assert.match(code, /<\/aside>\s*<p>After the aside\.<\/p>/, 'the page continues after the aside');
});

/**
 * Renders an aside page through the real markdown processor.
 *
 * @param {string} body
 * @returns {Promise<string>}
 */
async function renderAsidePage(body) {
  const { createMarkdownProcessor } = await import('@astrojs/markdown-remark');
  const { code } = await (await createMarkdownProcessor({})).render(await loadPageWithBody(body));

  return code;
}

test('a fence closed by a line indented up to three spaces keeps the aside and the page intact', async () => {
  const code = await renderAsidePage(['::: tip', 'Text.', '```js', 'a();', '  ```', ':::', '', 'After the aside.'].join('\n'));

  assert.match(code, /<\/pre>\s*<\/div>\s*<\/aside>\s*<p>After the aside\.<\/p>/, 'the aside closes after the code block');
  assert.equal(code.match(/<pre/g).length, 1, 'one code block, no second fence');
});

test('a fence opened by a line indented up to three spaces keeps the aside and the page intact', async () => {
  const code = await renderAsidePage(['::: tip', 'Text.', '  ```js', 'a();', '```', 'Tail.', ':::', '', 'After the aside.'].join('\n'));

  assert.match(code, /<pre[^>]*data-language="js"/, 'the indented opener is a highlighted block');
  assert.match(code, /<p>Tail\.<\/p>\s*<\/div>\s*<\/aside>\s*<p>After the aside\.<\/p>/, 'text after the fence stays prose');
  assert.equal(code.match(/<pre/g).length, 1, 'the closer does not open a second fence');
});
