/**
 * Detects pending `.changelogs/*.json` entries whose change is already
 * published in `CHANGELOG.md`.
 *
 * A pending entry can outlive the release-to-develop merge-back after its
 * entry has already been consumed on the release branch, and the next
 * `consume` then announces the same change a second time. Two merge shapes
 * produce it, and neither leaves a reliable signal of its own:
 *
 * - The change is committed once on the release branch and once on develop
 *   with no ancestry between them. The release side reads as add-then-delete
 *   against the merge base, so develop's add is the only change on either
 *   side and the merge keeps it silently.
 * - The entry file is edited on develop after being consumed. That is a
 *   modify/delete conflict, which is easy to resolve the wrong way.
 *
 * Rather than trying to recognize either merge shape, this module asserts the
 * one thing both of them produce: a pending entry that `CHANGELOG.md` already
 * carries.
 */

const ENTRY_LINK_PATTERN =
  /\[#(\d+)\]\(https:\/\/github\.com\/handsontable\/handsontable\/(?:pull|issues)\/\d+\)/g;

const VERSION_HEADING_PATTERN = /^## \[([^\]]+)\]/;

// `stringifyChangelogEntryObject` prefixes a published line with the breaking
// marker and then the framework name, so both come off before comparing a
// published line against an entry's raw `title`. The parenthesized breaking
// variant ("**Breaking change (React, Angular, Vue 2, Vue 3)**: ") appears in
// the older sections.
const BREAKING_PREFIX_PATTERN = /^\*\*Breaking change[^*]*\*\*:\s*/;
const FRAMEWORK_PREFIX_PATTERN = /^(?:React|Vue|Angular):\s*/;

/**
 * Reduces a published changelog line, or an entry's raw `title`, to a form in
 * which the two can be compared. Safe to call on either: every fragment it
 * strips is optional.
 *
 * @param {string} value A published `- ` line, or a changelog entry's title.
 * @returns {string} The comparable form of `value`.
 */
const normalizeEntryTitle = value => value
  .replace(/^- /, '')
  .replace(ENTRY_LINK_PATTERN, '')
  .replace(BREAKING_PREFIX_PATTERN, '')
  .replace(FRAMEWORK_PREFIX_PATTERN, '')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Indexes everything `CHANGELOG.md` already publishes, by cited number and by
 * normalized title, mapping each to the version section it first appears in.
 *
 * Only the *last* link on a line is the cited number: a title may reference
 * other pull requests inline, the way the 18.0.0 `PersistentState` entry cites
 * #12015 mid-sentence.
 *
 * @param {string} changelogContents The contents of `CHANGELOG.md`.
 * @returns {{numbers: Map<string, string>, titles: Map<string, string>}} The published entries.
 */
const collectPublishedEntries = (changelogContents) => {
  const numbers = new Map();
  const titles = new Map();
  let section = null;

  changelogContents.split('\n').forEach((line) => {
    const heading = line.match(VERSION_HEADING_PATTERN);

    if (heading) {
      section = heading[1];

      return;
    }

    // Anything above the first version heading is not published yet.
    if (section === null || !line.startsWith('- ')) {
      return;
    }

    const links = [...line.matchAll(ENTRY_LINK_PATTERN)];

    if (links.length) {
      const cited = links[links.length - 1][1];

      if (!numbers.has(cited)) {
        numbers.set(cited, section);
      }
    }

    const title = normalizeEntryTitle(line);

    if (title && !titles.has(title)) {
      titles.set(title, section);
    }
  });

  return { numbers, titles };
};

/**
 * Returns `changelogContents` with one version's section cut out, so that
 * section does not count as already published.
 *
 * `sync` needs this: it targets one section and already skips the entries
 * present in it, so only every *other* section may block an entry.
 *
 * @param {string} changelogContents The contents of `CHANGELOG.md`.
 * @param {string} version The version whose section to remove.
 * @returns {string} The contents without that section, or unchanged when it is absent.
 */
const excludeVersionSection = (changelogContents, version) => {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = changelogContents.match(new RegExp(`^## \\[${escapedVersion}\\]`, 'm'));

  if (heading === null) {
    return changelogContents;
  }

  const start = heading.index;
  const nextStart = changelogContents.indexOf('\n## [', start + 1);

  return changelogContents.slice(0, start) + (nextStart === -1 ? '' : changelogContents.slice(nextStart));
};

/**
 * Finds the pending entries that `CHANGELOG.md` already publishes.
 *
 * Both keys are needed, because each on its own has a blind spot that has
 * already occurred: the number key misses an entry published under a wrong
 * link (#12727 shipped as `[#0]`), and the title key misses an entry that was
 * reworded on one of the two branches (#13243).
 *
 * They carry different severities. A pull request number cannot ship twice, so
 * a `private` number hit is conclusive. A `public` number is a GitHub *issue*
 * number, which two releases may legitimately cite when a partial fix is
 * followed by a complete one - but a partial fix gets a new title, so a
 * `public` number hit that also matches the title key is not that case, and
 * escalates to an error the same way a `private` hit does. One title may
 * still legitimately appear in two sections when a fix is backported to
 * several release lines, so a title-only hit always warns instead of failing.
 *
 * @param {Array<{file: string, entry: object}>} pendingEntries Pending entries and their paths.
 * @param {string} changelogContents The contents of `CHANGELOG.md`.
 * @returns {Array<object>} One record per offending entry, in the order given.
 */
const findRepublishedEntries = (pendingEntries, changelogContents) => {
  const published = collectPublishedEntries(changelogContents);

  return pendingEntries.reduce((found, { file, entry }) => {
    const citedSection = published.numbers.get(String(entry.issueOrPR));
    const titleSection = published.titles.get(normalizeEntryTitle(entry.title));

    if (citedSection === undefined && titleSection === undefined) {
      return found;
    }

    found.push({
      file,
      issueOrPR: entry.issueOrPR,
      issuesOrigin: entry.issuesOrigin,
      citedSection,
      titleSection,
      severity: citedSection !== undefined
        && (entry.issuesOrigin === 'private' || titleSection !== undefined) ? 'error' : 'warning'
    });

    return found;
  }, []);
};

/**
 * Renders one offending entry as a single line.
 *
 * @param {object} record A record from `findRepublishedEntries`.
 * @returns {string} The rendered line.
 */
const formatRepublishedEntry = (record) => {
  const { file, issueOrPR, citedSection, titleSection } = record;
  const reasons = [];

  if (citedSection !== undefined) {
    reasons.push(`#${issueOrPR} is already cited in [${citedSection}]`);
  }

  if (titleSection !== undefined) {
    reasons.push(`its title is already published in [${titleSection}]`);
  }

  return `${file}: ${reasons.join(', and ')}`;
};

/**
 * Splits the records by severity and renders each group. Every offender is
 * listed in one pass, so a person fixing several of them does not have to
 * re-run the command once per file.
 *
 * @param {Array<object>} records The records from `findRepublishedEntries`.
 * @returns {{errors: Array<object>, warnings: Array<object>, errorMessage: string,
 *   warningMessage: string}} The report. Each message is empty when its group is.
 */
const formatRepublishedReport = (records) => {
  const errors = records.filter(r => r.severity === 'error');
  const warnings = records.filter(r => r.severity === 'warning');

  const errorMessage = errors.length ? [
    `${errors.length} pending changelog ${
      errors.length === 1 ? 'entry has' : 'entries have'
    } already been published:`,
    ...errors.map(r => `  ${formatRepublishedEntry(r)}`),
    '',
    'Their change shipped in an earlier release, so consuming them would announce it twice.',
    'This normally means the entry file outlived a release-to-develop merge-back. Remove them:',
    '',
    `  git rm ${errors.map(r => r.file).join(' ')}`,
    '',
    'If one of them is genuinely a new change that reuses a released pull request number,',
    'renumber the entry to cite its own pull request instead.'
  ].join('\n') : '';

  const warningMessage = warnings.length ? [
    `${warnings.length} pending changelog ${
      warnings.length === 1 ? 'entry looks' : 'entries look'
    } already published, but may be legitimate:`,
    ...warnings.map(r => `  ${formatRepublishedEntry(r)}`),
    '',
    'A public issue number may be cited by two releases (a partial fix, then a complete one),',
    'and one title may appear in two sections when a fix is backported to several release',
    'lines. Confirm that is the case here; otherwise remove the entry.'
  ].join('\n') : '';

  return { errors, warnings, errorMessage, warningMessage };
};

module.exports = {
  normalizeEntryTitle,
  collectPublishedEntries,
  excludeVersionSection,
  findRepublishedEntries,
  formatRepublishedEntry,
  formatRepublishedReport
};
