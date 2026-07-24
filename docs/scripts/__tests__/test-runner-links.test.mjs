import assert from 'node:assert/strict';
import test from 'node:test';
import { extractRunnerLinks, crossCheckManifest, planHeadlessChecks, parseArgs, deriveManifestBucket, resolveManifestSource, formatTimestamp, isIgnoredConsoleMessage, matchesExpectedContent, matchesSetupFailure, interactiveMarkerFor } from '../test-runner-links.mjs';

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

/**
 * Builds a matched-links array + manifest for `counts` per framework, e.g.
 * { react: 3, vue: 5 }. The docs file extension follows the framework so paths
 * stay realistic, though only `framework` matters to planHeadlessChecks.
 */
function buildMatched(counts) {
  const ext = { javascript: 'js', typescript: 'ts', react: 'tsx', vue: 'vue', angular: 'ts' };
  const manifestByDocsPath = new Map();
  const matched = [];

  for (const [framework, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      const docsPath = `guides/g/${framework}/example${i}.${ext[framework]}`;

      matched.push({ docsPath, url: docsPath, pages: [] });
      manifestByDocsPath.set(docsPath, { docsPath, framework });
    }
  }

  return { matched, manifestByDocsPath };
}

test('planHeadlessChecks checks all Tier-1 links (sample "all") and samples Tier-2 per framework', () => {
  const { matched, manifestByDocsPath } = buildMatched({ react: 3, vue: 5 });

  const { toCheck, droppedTier1, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 'all', 2);

  const checkedReact = toCheck.filter(item => item.manifestEntry.framework === 'react');
  const checkedVue = toCheck.filter(item => item.manifestEntry.framework === 'vue');

  assert.equal(checkedReact.length, 3, 'all Tier-1 links are checked when tier1Sample is "all"');
  assert.equal(checkedVue.length, 2, 'Tier-2 is sampled down to the requested count');
  assert.equal(droppedTier1, 0);
  assert.equal(droppedTier2, 3, 'the remaining Tier-2 links are reported as dropped, not silently discarded');
});

test('planHeadlessChecks samples Tier-1 per framework and reports droppedTier1', () => {
  const { matched, manifestByDocsPath } = buildMatched({ javascript: 4, react: 4, vue: 3 });

  const { toCheck, droppedTier1, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 2, 'all');

  const checkedJs = toCheck.filter(item => item.manifestEntry.framework === 'javascript');
  const checkedReact = toCheck.filter(item => item.manifestEntry.framework === 'react');
  const checkedVue = toCheck.filter(item => item.manifestEntry.framework === 'vue');

  assert.equal(checkedJs.length, 2, 'Tier-1 js is sampled to the requested count per framework');
  assert.equal(checkedReact.length, 2, 'Tier-1 react is sampled to the requested count per framework');
  assert.equal(checkedVue.length, 3, 'Tier-2 is untouched by tier1Sample');
  assert.equal(droppedTier1, 4, 'droppedTier1 sums the per-framework Tier-1 drops (2 js + 2 react)');
  assert.equal(droppedTier2, 0);
});

test('planHeadlessChecks with sample 0 skips a whole tier', () => {
  const { matched, manifestByDocsPath } = buildMatched({ react: 3, vue: 4 });

  const { toCheck, droppedTier1, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 0, 'all');

  assert.equal(toCheck.every(item => item.manifestEntry.framework === 'vue'), true, 'Tier-1 is skipped entirely');
  assert.equal(toCheck.length, 4);
  assert.equal(droppedTier1, 3, 'all Tier-1 links are reported dropped');
  assert.equal(droppedTier2, 0);
});

test('planHeadlessChecks checks every Tier-2 link when sample is "all"', () => {
  const { matched, manifestByDocsPath } = buildMatched({ angular: 2 });

  const { toCheck, droppedTier2 } = planHeadlessChecks(matched, manifestByDocsPath, 'all', 'all');

  assert.equal(toCheck.length, 2);
  assert.equal(droppedTier2, 0);
});

