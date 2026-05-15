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
