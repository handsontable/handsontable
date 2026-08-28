/**
 * Tests for `bin/lib/published-entries.js`, the assertion that stops a pending
 * `.changelogs/*.json` entry from being consumed a second time after its change
 * has already been published.
 *
 * The two keys and the two severities are the whole point of the module, and
 * every case below is drawn from an episode that actually happened - see
 * DEV-2678 for the traces.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  normalizeEntryTitle,
  collectPublishedEntries,
  excludeVersionSection,
  findRepublishedEntries,
  formatRepublishedReport
} = require('../../bin/lib/published-entries.js');

const link = n => `[#${n}](https://github.com/handsontable/handsontable/pull/${n})`;
const issueLink = n => `[#${n}](https://github.com/handsontable/handsontable/issues/${n})`;

const CHANGELOG = [
  '# Changelog',
  '',
  '<!-- UNVERSIONED -->',
  '',
  `- An unreleased line above the first heading is not published yet. ${link(999)}`,
  '',
  '## [18.0.0] - 2026-06-30',
  '',
  '### Added',
  `- Angular: Modernized the Angular wrapper. ${link(12451)}`,
  '',
  '### Fixed',
  `- Fixed cell meta being reset by \`updateSettings\`. ${link(12811)}`,
  // The published PersistentState entry cites another pull request mid-title and
  // carries a broken trailing link, which is what makes the title key load-bearing.
  `- **Breaking change**: Removed the \`PersistentState\` plugin (see ${link(12015)}). ${link(0)}`,
  '',
  '## [17.1.0] - 2026-05-19',
  '',
  '### Fixed',
  `- Fixed a public issue only partly. ${issueLink(7555)}`,
  ''
].join('\n');

const entry = overrides => ({
  issuesOrigin: 'private',
  title: 'A brand new change.',
  type: 'fixed',
  issueOrPR: 13300,
  breaking: false,
  framework: 'none',
  ...overrides
});

test('normalizeEntryTitle converges a published line and a raw entry title', () => {
  assert.equal(
    normalizeEntryTitle(`- Angular: Modernized the Angular wrapper. ${link(12451)}`),
    'Modernized the Angular wrapper.'
  );
  assert.equal(normalizeEntryTitle('Modernized the Angular wrapper.'), 'Modernized the Angular wrapper.');
});

test('normalizeEntryTitle strips the breaking marker, including the parenthesized variant', () => {
  assert.equal(normalizeEntryTitle('- **Breaking change**: Removed a thing.'), 'Removed a thing.');
  assert.equal(
    normalizeEntryTitle('- **Breaking change (React, Angular, Vue 2, Vue 3)**: Removed a thing.'),
    'Removed a thing.'
  );
});

test('collectPublishedEntries ignores lines above the first version heading', () => {
  const { numbers } = collectPublishedEntries(CHANGELOG);

  assert.equal(numbers.has('999'), false);
  assert.equal(numbers.get('12451'), '18.0.0');
});

test('collectPublishedEntries keys on the last link, not a number cited inside the title', () => {
  const { numbers } = collectPublishedEntries(CHANGELOG);

  // #12015 is referenced mid-sentence by the PersistentState entry; only the
  // trailing link is that entry's own citation.
  assert.equal(numbers.has('12015'), false);
  assert.equal(numbers.get('0'), '18.0.0');
});

test('excludeVersionSection removes the first section but keeps the later ones', () => {
  const { numbers } = collectPublishedEntries(excludeVersionSection(CHANGELOG, '18.0.0'));

  assert.equal(numbers.has('12451'), false, '18.0.0 must be gone');
  assert.equal(numbers.has('12811'), false, '18.0.0 must be gone');
  assert.equal(numbers.get('7555'), '17.1.0', '17.1.0 must survive');
});

test('excludeVersionSection removes the last section, where there is no next heading', () => {
  const { numbers } = collectPublishedEntries(excludeVersionSection(CHANGELOG, '17.1.0'));

  assert.equal(numbers.has('7555'), false, '17.1.0 must be gone');
  assert.equal(numbers.get('12451'), '18.0.0', '18.0.0 must survive');
});

test('excludeVersionSection leaves the contents alone when the version is absent', () => {
  assert.equal(excludeVersionSection(CHANGELOG, '99.0.0'), CHANGELOG);
});

test('excludeVersionSection keeps the target section from blocking a sync into it', () => {
  const pending = [{ file: '.changelogs/12451.json', entry: entry({ issueOrPR: 12451 }) }];

  assert.equal(findRepublishedEntries(pending, CHANGELOG).length, 1, 'blocked without the excision');
  assert.deepEqual(
    findRepublishedEntries(pending, excludeVersionSection(CHANGELOG, '18.0.0')),
    [],
    'allowed when syncing into the very section that holds it'
  );
});

test('a private number already published is a hard error', () => {
  const records = findRepublishedEntries(
    [{ file: '.changelogs/12811.json', entry: entry({ issueOrPR: 12811, title: 'Reworded on develop.' }) }],
    CHANGELOG
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].severity, 'error');
  assert.equal(records[0].citedSection, '18.0.0');
  assert.equal(records[0].titleSection, undefined);
});

test('a title already published is caught even when the number is not - the [#0] case', () => {
  const records = findRepublishedEntries(
    [{
      file: '.changelogs/12727.json',
      entry: entry({
        issueOrPR: 12727,
        breaking: true,
        title: `Removed the \`PersistentState\` plugin (see ${link(12015)}).`
      })
    }],
    CHANGELOG
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].citedSection, undefined, 'the published entry cites #0, not #12727');
  assert.equal(records[0].titleSection, '18.0.0');
  assert.equal(records[0].severity, 'warning', 'a title-only hit may be a legitimate backport');
});

test('a public issue number already published only warns', () => {
  const records = findRepublishedEntries(
    [{
      file: '.changelogs/7555.json',
      entry: entry({ issuesOrigin: 'public', issueOrPR: 7555, title: 'Finished fixing the public issue.' })
    }],
    CHANGELOG
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].citedSection, '17.1.0');
  assert.equal(records[0].severity, 'warning');
});

test('a framework prefix does not hide a republished title', () => {
  const records = findRepublishedEntries(
    [{
      file: '.changelogs/13301.json',
      entry: entry({ issueOrPR: 13301, framework: 'angular', title: 'Modernized the Angular wrapper.' })
    }],
    CHANGELOG
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].titleSection, '18.0.0');
});

test('a genuinely new entry produces no record', () => {
  assert.deepEqual(
    findRepublishedEntries([{ file: '.changelogs/13300.json', entry: entry() }], CHANGELOG),
    []
  );
});

test('every offender is reported in one pass, and the git rm line covers only the errors', () => {
  const { errors, warnings, errorMessage, warningMessage } = formatRepublishedReport(
    findRepublishedEntries(
      [
        { file: '.changelogs/12811.json', entry: entry({ issueOrPR: 12811 }) },
        { file: '.changelogs/12451.json', entry: entry({ issueOrPR: 12451 }) },
        {
          file: '.changelogs/7555.json',
          entry: entry({ issuesOrigin: 'public', issueOrPR: 7555, title: 'Finished the public issue.' })
        }
      ],
      CHANGELOG
    )
  );

  assert.equal(errors.length, 2);
  assert.equal(warnings.length, 1);
  assert.match(errorMessage, /2 pending changelog entries have already been published/);
  assert.match(errorMessage, /\.changelogs\/12811\.json/);
  assert.match(errorMessage, /\.changelogs\/12451\.json/);
  assert.match(errorMessage, /git rm \.changelogs\/12811\.json \.changelogs\/12451\.json/);
  assert.doesNotMatch(errorMessage, /7555/, 'a warning must not reach the git rm line');
  assert.match(warningMessage, /\.changelogs\/7555\.json/);
});

test('an entry hitting both keys reports both reasons', () => {
  const { errorMessage } = formatRepublishedReport(
    findRepublishedEntries(
      [{
        file: '.changelogs/12451.json',
        entry: entry({ issueOrPR: 12451, framework: 'angular', title: 'Modernized the Angular wrapper.' })
      }],
      CHANGELOG
    )
  );

  assert.match(errorMessage, /#12451 is already cited in \[18\.0\.0\], and its title is already published/);
});

test('a clean set renders no message at all', () => {
  const report = formatRepublishedReport(
    findRepublishedEntries([{ file: '.changelogs/13300.json', entry: entry() }], CHANGELOG)
  );

  assert.equal(report.errorMessage, '');
  assert.equal(report.warningMessage, '');
});