test('parseArgs applies defaults, leaving version null (auto-detected later) and no manifest override', () => {
  const args = parseArgs([]);

  assert.equal(args.dist, './dist');
  assert.equal(args.runnerOrigin, 'https://demos.handsontable.com');
  assert.equal(args.version, null);
  assert.equal(args.manifest, undefined, 'the --manifest override no longer exists');
  assert.equal(args.staticOnly, false);
  assert.equal(args.tier1Sample, 'all');
  assert.equal(args.tier2Sample, 10);
  assert.equal(args.tier1Concurrency, 4);
  assert.equal(args.tier2Concurrency, 1);
  assert.equal(args.tier1Retries, 0);
  assert.equal(args.tier2Retries, 1);
  assert.match(args.json, /^\.\/tests\/test-artifacts\/runner-links\/runner-sweep-report-\d{8}-\d{6}\.json$/);
});

test('formatTimestamp renders YYYYMMDD-HHmmss', () => {
  const date = new Date(2026, 6, 20, 9, 5, 3); // 2026-07-20 09:05:03 local time

  assert.equal(formatTimestamp(date), '20260720-090503');
});

test('parseArgs records an explicit --version override', () => {
  const args = parseArgs(['--version', '18.0.0']);

  assert.equal(args.version, '18.0.0');
});

test('parseArgs reads every flag, including tier1/tier2 samples, concurrency, and retries', () => {
  const args = parseArgs([
    '--dist', './build',
    '--runner-origin', 'https://runner.example.com',
    '--version', '18.0.0',
    '--static-only',
    '--tier1-sample', '5',
    '--tier2-sample', 'all',
    '--tier1-concurrency', '8',
    '--tier2-concurrency', '3',
    '--tier1-retries', '2',
    '--tier2-retries', '3',
    '--filter', 'column-adding',
    '--json', './out/report.json',
  ]);

  assert.equal(args.dist, './build');
  assert.equal(args.runnerOrigin, 'https://runner.example.com');
  assert.equal(args.version, '18.0.0');
  assert.equal(args.staticOnly, true);
  assert.equal(args.tier1Sample, 5);
  assert.equal(args.tier2Sample, 'all');
  assert.equal(args.tier1Concurrency, 8);
  assert.equal(args.tier2Concurrency, 3);
  assert.equal(args.tier1Retries, 2);
  assert.equal(args.tier2Retries, 3);
  assert.equal(args.filter, 'column-adding');
  assert.equal(args.json, './out/report.json');
});

test('deriveManifestBucket resolves "next" as-is and drops the patch segment from release versions', () => {
  assert.equal(deriveManifestBucket('next'), 'next');
  assert.equal(deriveManifestBucket('18.0.0'), '18.0');
  assert.equal(deriveManifestBucket('18.0'), '18.0');
});

test('deriveManifestBucket maps the staging/dev pre-release stamp to the "next" bucket', () => {
  assert.equal(deriveManifestBucket('0.0.0-next-64139ae-20260219'), 'next');
});

test('resolveManifestSource auto-detects the version stamped into the links', () => {
  const links = new Map([
    ['guides/a/example1.js', { version: '18.0.0' }],
    ['guides/b/example1.tsx', { version: '18.0.0' }],
  ]);

  const resolved = resolveManifestSource({ explicitVersion: null, runnerOrigin: 'https://demos.handsontable.com', links });

  assert.equal(resolved.version, '18.0.0');
  assert.equal(resolved.bucket, '18.0');
  assert.equal(resolved.source, 'auto-detected from links');
  assert.equal(resolved.url, 'https://demos.handsontable.com/docs-examples/18.0/manifest.json');
});

