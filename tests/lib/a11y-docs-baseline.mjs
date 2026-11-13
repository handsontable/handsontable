/**
 * The docs site scan's baseline, refreshed from a run's scans (`tests/AGENTS.md`, "A11y: the docs site scan").
 * Every docs merge can add or remove findings, so the refresh is one command
 * (`scripts/a11y-docs-baseline.mjs`), never a hand edit. It compares the run's scans with the baseline
 * through the scan's own comparator, so it reads what the reporter reads, whatever baseline the run was
 * compared with: a grown or improved entry takes the run's count, a stale one goes, a new finding joins the
 * issue its rule and target already belong to, an entry of a page the run did not scan stays, and an entry of a
 * page that left the page list goes. A new finding whose rule and target no issue has yet needs a person to name
 * its issue, so it stops the refresh.
 */
import { compareViolations, entryKey, findingsFromScan, validateBaseline } from './a11y-baseline.mjs';

export const ENTRY_FIELDS = ['page', 'theme', 'rule', 'target', 'impact', 'nodes', 'issue'];
export const ISSUE_FIELDS = ['id', 'title', 'tracker'];

/**
 * The baseline after a run.
 *
 * @param {object} options The inputs.
 * @param {{axeCoreVersion: string, issues: object[], entries: object[]}} options.baseline The baseline as committed.
 * @param {object[]} options.scans The run's scans (`scans/<page>--<theme>.json` of the results artifact).
 * @param {string[]} options.pages The page ids, in the order of `a11y/docs/pages.mjs`.
 * @param {string[]} options.themes The themes, in the order of `a11y/docs/pages.mjs`.
 * @param {string} options.baseUrl The deploy the baseline is taken from (`DEFAULT_DOCS_BASE_URL`, the staging deploy).
 * @param {string} [options.baselineFile] The baseline's path below `tests/`, for the messages.
 * @param {string} [options.pagesFile] The page list's path, for the messages.
 * @returns {{document: object|null, changes: object, unplaced: object[], problems: string[]}} The refreshed
 * baseline (`null` when a scan read another deploy, a finding has no issue, or the result does not validate),
 * what changed, the new findings no issue covers, and why nothing can be written.
 */
export function refreshBaseline({ baseline, scans, pages, themes, baseUrl, baselineFile = 'a11y/docs/docs-baseline.json',
  pagesFile = 'tests/a11y/docs/pages.mjs' }) {
  const changes = { added: [], raised: [], lowered: [], impact: [], removed: [], unlisted: [], removedIssues: [], unverified: 0,
    engine: null };

  if (scans.length === 0) {
    return { document: null, changes, unplaced: [], problems: ['the run holds no scan, so it proves nothing about any entry'] };
  }

  const elsewhere = scans.filter(scan => typeof scan.url !== 'string' || !scan.url.startsWith(`${baseUrl}/`));

  if (elsewhere.length > 0) {
    return { document: null, changes, unplaced: [], problems: [`${elsewhere.length} scan${elsewhere.length === 1 ? '' : 's'} read `
      + `another deploy than ${baseUrl} (${elsewhere[0].url}): the baseline is the staging deploy's, and another deploy reads what it `
      + 'changed as new or fixed'] };
  }

  const engines = [...new Set(scans.map(scan => scan.axeCoreVersion))].sort();

  if (engines.length !== 1) {
    return { document: null, changes, unplaced: [],
      problems: [`the scans ran on ${engines.length} axe-core versions (${engines.join(', ')}); refresh from a run on one`] };
  }

  const verdict = compareViolations({
    baseline: baseline.entries,
    issues: baseline.issues,
    violations: scans.flatMap(scan => findingsFromScan(scan)),
    scanned: scans.map(({ page, theme }) => ({ page, theme })),
    mode: 'warn',
    baselineFile,
  });
  const found = new Map([...verdict.matched, ...verdict.grown, ...verdict.improved].map(finding => [entryKey(finding), finding]));
  const gone = new Set(verdict.stale.map(item => entryKey(item)));
  const unplaced = verdict.newViolations.filter(finding => finding.suggestedIssue === null).map(entryOf);
  // A page or theme that left the list is never scanned again, so its entries would stay unverified for good
  // and fail the validation below: the refresh drops them, as removing a page by hand would.
  const listed = item => pages.includes(item.page) && themes.includes(item.theme);
  const entries = [];

  for (const entry of baseline.entries) {
    const key = entryKey(entry);
    const finding = found.get(key);

    if (!listed(entry)) {
      changes.unlisted.push(entryOf(entry));
    } else if (gone.has(key)) {
      changes.removed.push(entryOf(entry));
    } else if (finding) {
      // The run's count and impact; the issue stays the one the entry names.
      const refreshed = entryOf({ ...finding, issue: entry.issue });

      if (refreshed.nodes !== entry.nodes) {
        (refreshed.nodes > entry.nodes ? changes.raised : changes.lowered).push({ ...refreshed, from: entry.nodes });
      }
      if (refreshed.impact !== entry.impact) {
        changes.impact.push({ ...refreshed, from: entry.impact });
      }
      entries.push(refreshed);
    } else {
      entries.push(entryOf(entry));
    }
  }
  for (const finding of verdict.newViolations) {
    if (finding.suggestedIssue !== null) {
      const entry = entryOf({ ...finding, issue: finding.suggestedIssue });

      changes.added.push(entry);
      entries.push(entry);
    }
  }

  const used = new Set(entries.map(entry => entry.issue));
  const issues = baseline.issues.filter((issue) => {
    if (!used.has(issue.id)) {
      changes.removedIssues.push(issue.id);
    }

    return used.has(issue.id);
  }).map(issue => pick(issue, ISSUE_FIELDS));

  changes.unverified = verdict.unverified.filter(listed).length;
  if (engines[0] !== baseline.axeCoreVersion) {
    changes.engine = { from: baseline.axeCoreVersion, to: engines[0] };
  }
  if (unplaced.length > 0) {
    return { document: null, changes, unplaced, problems: [`${unplaced.length} new finding${unplaced.length === 1 ? '' : 's'} `
      + 'whose rule and target no issue covers yet: add an issue to "issues" and the entries under it, then refresh again'] };
  }

  const document = { axeCoreVersion: engines[0], issues, entries: sortEntries(entries, { pages, themes }) };
  const problems = validateBaseline(document, { pages, themes, pagesFile });

  return { document: problems.length === 0 ? document : null, changes, unplaced, problems };
}

