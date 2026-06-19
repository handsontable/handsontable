import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { frameworkLoader } from '../framework-loader.mjs';

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
    assert.match(store.get('javascript-data-grid/intro').rendered.html, /EXAMPLE_CODE_V1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('editing a markdown file hot reloads its entries', async () => {
  const { contentDir, root, introMd } = createFixture();

  try {
    const { ctx, store, watcher } = createContext();

    await frameworkLoader({ contentDir }).load(ctx);

    const before = store.get('javascript-data-grid/intro').rendered.html;

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

    const after = store.get('javascript-data-grid/intro').rendered.html;

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

    assert.match(store.get('react-data-grid/intro').rendered.html, /EXAMPLE_CODE_V1/);

    // Rewrite the example and force a distinct mtime so the digest changes even
    // on filesystems with coarse mtime granularity.
    writeFileSync(exampleJs, "const grid = 'EXAMPLE_CODE_V2';\n");
    const future = new Date(Date.now() + 10_000);

    utimesSync(exampleJs, future, future);

    watcher.emit('change', exampleJs);
    await sleep(250);

    assert.match(store.get('react-data-grid/intro').rendered.html, /EXAMPLE_CODE_V2/);
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
 * @returns {{ contentDir: string, root: string }}
 */
function createReactFixture() {
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
      '@[code](@/content/guides/intro/react/example1.jsx)',
      '@[code](@/content/guides/intro/react/example1.tsx)',
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

    const html = store.get('react-data-grid/intro').rendered.html;

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
