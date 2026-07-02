import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChangelogContent, parseAllChangelogs } from '../changelog-parser.mjs';

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

test('extracts PR number from a trailing GitHub PR link', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Added',
    '- Added the Theme API. [#11950](https://github.com/handsontable/handsontable/pull/11950)',
    '- A bullet without a link.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result[0].prNumber, 11950);
  assert.equal(result[0].title, 'Added the Theme API.');
  assert.equal(result[1].prNumber, null);
});

test('detects framework prefix in bullets', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Fixed',
    '- React: Fixed a thing in React. [#1](https://github.com/handsontable/handsontable/pull/1)',
    '- Angular: Fixed a thing in Angular.',
    '- Vue: Fixed a thing in Vue.',
    '- Fixed a thing in core.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.deepEqual(
    result.map((e) => e.framework),
    ['react', 'angular', 'vue', 'core'],
  );
  assert.equal(result[0].title, 'Fixed a thing in React.');
});

test('bullets under "#### Breaking changes" heading get breaking: true without a bullet prefix', () => {
  const md = [
    '## 7.0.0',
    'Released on March 6, 2019',
    '',
    '#### Breaking changes',
    '- Removed Bower support.',
    '- Removed the deprecated selectCellByProp method.',
    '',
    '#### Changes',
    '- Fixed a bug.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 3);
  assert.equal(result[0].breaking, true);
  assert.equal(result[0].category, 'changed');
  assert.equal(result[1].breaking, true);
  assert.equal(result[2].breaking, false);
  assert.equal(result[2].category, 'changed');
});

test('captures prKind so issue links and pull links resolve to distinct URLs', () => {
  const md = [
    '## 17.0.0',
    'Released on March 9th, 2026',
    '',
    '#### Fixed',
    '- Fixed a regression with column sorting. [#11849](https://github.com/handsontable/handsontable/issues/11849)',
    '- Fixed a regression with row resizing. [#11852](https://github.com/handsontable/handsontable/pull/11852)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 2);
  assert.equal(result[0].prNumber, 11849);
  assert.equal(result[0].prKind, 'issues');
  assert.equal(result[1].prNumber, 11852);
  assert.equal(result[1].prKind, 'pull');
});

test('captures a citation trailed by a sentence period', () => {
  const md = [
    '## 8.0.0',
    'Released on November 16th, 2020',
    '',
    '#### Changed',
    '- Removed the experimental `GanttChart` plugin. [#7022](https://github.com/handsontable/handsontable/issues/7022).',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].prNumber, 7022);
  assert.equal(result[0].prKind, 'issues');
  assert.equal(result[0].title, 'Removed the experimental `GanttChart` plugin.');
});

test('captures a citation trailed by a migration-guide link', () => {
  const md = [
    '## 12.0.0',
    'Released on April 28th, 2022',
    '',
    '#### Changed',
    '- Changed how `updateSettings()` handles data updates. '
      + '[#7263](https://github.com/handsontable/handsontable/issues/7263) '
      + '[[migration guide]](@/guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0.md#step-1)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].prNumber, 7263);
  assert.equal(result[0].prKind, 'issues');
  assert.equal(result[0].title, 'Changed how `updateSettings()` handles data updates.');
});

test('does not capture an ambiguous mid-sentence citation', () => {
  const md = [
    '## 8.0.0',
    'Released on November 16th, 2020',
    '',
    '#### Changed',
    '- Refactored against [#5945](https://github.com/handsontable/handsontable/pull/5945) and more work followed.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].prNumber, null);
});

test('joins a hard-wrapped bullet and extracts the trailing PR link on the last line', () => {
  const md = [
    '## 11.1.0',
    'Released on January 13th, 2022',
    '',
    '#### Added',
    '- Added `updateData()`, a new method that lets you replace',
    "  Handsontable's data without resetting the states of cells, rows and",
    '  columns. [#7263](https://github.com/handsontable/handsontable/issues/7263)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].prNumber, 7263);
  assert.equal(result[0].prKind, 'issues');
  assert.equal(
    result[0].title,
    "Added `updateData()`, a new method that lets you replace Handsontable's data "
      + 'without resetting the states of cells, rows and columns.',
  );
});

test('extracts a parenthesized citation that wraps onto a continuation line', () => {
  const md = [
    '## 9.0.0',
    'Released on June 1st, 2021',
    '',
    '#### Fixed',
    '- Fixed a problem with the `IF` formulas not working properly.',
    '  ([#5870](https://github.com/handsontable/handsontable/issues/5870))',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].prNumber, 5870);
  assert.equal(result[0].prKind, 'issues');
  assert.equal(result[0].title, 'Fixed a problem with the `IF` formulas not working properly.');
});

test('does not emit bullets inside a boxes-list div', () => {
  const md = [
    '## 11.1.0',
    'Released on January 13th, 2022',
    '',
    '<div class="boxes-list gray">',
    '',
    '- [Blog post](https://handsontable.com/blog/handsontable-11.1.0)',
    '- [Documentation (11.1)](https://handsontable.com/docs/11.1/)',
    '',
    '</div>',
    '',
    '#### Added',
    '- Added a real feature. [#7263](https://github.com/handsontable/handsontable/pull/7263)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Added a real feature.');
  assert.equal(result[0].prNumber, 7263);
});

test('does not emit a standalone pure-link bullet under a "## Related" heading', () => {
  const md = [
    '## 9.0.0',
    'Released on June 1st, 2021',
    '',
    '#### Fixed',
    '- Fixed a real bug. [#6248](https://github.com/handsontable/handsontable/issues/6248)',
    '',
    '## Related',
    '',
    '- [Migrating from 8.4 to 9.0](@/guides/upgrade-and-migration/migrating-from-8.4-to-9.0/migrating-from-8.4-to-9.0.md)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Fixed a real bug.');
});

test('does not merge or emit nested sub-bullets', () => {
  const md = [
    '## 8.0.0',
    'Released on November 16th, 2020',
    '',
    '#### Breaking changes',
    '- Adjusted plugins to be compatible with upcoming managers',
    '  [#5945](https://github.com/handsontable/handsontable/pull/5945):',
    '  - Hidden indexes are not rendered anymore.',
    '  - The `getColWidth` for hidden index returns 0.',
    '- A following top-level change. [#6000](https://github.com/handsontable/handsontable/pull/6000)',
  ].join('\n');

  const result = parseChangelogContent(md);

  // Two top-level bullets only; the two nested sub-bullets are ignored.
  assert.equal(result.length, 2);
  assert.ok(result[0].title.startsWith('Adjusted plugins to be compatible with upcoming managers'));
  assert.ok(!/Hidden indexes/.test(result[0].title));
  assert.equal(result[1].prNumber, 6000);
});

test('joins a bullet wrapped mid-sentence across physical lines', () => {
  const md = [
    '## 12.0.1',
    'Released on November 18th, 2021',
    '',
    '#### Fixed',
    '- Fixed an issue where checking or unchecking a checkbox in a row with',
    '  [`autoRowSize: true`](@/api/options.md#autorowsize) and multi-line cell values caused rows to',
    '  align incorrectly. [#7102](https://github.com/handsontable/handsontable/issues/7102)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(
    result[0].title,
    'Fixed an issue where checking or unchecking a checkbox in a row with '
      + '[`autoRowSize: true`](@/api/options.md#autorowsize) and multi-line cell values caused rows to '
      + 'align incorrectly.',
  );
});

test('recovers a PR link that sits on a wrapped continuation line', () => {
  const md = [
    '## 12.0.1',
    'Released on November 18th, 2021',
    '',
    '#### Fixed',
    '- Fixed an issue where checking or unchecking a checkbox changed the cell width.',
    '  [#8211](https://github.com/handsontable/handsontable/issues/8211)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Fixed an issue where checking or unchecking a checkbox changed the cell width.');
  assert.equal(result[0].prNumber, 8211);
  assert.equal(result[0].prKind, 'issues');
});

test('keeps inline markdown from a wrapped bullet in the title', () => {
  const md = [
    '## 12.0.1',
    'Released on November 18th, 2021',
    '',
    '#### Fixed',
    '- Fixed an issue with',
    '  [`autoRowSize: true`](@/api/options.md#autorowsize).',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Fixed an issue with [`autoRowSize: true`](@/api/options.md#autorowsize).');
});

test('does not merge an indented line separated from the bullet by a blank line', () => {
  const md = [
    '## 12.0.1',
    'Released on November 18th, 2021',
    '',
    '#### Fixed',
    '- Fixed a standalone issue.',
    '',
    '  Some indented note that is not part of the bullet.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Fixed a standalone issue.');
});

test('the real v12.0.1 checkbox entry is no longer truncated (DEV-1958)', () => {
  const result = parseAllChangelogs();
  const entry = result.find(
    (e) => e.version === '12.0.1'
      && e.category === 'fixed'
      && e.title.startsWith('Fixed an issue where checking or unchecking a checkbox in a row with'),
  );

  assert.ok(entry, 'expected the v12.0.1 checkbox/autoRowSize entry to be present');
  assert.ok(
    entry.title.includes('align incorrectly'),
    `entry title is truncated: ${entry.title}`,
  );
  assert.equal(entry.prNumber, 7102);
});

test('converts <kbd> markup in bullets to inline code', () => {
  const md = [
    '## 12.0.0',
    'Released on May 9th, 2022',
    '',
    '#### Added',
    '- Added support for the <kbd>**Cmd**</kbd> key.',
    '- Added the <kbd>**Ctrl**</kbd>+<kbd>**S**</kbd> shortcut.',
    '- Added support for the <kbd>Enter</kbd> key.',
    '- Added a feature without any keyboard markup.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.deepEqual(
    result.map((e) => e.title),
    [
      'Added support for the `Cmd` key.',
      'Added the `Ctrl`+`S` shortcut.',
      'Added support for the `Enter` key.',
      'Added a feature without any keyboard markup.',
    ],
  );
});

test('converts <kbd> markup while still extracting a trailing PR citation', () => {
  const md = [
    '## 12.0.0',
    'Released on May 9th, 2022',
    '',
    '#### Fixed',
    '- Fixed an issue with the <kbd>**Enter**</kbd> key. [#8546](https://github.com/handsontable/handsontable/pull/8546)',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Fixed an issue with the `Enter` key.');
  assert.equal(result[0].prNumber, 8546);
  assert.equal(result[0].prKind, 'pull');
});

test('joins a <kbd> that wraps across source lines and fully converts it', () => {
  // The parser joins soft-wrapped continuation lines (as in changelog-12's
  // "Shift + Page Up/Page Down" breaking change), so a <kbd> split across
  // source lines is reassembled and every tag converts -- no literal tag shown.
  const md = [
    '## 12.0.0',
    'Released on May 9th, 2022',
    '',
    '#### Removed',
    '- **Breaking change**: Removed the <kbd>**Shift**</kbd>+<kbd>**Page Up**</kbd>/<kbd>**Page',
    '  Down**</kbd> keyboard shortcuts.',
  ].join('\n');

  const result = parseChangelogContent(md);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Removed the `Shift`+`Page Up`/`Page Down` keyboard shortcuts.');
  assert.ok(!/<kbd>/i.test(result[0].title));
});

test('parseAllChangelogs leaves no raw <kbd> tags in any entry title', () => {
  const result = parseAllChangelogs();
  for (const entry of result) {
    assert.ok(!/<kbd>/i.test(entry.title), `raw <kbd> left in title: ${entry.title}`);
  }
});

test('parseAllChangelogs returns entries from every changelog-X file (v6..v17)', () => {
  const result = parseAllChangelogs();
  const majors = new Set(result.map((e) => Number(e.version.split('.')[0])));
  for (let m = 6; m <= 17; m += 1) {
    assert.ok(majors.has(m), `expected major ${m} present`);
  }
});

test('parseAllChangelogs produces no entries with null releaseDate inside major releases', () => {
  const result = parseAllChangelogs();
  const mainline = result.filter((e) => /\.0\.0$/.test(e.version));
  for (const entry of mainline) {
    assert.ok(entry.releaseDate, `release date missing for ${entry.version} (${entry.title})`);
  }
});
