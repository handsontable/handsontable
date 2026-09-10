/**
 * Detects `.changelogs/*.json` entries whose filename does not match the
 * number they cite.
 *
 * The invariant is that a file is named `<issueOrPR>.json` and nothing else,
 * which is what makes "one entry per pull request" enforceable at all: the
 * filesystem holds one file per number, so two entries citing the same number
 * cannot coexist. `bin/changelog entry` has always written exactly that name
 * and cannot produce anything else, so every violation is a file hand-written
 * around the CLI.
 *
 * The shape that motivated this is a suffix: `13442.json` (fixed) beside
 * `13442-changed.json` (changed), one pull request's change split across two
 * files that both cite #13442. Four such files were written in one month, and
 * `consume`/`sync` glob `*.json`, so they compiled happily into two adjacent
 * lines that no reader could tell came from one change.
 *
 * Checking the name rather than counting entries is deliberate. It needs no
 * diff base, no pull request context and no network, so the same function
 * serves `consume`, `sync` and the pre-push hook; and it cannot be dodged by
 * renaming a file, the way a check scoped to a pull request's added files can.
 */

/**
 * A filename that cites a number and nothing else. Anchored, and digits only,
 * so `13442-changed`, `13442 (copy)` and `entry` are all rejected.
 */
const ENTRY_BASENAME_PATTERN = /^\d+$/;

/**
 * Reduces a path to its basename without the `.json` extension. Accepts both
 * separators so a record built on Windows compares the same way.
 *
 * @param {string} file The entry's path, absolute or relative.
 * @returns {string} The basename with `.json` removed.
 */
const entryBasename = file => file
  .split(/[\\/]/)
  .pop()
  .replace(/\.json$/i, '');

/**
 * Finds the entries whose filename does not equal the number they cite.
 *
 * The comparison is between strings, not numbers: `Number('013442')` is
 * `13442`, so a numeric comparison would accept `013442.json` as a second
 * file for #13442 and hand back the very collision this prevents.
 *
 * An entry with no usable `issueOrPR` is skipped rather than reported. It has
 * a worse problem than its name, and `assertChangelogEntryFormat` says so
 * precisely; reporting it here would name `undefined.json` as the required
 * filename, and following that advice produces a name this function then
 * rejects for not being a number - a loop. Callers that validate the format
 * first never see such a record; the pre-push hook does not validate, which
 * is why the guard lives here and not in one caller.
 *
 * Each offender carries `collides`: whether the name it should have is already
 * taken by another entry in the same set. That decides the remedy, so it is
 * computed here where every record is visible. A colliding offender must not
 * be told to rename - see `formatMisnamedReport`.
 *
 * @param {Array<{file: string, entry: object}>} records Pending entries and their paths.
 * @returns {Array<{file: string, basename: string, issueOrPR: number, expected: string,
 *   collides: boolean}>} One record per offender, in input order.
 */
const findMisnamedEntries = (records) => {
  const usable = records.filter(({ entry }) => Number.isFinite(entry?.issueOrPR));
  const taken = new Set(usable.map(({ file }) => entryBasename(file)));

  return usable.reduce((found, { file, entry }) => {
    const basename = entryBasename(file);
    const expected = String(entry.issueOrPR);

    if (!ENTRY_BASENAME_PATTERN.test(basename) || basename !== expected) {
      found.push({
        file, basename, issueOrPR: entry.issueOrPR, expected, collides: taken.has(expected)
      });
    }

    return found;
  }, []);
};

/**
 * Renders one offending entry as a single line.
 *
 * @param {object} record A record from `findMisnamedEntries`.
 * @returns {string} The rendered line.
 */
const formatMisnamedEntry = record => `${record.file}: cites #${
  record.issueOrPR
}, so it must be named \`${record.expected}.json\``;

/**
 * Renders the report. Every offender is listed in one pass, so a person fixing
 * several of them does not have to re-run the command once per file.
 *
 * The two remedies are printed per offender, never both to everyone, because
 * the wrong one is destructive. An offender whose correct name is free is a
 * plain misname and renames cleanly. An offender whose correct name is taken
 * is two entries citing one number - the shape this whole check exists to
 * stop - and `git mv` refuses it with `fatal: destination exists`. Handing
 * that person a `git mv` line invites `git mv -f`, which overwrites the other
 * entry and loses its title. So a collision is told to fold instead.
 *
 * @param {Array<object>} records The records from `findMisnamedEntries`.
 * @returns {{offenders: Array<object>, message: string}} The report. The
 *   message is empty when there are no offenders.
 */
const formatMisnamedReport = (records) => {
  if (records.length === 0) {
    return { offenders: records, message: '' };
  }

  const renamable = records.filter(r => !r.collides);
  const colliding = records.filter(r => r.collides);

  const message = [
    `${records.length} changelog ${
      records.length === 1 ? 'entry is' : 'entries are'
    } not named after the number ${
      records.length === 1 ? 'it cites' : 'they cite'
    }:`,
    ...records.map(r => `  ${formatMisnamedEntry(r)}`),
    '',
    'An entry file is always `<issueOrPR>.json`. That is how one pull request stays one',
    'entry: a number owns exactly one file, so a change cannot be split across two lines',
    'of the same release notes. `npm run changelog entry` writes that name for you.',
    ...(renamable.length ? [
      '',
      'These need only a rename:',
      '',
      ...renamable.map(r => `  git mv ${r.file} ${
        r.file.replace(/[^\\/]+$/, `${r.expected}.json`)
      }`)
    ] : []),
    ...(colliding.length ? [
      '',
      `${colliding.length === 1 ? 'This one cites' : 'These cite'} a number that already has an`,
      'entry, so do NOT rename: `git mv` refuses a destination that exists, and forcing it',
      'overwrites the other entry and loses its title.',
      '',
      ...colliding.map(r => `  ${r.file}  (#${r.issueOrPR} is already in ${r.expected}.json)`),
      '',
      `Fold ${
        colliding.length === 1 ? 'its title' : 'their titles'
      } into that file and \`git rm\` ${
        colliding.length === 1 ? 'it' : 'them'
      }, or renumber to cite`,
      'a GitHub number of its own.'
    ] : [])
  ].join('\n');

  return { offenders: records, message };
};

module.exports = {
  entryBasename,
  findMisnamedEntries,
  formatMisnamedEntry,
  formatMisnamedReport
};
