import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEntriesWithHighlights } from '../version-highlights-loader.mjs';

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
