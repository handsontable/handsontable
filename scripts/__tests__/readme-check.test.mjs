import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  extractLinks, isInternal, extractFeatures, featureDrift, findStaleVersions,
  findWrongDocsPrefix, findUnprefixedDocsLinks, isAbsolute, absolute, DOCS_PREFIX, READMES,
} from '../readme-check.mjs';

test('extractLinks finds markdown links, HTML attributes and srcset URLs', () => {
  const md = [
    '[Docs](https://handsontable.com/docs)',
    '<a href="https://forum.handsontable.com/">Community</a>',
    '<source srcset="https://example.com/logo.svg 2x"/>',
    '<img src="./resources/preview.png"/>',
  ].join('\n');

  assert.deepEqual(extractLinks(md), [
    { url: 'https://handsontable.com/docs', line: 1 },
    { url: 'https://forum.handsontable.com/', line: 2 },
    { url: 'https://example.com/logo.svg', line: 3 },
    { url: './resources/preview.png', line: 4 },
  ]);
});

test('extractLinks keeps a badge\'s destination, not just its image', () => {
  // Every badge in these READMEs is `[![alt](image)](destination)`. A label matcher that stops at
  // the first `]` captures the image and drops the destination, which left the live demo link and
  // every badge target unresolved.
  const md = '[![Static Badge](https://img.shields.io/badge/x)](https://demos.handsontable.com/?example=javascript)';

  assert.deepEqual(extractLinks(md), [
    { url: 'https://img.shields.io/badge/x', line: 1 },
    { url: 'https://demos.handsontable.com/?example=javascript', line: 1 },
  ]);
});

test('extractLinks reports a standalone image once, not twice', () => {
  assert.deepEqual(extractLinks('![preview](./resources/preview.png)'), [
    { url: './resources/preview.png', line: 1 },
  ]);
});

test('extractLinks still handles a plain link next to a badge on one line', () => {
  const md = '[![b](https://img.example/b.svg)](https://dest.example) and [Docs](https://handsontable.com/docs)';

  assert.deepEqual(extractLinks(md).map(l => l.url), [
    'https://img.example/b.svg',
    'https://dest.example',
    'https://handsontable.com/docs',
  ]);
});

test('extractLinks ignores anchors and mailto, which have nothing to resolve', () => {
  assert.deepEqual(extractLinks('[top](#installation) [mail](mailto:support@handsontable.com)'), []);
});

test('isInternal separates hosts we publish from third parties', () => {
  assert.equal(isInternal('https://handsontable.com/docs/'), true);
  assert.equal(isInternal('https://forum.handsontable.com/'), true);
  assert.equal(isInternal('https://github.com/handsontable/handsontable/issues'), true);
  assert.equal(isInternal('./CONTRIBUTING.md'), true, 'a repo-relative path is ours by definition');
  assert.equal(isInternal('https://www.npmjs.com/package/handsontable'), false);
  assert.equal(isInternal('https://cdn.jsdelivr.net/npm/handsontable'), false);
  assert.equal(isInternal('not a url at all'), true, 'unparseable, treated as a repo path');
});

test('isInternal is not fooled by a lookalike host', () => {
  assert.equal(isInternal('https://handsontable.com.evil.test/docs'), false);
  assert.equal(isInternal('https://nothandsontable.com/docs'), false);
});

test('extractFeatures reads the Key Features bullets in document order', () => {
  const md = [
    '&nbsp;&nbsp;✅&nbsp; [Built-in themes](https://handsontable.com/docs/themes/) <br>',
    '&nbsp;&nbsp;✅&nbsp; [Row pagination](https://handsontable.com/docs/rows-pagination/) <br>',
    'Some prose mentioning [a link](https://example.com) that is not a feature.',
  ].join('\n');

  assert.deepEqual(extractFeatures(md), ['Built-in themes', 'Row pagination']);
});

test('featureDrift reports root features a wrapper dropped', () => {
  const drift = featureDrift([
    { label: 'root', features: ['Themes', 'Notifications', 'Export to Excel'] },
    { label: 'react', features: ['Themes'] },
  ]);

  assert.deepEqual(drift, [{ label: 'react', missing: ['Notifications', 'Export to Excel'] }]);
});

test('featureDrift accepts a wrapper wording an existing feature differently', () => {
  assert.deepEqual(
    featureDrift([
      { label: 'root', features: ['Frozen rows and columns', 'Hiding rows and columns'] },
      { label: 'react', features: ['Pinned/frozen columns', 'Hiding columns'] },
    ]),
    [],
  );
});

test('featureDrift ignores extra features a wrapper adds of its own', () => {
  assert.deepEqual(
    featureDrift([
      { label: 'root', features: ['Themes'] },
      { label: 'react', features: ['Themes', 'React hooks'] },
    ]),
    [],
  );
});

test('featureDrift refuses to run without the root README to compare against', () => {
  assert.throws(() => featureDrift([{ label: 'react', features: [] }]), /needs the root README/);
});

test('findStaleVersions catches npm specifiers, package.json pins and CDN paths', () => {
  const md = [
    '```bash',
    'npm install handsontable@17.0.1',
    '```',
    '```json',
    '"@handsontable/react-wrapper": "^17.0.1"',
    '```',
    '<script src="https://cdn.jsdelivr.net/npm/handsontable@17.0.1/dist/handsontable.full.min.js"></script>',
  ].join('\n');

  assert.deepEqual(findStaleVersions(md, '18.1.0').map(v => v.found), ['17.0.1', '17.0.1', '17.0.1']);
});

test('findStaleVersions passes the current version and unpinned references', () => {
  const md = 'npm install handsontable@18.1.0\nhttps://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js';

  assert.deepEqual(findStaleVersions(md, '18.1.0'), []);
});

