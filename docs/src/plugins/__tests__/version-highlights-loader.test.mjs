import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEntriesWithHighlights, buildReleaseSummaries, loadVersionHighlights } from '../version-highlights-loader.mjs';

test('matching prNumber augments the auto entry and flags it as highlighted', () => {
  const auto = [
    { version: '17.0.0', releaseDate: '2026-03-09', category: 'added',
      breaking: true, framework: 'core', prNumber: 11950, title: 'Theme API.' },
    { version: '17.0.0', releaseDate: '2026-03-09', category: 'fixed',
      breaking: false, framework: 'core', prNumber: 11955, title: 'A fix.' },
  ];
  const highlightFiles = [
    {
      filename: '17.0.json',
      data: {
        version: '17.0',
        highlighted: [
          {
            prNumber: 11950,
            tagline: 'New Theme API',
            whyItMatters: 'Replaces legacy stylesheet.',
            codeBefore: 'import "...full.css";',
            codeAfter: 'import { classicTheme } from "...";',
          },
        ],
      },
    },
  ];

  const result = mergeEntriesWithHighlights(auto, highlightFiles);

  const themeEntry = result.find((e) => e.prNumber === 11950);
  assert.equal(themeEntry.highlighted, true);
  assert.equal(themeEntry.tagline, 'New Theme API');
  assert.equal(themeEntry.codeBefore, 'import "...full.css";');

  const fixEntry = result.find((e) => e.prNumber === 11955);
  assert.equal(fixEntry.highlighted, false);
  assert.equal(fixEntry.tagline, undefined);
});

test('mergeEntriesWithHighlights with no highlight files marks every entry as not highlighted', () => {
  const auto = [
    { version: '17.0.0', releaseDate: '2026-03-09', prNumber: 11950, title: 't' },
    { version: '17.0.0', releaseDate: '2026-03-09', prNumber: null, title: 't2' },
  ];
  const result = mergeEntriesWithHighlights(auto, []);
  assert.equal(result.length, 2);
  for (const e of result) assert.equal(e.highlighted, false);
});

test('mergeEntriesWithHighlights leaves entries with null prNumber as not highlighted', () => {
  const auto = [
    { version: '17.0.0', prNumber: null, title: 't' },
    { version: '17.0.0', prNumber: 11950, title: 'u' },
  ];
  const highlightFiles = [
    {
      filename: '17.0.json',
      data: { version: '17.0', highlighted: [{ prNumber: 11950, tagline: 'x', whyItMatters: 'y' }] },
    },
  ];
  const result = mergeEntriesWithHighlights(auto, highlightFiles);
  assert.equal(result[0].highlighted, false);
  assert.equal(result[1].highlighted, true);
});

test('mergeEntriesWithHighlights throws when the same PR appears in two highlight files', () => {
  const highlightFiles = [
    { filename: '17.0.json', data: { version: '17.0', highlighted: [{ prNumber: 11950, tagline: 'a', whyItMatters: 'b' }] } },
    { filename: '16.2.json', data: { version: '16.2', highlighted: [{ prNumber: 11950, tagline: 'c', whyItMatters: 'd' }] } },
  ];
  assert.throws(
    () => mergeEntriesWithHighlights([], highlightFiles),
    /Duplicate highlight for PR #11950 in 17\.0\.json and 16\.2\.json/,
  );
});

test('buildReleaseSummaries with null currentVersion leaves every release isCurrent: false', () => {
  const releases = buildReleaseSummaries(
    [{ version: '17.0.0', releaseDate: '2026-03-09' }],
    null,
  );
  assert.equal(releases.length, 1);
  assert.equal(releases[0].isCurrent, false);
});

test('buildReleaseSummaries returns only X.Y.0 releases, sorted descending', () => {
  const auto = [
    { version: '17.0.1', releaseDate: '2026-03-25' },
    { version: '17.0.0', releaseDate: '2026-03-09' },
    { version: '16.2.1', releaseDate: '2026-01-15' },
    { version: '16.2.0', releaseDate: '2026-01-01' },
    { version: '16.0.0', releaseDate: '2025-08-01' },
  ];

  const releases = buildReleaseSummaries(auto, '17.0.1');

  assert.deepEqual(
    releases.map((r) => r.version),
    ['17.0', '16.2', '16.0'],
  );
  assert.equal(releases[0].isCurrent, true);
  assert.equal(releases[1].isCurrent, false);
  assert.equal(releases[0].releaseDate, '2026-03-09');
});

test('loadVersionHighlights returns entries + releases for current data', () => {
  const result = loadVersionHighlights();

  assert.ok(Array.isArray(result.entries));
  assert.ok(Array.isArray(result.releases));
  assert.ok(result.entries.length > 100, 'should aggregate many entries');
  assert.ok(result.releases.some((r) => r.version === '17.0'));
  for (const r of result.releases) {
    assert.match(r.version, /^\d+\.\d+$/);
  }
});