test('resolveManifestSource lets an explicit --version override the links', () => {
  const links = new Map([['guides/a/example1.js', { version: '18.0.0' }]]);

  const resolved = resolveManifestSource({ explicitVersion: '17.0.5', runnerOrigin: 'https://demos.handsontable.com', links });

  assert.equal(resolved.version, '17.0.5');
  assert.equal(resolved.bucket, '17.0');
  assert.equal(resolved.source, 'from --version override');
  assert.equal(resolved.url, 'https://demos.handsontable.com/docs-examples/17.0/manifest.json');
});

test('resolveManifestSource falls back to the "next" bucket when no link carries a version', () => {
  const links = new Map([['guides/a/example1.js', { version: null }]]);

  const resolved = resolveManifestSource({ explicitVersion: null, runnerOrigin: 'https://demos.handsontable.com', links });

  assert.equal(resolved.version, 'next');
  assert.equal(resolved.bucket, 'next');
  assert.equal(resolved.source, 'default "next" (links carry no version)');
  assert.equal(resolved.url, 'https://demos.handsontable.com/docs-examples/next/manifest.json');
});

test('resolveManifestSource maps the dev pre-release link stamp to the "next" bucket', () => {
  const links = new Map([['guides/a/example1.js', { version: '0.0.0-next-64139ae-20260219' }]]);

  const resolved = resolveManifestSource({ explicitVersion: null, runnerOrigin: 'https://demos.handsontable.com', links });

  assert.equal(resolved.bucket, 'next');
  assert.equal(resolved.source, 'auto-detected from links');
});

test('isIgnoredConsoleMessage filters benign infra noise on the first line', () => {
  assert.equal(isIgnoredConsoleMessage('Failed to load resource: net::ERR_CONNECTION_TIMED_OUT @ https://col.csbops.io/data/sandpack'), true);
  assert.equal(isIgnoredConsoleMessage('[vite] failed to connect to websocket.'), true);
  assert.equal(isIgnoredConsoleMessage("WebSocket connection to 'wss://localhost:5173/' failed"), true);
});

test('isIgnoredConsoleMessage does NOT swallow a real error whose stack points at codesandbox.io', () => {
  // A genuine SyntaxError/TypeError carries a multi-line stack with codesandbox.io frames;
  // matching the whole string would hide the exact failures this sweep must catch.
  const syntaxError = [
    'SyntaxError: /index.js: Unexpected token (70:17)',
    '    at J.raise (https://2-19-8-sandpack.codesandbox.io/static/js/babel.6.26.min.js:7:5751)',
  ].join('\n');
  const typeError = [
    "TypeError: Cannot read properties of undefined (reading 'show')",
    '    at eval (https://2-19-8-sandpack.codesandbox.io/src/App.tsx:145:36)',
  ].join('\n');

  assert.equal(isIgnoredConsoleMessage(syntaxError), false);
  assert.equal(isIgnoredConsoleMessage(typeError), false);
});

test('matchesExpectedContent compares titles case-insensitively', () => {
  const entry = { guideTitle: 'Cell functions', exampleTitle: 'Standard example' };

  // Runner header title-cases the guide segment; the manifest stores sentence case.
  assert.equal(matchesExpectedContent('Cell Functions · Standard example', entry), true);
  assert.equal(matchesExpectedContent('Row hiding · Standard example', entry), false);
});

test('matchesSetupFailure detects the runner build-failure banner', () => {
  assert.equal(matchesSetupFailure('Error: Setup failed'), true);
  assert.equal(matchesSetupFailure('Cell Functions · Standard example'), false);
});

test('interactiveMarkerFor returns a marker for interactive examples and null otherwise', () => {
  const marker = interactiveMarkerFor('recipes/import-export/import-csv-excel/javascript/example1.js');

  assert.ok(marker instanceof RegExp);
  assert.equal(marker.test('Load sample data'), true);
  // Same interactive example, React variant.
  assert.ok(interactiveMarkerFor('recipes/import-export/import-csv-excel/react/example1.tsx') instanceof RegExp);
  // A normal grid-rendering example has no marker.
  assert.equal(interactiveMarkerFor('guides/rows/row-hiding/javascript/example1.js'), null);
});