test('findWrongDocsPrefix flags a framework prefix that is not the README\'s own', () => {
  const links = extractLinks('[Install](https://handsontable.com/docs/javascript-data-grid/vue3-installation/)');

  assert.deepEqual(findWrongDocsPrefix(links, 'vue').map(l => l.line), [1]);
  assert.deepEqual(findWrongDocsPrefix(links, 'javascript'), []);
});

test('findWrongDocsPrefix leaves shared and unprefixed pages alone', () => {
  const links = extractLinks([
    '[API](https://handsontable.com/docs/api/)',
    '[Themes](https://handsontable.com/docs/themes/)',
    '[Blog](https://handsontable.com/blog)',
  ].join('\n'));

  assert.deepEqual(findWrongDocsPrefix(links, 'react'), []);
});

test('the vue prefix is vue-data-grid — vue3-data-grid 404s and has shipped before', () => {
  assert.equal(DOCS_PREFIX.vue, 'vue-data-grid');
});

test('every README in the list declares a flavour that has a docs prefix', () => {
  for (const { file, flavour } of READMES) {
    assert.ok(DOCS_PREFIX[flavour], `${file} has an unknown flavour '${flavour}'`);
  }
});

test('the list covers the four READMEs that exist, and every one of them is on disk', () => {
  // npm renders the repository root README for the `handsontable` package since DEV-2794 (#13428)
  // deleted handsontable/README.md. A stale entry here used to crash the run with a bare ENOENT.
  assert.deepEqual(READMES.map(r => r.file), [
    'README.md',
    'wrappers/react-wrapper/README.md',
    'wrappers/angular-wrapper/README.md',
    'wrappers/vue3/README.md',
  ]);

  for (const { file } of READMES) {
    assert.ok(existsSync(new URL(`../../${file}`, import.meta.url)), `${file} is listed but missing`);
  }
});

test('findUnprefixedDocsLinks spots a wrapper link that drops the framework prefix', () => {
  const links = extractLinks('[Licence](https://handsontable.com/docs/license-key/)');

  assert.deepEqual(findUnprefixedDocsLinks(links, 'react').map(l => l.url),
    ['https://handsontable.com/docs/license-key/']);
});

test('findUnprefixedDocsLinks leaves the root README alone — unprefixed is correct there', () => {
  const links = extractLinks('[Licence](https://handsontable.com/docs/license-key/)');

  assert.deepEqual(findUnprefixedDocsLinks(links, 'javascript'), []);
});

test('findUnprefixedDocsLinks does not re-report an already prefixed link', () => {
  const links = extractLinks('[Licence](https://handsontable.com/docs/react-data-grid/license-key/)');

  assert.deepEqual(findUnprefixedDocsLinks(links, 'react'), []);
});

test('extractLinks keeps a link whose label contains plain brackets', () => {
  // Same failure class as the badge case: a label matcher that stops at the first `]` drops
  // `[Foo [bar]](url)` entirely. No README uses this today; the regex should not care.
  assert.deepEqual(extractLinks('[Foo [bar]](https://handsontable.com/docs/)').map(l => l.url),
    ['https://handsontable.com/docs/']);
});

test('isAbsolute treats a protocol-relative URL as a network address, not a repo path', () => {
  assert.equal(isAbsolute('//cdn.jsdelivr.net/npm/handsontable'), true);
  assert.equal(isAbsolute('https://handsontable.com'), true);
  assert.equal(isAbsolute('./CONTRIBUTING.md'), false);
  assert.equal(isAbsolute('resources/logo.svg'), false);
});

test('a protocol-relative URL is classified and fetched as https, not reported as a missing file', () => {
  // Without this it falls into the repo-relative branch and fails as "does not exist in the repo".
  assert.equal(absolute('//handsontable.com/docs/'), 'https://handsontable.com/docs/');
  assert.equal(absolute('https://handsontable.com/docs/'), 'https://handsontable.com/docs/');
  assert.equal(isInternal('//handsontable.com/docs/'), true);
  assert.equal(isInternal('//www.npmjs.com/package/handsontable'), false);
});

test('findUnprefixedDocsLinks flags a bare /docs homepage link in a wrapper', () => {
  // The wrappers' Documentation header link is prefixed; copying the root README's bare `/docs`
  // over it would send a React reader to the JavaScript docs home, and used to go uncaught.
  const inReact = href => findUnprefixedDocsLinks(extractLinks(`<a href="${href}">D</a>`), 'react');

  assert.deepEqual(inReact('https://handsontable.com/docs').map(l => l.url),
    ['https://handsontable.com/docs']);
  assert.deepEqual(inReact('https://handsontable.com/docs/').map(l => l.url),
    ['https://handsontable.com/docs/']);
  assert.deepEqual(inReact('https://handsontable.com/docs/react-data-grid'), []);
});

test('extractLinks does not backtrack exponentially on a pathological label (CodeQL 102)', () => {
  // The label alternatives must stay mutually exclusive. When `!` could match both as a plain
  // character and as the start of an image, this input took 7s at 28 pairs and doubled every pair.
  const evil = `[${'![]()'.repeat(2000)}X`;
  const started = Date.now();

  extractLinks(evil);
  const elapsed = Date.now() - started;

  assert.ok(elapsed < 1000, `extractLinks took ${elapsed}ms on a 2000-pair label — ambiguity is back`);
});

test('extractLinks still reads a label ending in an exclamation mark', () => {
  // The `!(?!\[)` branch exists for this: a trailing `!` has no following character to inspect.
  assert.deepEqual(extractLinks('[Wow!](https://handsontable.com/docs/)').map(l => l.url),
    ['https://handsontable.com/docs/']);
});
