import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChangelogContent } from '../changelog-parser.mjs';

test('extracts version and ISO release date from a single release block', () => {
  const md = [
    '## 17.0.0',
    '',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].version, '17.0.0');
  assert.equal(result[0].releaseDate, '2026-03-09');
});

test('extracts entries grouped by Added/Changed/Deprecated/Removed/Fixed', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API.',
    '',
    '#### Changed',
    '- Improved differentiation between errors.',
    '',
    '#### Deprecated',
    '- Deprecated numbro.js.',
    '',
    '#### Removed',
    '- Removed core-js.',
    '',
    '#### Fixed',
    '- Fixed errors triggered by keyboard shortcuts.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 5);
  assert.deepEqual(
    result.map((e) => e.category),
    ['added', 'changed', 'deprecated', 'removed', 'fixed'],
  );
  assert.deepEqual(
    result.map((e) => e.title),
    [
      'Added the Theme API.',
      'Improved differentiation between errors.',
      'Deprecated numbro.js.',
      'Removed core-js.',
      'Fixed errors triggered by keyboard shortcuts.',
    ],
  );
  for (const entry of result) {
    assert.equal(entry.version, '17.0.0');
    assert.equal(entry.releaseDate, '2026-03-09');
  }
});

test('marks bullets starting with **Breaking change**: as breaking', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Removed',
    '- **Breaking change**: Removed core-js from dependencies.',
    '- Removed the languages folder.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 2);
  assert.equal(result[0].breaking, true);
  assert.equal(result[0].title, 'Removed core-js from dependencies.');
  assert.equal(result[1].breaking, false);
});
