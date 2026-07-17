import assert from 'node:assert/strict';
import test from 'node:test';
import { extractRunnerLinks, crossCheckManifest, planHeadlessChecks, parseArgs } from '../test-runner-links.mjs';

test('extractRunnerLinks finds a plain-& href with a version', () => {
  const html = '<a href="https://demos.handsontable.com/?docs=guides/foo/example1.js&v=18.0.0">Open</a>';
  const links = extractRunnerLinks(html);

  assert.equal(links.length, 1);
  assert.deepEqual(links[0], { docsPath: 'guides/foo/example1.js', version: '18.0.0', url: 'https://demos.handsontable.com/?docs=guides/foo/example1.js&v=18.0.0' });
});

test('extractRunnerLinks finds an HTML-escaped &amp;v= href', () => {
  const html = '<a href="https://demos.handsontable.com/?docs=guides/foo/example1.js&amp;v=18.0.0">Open</a>';
  const links = extractRunnerLinks(html);

  assert.equal(links.length, 1);
  assert.equal(links[0].docsPath, 'guides/foo/example1.js');
  assert.equal(links[0].version, '18.0.0');
});

test('extractRunnerLinks finds a numeric-entity &#x26;v= href (Astro/Starlight serializer output)', () => {
  const html = '<a href="https://demos.handsontable.com/?docs=guides/foo/example1.js&#x26;v=18.0.0">Open</a>';
  const links = extractRunnerLinks(html);

  assert.equal(links.length, 1);
  assert.equal(links[0].docsPath, 'guides/foo/example1.js');
  assert.equal(links[0].version, '18.0.0');
});

test('extractRunnerLinks handles a href with no version', () => {
  const html = '<a href="https://demos.handsontable.com/?docs=guides/foo/example1.js">Open</a>';
  const links = extractRunnerLinks(html);

  assert.equal(links.length, 1);
  assert.equal(links[0].version, null);
  assert.equal(links[0].url, 'https://demos.handsontable.com/?docs=guides/foo/example1.js');
});

test('extractRunnerLinks finds multiple distinct links in one document', () => {
  const html = [
    '<a href="https://demos.handsontable.com/?docs=guides/a/example1.js&amp;v=18.0.0">A</a>',
    '<a href="https://demos.handsontable.com/?docs=guides/b/example1.tsx&amp;v=18.0.0">B</a>',
  ].join('\n');

  assert.equal(extractRunnerLinks(html).length, 2);
});

test('crossCheckManifest flags docs paths absent from the manifest', () => {
  const links = new Map([
    ['guides/known/example1.js', { url: 'https://demos.handsontable.com/?docs=guides/known/example1.js', pages: ['a.html'] }],
    ['guides/unknown/example1.js', { url: 'https://demos.handsontable.com/?docs=guides/unknown/example1.js', pages: ['b.html'] }],
  ]);
  const manifestByDocsPath = new Map([
    ['guides/known/example1.js', { docsPath: 'guides/known/example1.js', framework: 'javascript' }],
    ['guides/known/example1.ts', { docsPath: 'guides/known/example1.ts', framework: 'typescript' }],
  ]);

  const { missing, reverseDiffCount } = crossCheckManifest(links, manifestByDocsPath);

  assert.equal(missing.length, 1);
  assert.equal(missing[0].docsPath, 'guides/unknown/example1.js');
  // guides/known/example1.ts is manifest-only (never linked) — informational, not a failure.
  assert.equal(reverseDiffCount, 1);
});

test('crossCheckManifest reports no missing links when every docs path is covered', () => {
  const links = new Map([
    ['guides/known/example1.js', { url: 'https://demos.handsontable.com/?docs=guides/known/example1.js', pages: ['a.html'] }],
  ]);
  const manifestByDocsPath = new Map([
    ['guides/known/example1.js', { docsPath: 'guides/known/example1.js', framework: 'javascript' }],
  ]);

  const { missing } = crossCheckManifest(links, manifestByDocsPath);

  assert.equal(missing.length, 0);
});

test('planHeadlessChecks checks all Tier-1 links and samples Tier-2 per framework', () => {
  const manifestByDocsPath = new Map();
  const matched = [];

  for (let i = 0; i < 3; i++) {
    const docsPath = `guides/g/react/example${i}.tsx`;

    matched.push({ docsPath, url: docsPath, pages: [] });
    manifestByDocsPath.set(docsPath, { docsPath, framework: 'react' });
  }

  for (let i = 0; i < 5; i++) {
    const docsPath = `guides/g/vue/example${i}.vue`;

    matched.push({ docsPath, url: docsPath, pages: [] });
    manifestByDocsPath.set(docsPath, { docsPath, framework: 'vue' });
  }

  const { toCheck, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 2);

  const checkedReact = toCheck.filter(item => item.manifestEntry.framework === 'react');
  const checkedVue = toCheck.filter(item => item.manifestEntry.framework === 'vue');

  assert.equal(checkedReact.length, 3, 'all Tier-1 links are checked');
  assert.equal(checkedVue.length, 2, 'Tier-2 is sampled down to the requested count');
  assert.equal(droppedTier2, 3, 'the remaining Tier-2 links are reported as dropped, not silently discarded');
});

test('planHeadlessChecks checks every Tier-2 link when sample is "all"', () => {
  const manifestByDocsPath = new Map([
    ['guides/g/angular/example1.ts', { docsPath: 'guides/g/angular/example1.ts', framework: 'angular' }],
    ['guides/g/angular/example2.ts', { docsPath: 'guides/g/angular/example2.ts', framework: 'angular' }],
  ]);
  const matched = [...manifestByDocsPath.keys()].map(docsPath => ({ docsPath, url: docsPath, pages: [] }));

  const { toCheck, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 'all');

  assert.equal(toCheck.length, 2);
  assert.equal(droppedTier2, 0);
});

test('parseArgs applies defaults and derives the manifest URL from runner-origin', () => {
  const args = parseArgs([]);

  assert.equal(args.dist, './dist');
  assert.equal(args.runnerOrigin, 'https://demos.handsontable.com');
  assert.equal(args.manifest, 'https://demos.handsontable.com/docs-examples/manifest.json');
  assert.equal(args.staticOnly, false);
  assert.equal(args.tier2Sample, 10);
  assert.equal(args.concurrency, 4);
});

test('parseArgs reads flags, including a custom manifest override and tier2Sample=all', () => {
  const args = parseArgs([
    '--dist', './build',
    '--runner-origin', 'https://runner.example.com',
    '--manifest', './local-manifest.json',
    '--static-only',
    '--tier2-sample', 'all',
    '--concurrency', '8',
    '--filter', 'column-adding',
    '--json', './out/report.json',
  ]);

  assert.equal(args.dist, './build');
  assert.equal(args.runnerOrigin, 'https://runner.example.com');
  assert.equal(args.manifest, './local-manifest.json');
  assert.equal(args.staticOnly, true);
  assert.equal(args.tier2Sample, 'all');
  assert.equal(args.concurrency, 8);
  assert.equal(args.filter, 'column-adding');
  assert.equal(args.json, './out/report.json');
});
