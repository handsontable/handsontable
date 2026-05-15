import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEntriesWithHighlights, buildReleaseSummaries } from '../version-highlights-loader.mjs';

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
