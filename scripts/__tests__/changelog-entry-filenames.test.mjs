/**
 * Tests for `bin/lib/entry-filenames.js`, the assertion that an entry file is
 * named after the number it cites.
 *
 * The invariant is what makes "one entry per pull request" enforceable: one
 * number owns one file, so a change cannot be split across two lines of the
 * same release notes. Every rejection case below is drawn from a file that was
 * actually written this way - see DEV-2880.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  entryBasename,
  findMisnamedEntries,
  formatMisnamedEntry,
  formatMisnamedReport
} = require('../../bin/lib/entry-filenames.js');

/**
 * Builds a record in the shape `consume` and `sync` hand to the finder.
 *
 * @param {string} file The entry's path.
 * @param {number} issueOrPR The number the entry cites.
 * @returns {{file: string, entry: object}} The record.
 */
const record = (file, issueOrPR) => ({ file, entry: { issueOrPR } });

test('entryBasename strips the directory and the extension', () => {
  assert.equal(entryBasename('.changelogs/13442.json'), '13442');
  assert.equal(entryBasename('/abs/path/.changelogs/13442.json'), '13442');
  assert.equal(entryBasename('.changelogs\\13442.json'), '13442', 'accepts a Windows separator');
  assert.equal(entryBasename('.changelogs/13442-changed.json'), '13442-changed');
});

test('a tree named after its numbers has no offenders', () => {
  const offenders = findMisnamedEntries([
    record('.changelogs/13442.json', 13442),
    record('.changelogs/7389.json', 7389),
    record('/abs/path/.changelogs/5092.json', 5092)
  ]);

  assert.deepEqual(offenders, []);
});

test('a suffixed filename is rejected', () => {
  // The shape that motivated the check: 13442.json (fixed) beside
  // 13442-changed.json (changed), both citing #13442.
  const offenders = findMisnamedEntries([
    record('.changelogs/13442.json', 13442),
    record('.changelogs/13442-changed.json', 13442)
  ]);

  assert.equal(offenders.length, 1);
  assert.equal(offenders[0].file, '.changelogs/13442-changed.json');
  assert.equal(offenders[0].expected, '13442');
});

test('every suffixed shape ever written is rejected', () => {
  const offenders = findMisnamedEntries([
    record('.changelogs/13396-changed.json', 13396),
    record('.changelogs/13448-changed.json', 13448),
    record('.changelogs/13448-deprecated.json', 13448),
    // The 2021 per-framework split. Banned too: a wrapper-wide fix files one
    // entry with `framework: none`, or separate pull requests.
    record('.changelogs/8311-react.json', 8311),
    record('.changelogs/8311-vue.json', 8311),
    record('.changelogs/8311-angular.json', 8311)
  ]);

  assert.equal(offenders.length, 6, 'every one is reported in a single pass');
});

test('a basename that disagrees with issueOrPR is rejected', () => {
  const offenders = findMisnamedEntries([record('.changelogs/13442.json', 13443)]);

  assert.equal(offenders.length, 1);
  assert.equal(offenders[0].basename, '13442');
  assert.equal(offenders[0].expected, '13443');
});

test('a leading zero is rejected', () => {
  // `Number('013442') === 13442`, so a numeric comparison would accept this as
  // a second file for #13442 - the exact collision the check exists to stop.
  const offenders = findMisnamedEntries([record('.changelogs/013442.json', 13442)]);

  assert.equal(offenders.length, 1, 'compared as strings, not numbers');
});

test('a non-numeric filename is rejected', () => {
  const offenders = findMisnamedEntries([
    record('.changelogs/entry.json', 13442),
    record('.changelogs/13442 copy.json', 13442),
    record('.changelogs/DEV-2880.json', 13442)
  ]);

  assert.equal(offenders.length, 3);
});