/**
 * The entries in the baseline's order: the page list's order, then the themes' (light before dark), then the
 * rule and the target, so a refresh changes the lines it must and no other.
 *
 * @param {object[]} entries The entries.
 * @param {{pages: string[], themes: string[]}} order The page ids and the themes, in their order.
 * @returns {object[]} A sorted copy.
 */
export function sortEntries(entries, { pages, themes }) {
  const pageIndex = new Map(pages.map((id, index) => [id, index]));
  const rank = (map, value) => map.get(value) ?? Number.MAX_SAFE_INTEGER;
  const themeIndex = new Map(themes.map((theme, index) => [theme, index]));

  return [...entries].sort((a, b) => rank(pageIndex, a.page) - rank(pageIndex, b.page)
    || rank(themeIndex, a.theme) - rank(themeIndex, b.theme)
    || a.rule.localeCompare(b.rule)
    || a.target.localeCompare(b.target));
}

/**
 * The baseline as its file holds it: one issue or entry per line, so a diff reads as a list.
 *
 * @param {{axeCoreVersion: string, issues: object[], entries: object[]}} document The baseline.
 * @returns {string} The file's text.
 */
export function formatBaseline(document) {
  const list = items => (items.length === 0 ? '[]' : `[\n${items.map(item => `    ${JSON.stringify(item)}`).join(',\n')}\n  ]`);

  return `{\n  "axeCoreVersion": ${JSON.stringify(document.axeCoreVersion)},\n`
    + `  "issues": ${list(document.issues.map(issue => pick(issue, ISSUE_FIELDS)))},\n`
    + `  "entries": ${list(document.entries.map(entry => pick(entry, ENTRY_FIELDS)))}\n}\n`;
}

/**
 * A finding or an entry as a baseline entry.
 *
 * @param {object} item The finding or entry, with its `issue` (or `suggestedIssue`).
 * @returns {object} The entry, fields in the file's order.
 */
function entryOf(item) {
  return pick({ ...item, issue: item.issue ?? item.suggestedIssue ?? null }, ENTRY_FIELDS);
}

/**
 * The fields of an object that are set, in the given order.
 *
 * @param {object} item The object.
 * @param {string[]} fields The fields.
 * @returns {object} The copy.
 */
function pick(item, fields) {
  return Object.fromEntries(fields.filter(field => item[field] !== undefined).map(field => [field, item[field]]));
}