test('formatMisnamedEntry names the file, the number, and the required name', () => {
  const line = formatMisnamedEntry({
    file: '.changelogs/13442-changed.json',
    basename: '13442-changed',
    issueOrPR: 13442,
    expected: '13442'
  });

  assert.match(line, /\.changelogs\/13442-changed\.json/);
  assert.match(line, /#13442/);
  assert.match(line, /`13442\.json`/);
});

test('an empty report carries an empty message', () => {
  const report = formatMisnamedReport([]);

  assert.deepEqual(report.offenders, []);
  assert.equal(report.message, '');
});

test('an offender whose correct name is free gets the rename remedy', () => {
  // Only the suffixed file exists, so `13442.json` is free and `git mv` works.
  const report = formatMisnamedReport(findMisnamedEntries([
    record('.changelogs/13396-changed.json', 13396),
    record('.changelogs/13442-changed.json', 13442)
  ]));

  assert.equal(report.offenders.length, 2);
  assert.equal(report.offenders.every(r => r.collides), false);
  assert.match(report.message, /2 changelog entries are/, 'pluralized');
  assert.match(report.message, /git mv \.changelogs\/13442-changed\.json \.changelogs\/13442\.json/);
  assert.match(report.message, /git mv \.changelogs\/13396-changed\.json \.changelogs\/13396\.json/);
});

test('an offender whose correct name is TAKEN is never told to rename', () => {
  // The shape this check exists to stop, and the one the repo actually had:
  // `13442-changed.json` beside `13442.json`. `git mv` refuses here with
  // `fatal: destination exists`, and `git mv -f` would destroy the other
  // entry's title - so the rename line must not be offered for it.
  const report = formatMisnamedReport(findMisnamedEntries([
    record('.changelogs/13442.json', 13442),
    record('.changelogs/13442-changed.json', 13442)
  ]));

  assert.equal(report.offenders.length, 1, 'the correctly-named file is not an offender');
  assert.equal(report.offenders[0].file, '.changelogs/13442-changed.json');
  assert.equal(report.offenders[0].collides, true);

  // No `git mv` COMMAND line. The prose may still name the command to explain
  // why it is refused, so match on the command plus its argument.
  assert.doesNotMatch(report.message, /git mv \.changelogs/, 'no rename remedy for a collision');
  assert.doesNotMatch(report.message, /need only a rename/);
  assert.match(report.message, /already has/);
  assert.match(report.message, /13442\.json/);
  assert.match(report.message, /[Ff]old its title/);
  assert.match(report.message, /git rm/);
});

test('a mixed set gets each remedy for the right file', () => {
  const report = formatMisnamedReport(findMisnamedEntries([
    record('.changelogs/13442.json', 13442),
    record('.changelogs/13442-changed.json', 13442),
    record('.changelogs/13396-changed.json', 13396)
  ]));

  assert.equal(report.offenders.length, 2);
  // The free one renames...
  assert.match(report.message, /git mv \.changelogs\/13396-changed\.json \.changelogs\/13396\.json/);
  // ...and the taken one is not in a rename line.
  assert.doesNotMatch(report.message, /git mv \.changelogs\/13442-changed\.json/);
  assert.match(report.message, /13442-changed\.json {2}\(#13442 is already in 13442\.json\)/);
});

test('the report reads correctly for a single offender', () => {
  const report = formatMisnamedReport(findMisnamedEntries([
    record('.changelogs/13442-changed.json', 13442)
  ]));

  assert.match(report.message, /1 changelog entry is not named after the number it cites/);
});

test('an entry with no usable issueOrPR is skipped, not misreported', () => {
  // Reporting it would demand `undefined.json`, and renaming to that produces a
  // basename this function rejects for not being a number - a loop the author
  // cannot escape. `assertChangelogEntryFormat` diagnoses the real problem, and
  // the pre-push hook reaches this function without running that check first.
  for (const issueOrPR of [undefined, null, 'DEV-2880', NaN, Infinity, {}]) {
    assert.deepEqual(
      findMisnamedEntries([{ file: '.changelogs/13500.json', entry: { issueOrPR } }]),
      [],
      `issueOrPR=${String(issueOrPR)} must be skipped`
    );
  }

  // An entry object with no fields at all is skipped for the same reason.
  assert.deepEqual(findMisnamedEntries([{ file: '.changelogs/13500.json', entry: {} }]), []);
});

test('skipping a shapeless entry does not hide a well-formed offender beside it', () => {
  const offenders = findMisnamedEntries([
    { file: '.changelogs/13500.json', entry: {} },
    record('.changelogs/13442-changed.json', 13442)
  ]);

  assert.equal(offenders.length, 1);
  assert.equal(offenders[0].file, '.changelogs/13442-changed.json');
});
