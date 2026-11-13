/**
 * Baseline drift of the docs site scan: the pure half.
 *
 * A pull request's run of `Docs a11y` reads the staging deploy of develop, never the pull request's own docs, so a
 * finding it reports as new or grown against the docs baseline exists on develop's docs already, unless the pull
 * request's own scan code made it (a rule, the fingerprint, the page list). Docs merges add such drift every day,
 * and a red `A11y / docs-axe report` for it would be red on every pull request that touches the scan. So on a change
 * run, a new finding that develop's latest docs audit also saw is drift: it counts as a warning at most, and the
 * check run names the remedy (refresh the docs baseline). A grown finding is drift when the audit counted at least as
 * many nodes for it as the run does: develop's docs grew it that far. Beyond the audit's count, the growth is this
 * change's, and a row the ledger recorded before it kept node counts says nothing. A finding that audit did not see
 * stays at its severity: this change made it, or the docs gained it after the audit, which the
 * check run says when the staging deploy is newer than the audit. The latest audit is read from the findings ledger
 * (`test-health/a11y.json` on `gh-pages`, `.github/scripts/lib/a11y-ledger.mjs`): its docs rows sighted on the latest
 * docs night that read the scan. Policy: `tests/AGENTS.md`, "A11y: the docs site scan". No I/O in here.
 */
import { maskSelector } from './a11y-issues.mjs';

/**
 * Where the findings ledger is published.
 */
export const LEDGER_URL = 'https://handsontable.github.io/handsontable/test-health/a11y.json';
/**
 * The command that measures develop's docs again, which a stale audit asks for.
 */
export const DOCS_AUDIT_COMMAND = 'gh workflow run docs-a11y.yml --ref develop';
/**
 * The same rule for the website scan, whose change runs read production: what each site's notes call its audit, where
 * its findings are, the baseline, the command that refreshes it from an audit (`null` where a person does it), and the
 * policy section a drift note points to.
 */
export const SITE_DRIFT = Object.freeze({
  docs: {
    audit: 'the develop docs audit', none: 'no develop docs audit', on: 'on develop\'s docs already', command: DOCS_AUDIT_COMMAND,
    baseline: 'tests/a11y/docs/docs-baseline.json', refresh: 'node tests/scripts/a11y-docs-baseline.mjs --run',
    section: 'A11y: the docs site scan', deploy: 'the staging deploy',
  },
  website: {
    audit: 'the website audit', none: 'no website audit', on: 'on the live website already', command: 'gh workflow run website-a11y.yml --ref develop',
    baseline: 'tests/a11y/website/website-baseline.json', refresh: null, section: 'A11y: the website scan',
    deploy: 'the production deploy',
  },
});
// The longest element the ledger keeps (`A11Y_LIMITS.where` of `.github/scripts/lib/a11y-ledger.mjs`).
const WHERE_LIMIT = 300;

/**
 * The key a docs finding is matched on between a run and the audit: the axe rule, the page, the color scheme and the
 * masked element, as the ledger keys a docs row.
 *
 * @param {{rule: string, page: string, theme: string, where: string}} finding The finding.
 * @returns {string} The key.
 */
export function driftKey({ rule, page, theme, where }) {
  return [rule, page, theme, where].join('|');
}

/**
 * Develop's latest docs audit as the findings ledger records it: its run, when it was read, the commit it measured,
 * and the key of every docs finding that night sighted. The audit is the latest docs night that read the scan (its
 * `axe` summary is set): a night of the checks alone, when the scan wrote no findings document, sighted no docs
 * finding, and as the audit it would make every finding count. `null` when the ledger holds no such night.
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @returns {{runId: string, seenAt: string|null, headSha: string|null, keys: Set<string>}|null} The audit.
 */
export function docsAudit(ledger) {
  return siteAudit(ledger, 'docs');
}

/**
 * A site's latest audit as the findings ledger records it (`docsAudit()` for the docs; the website's night source is
 * `website`, and its rows' theme is the width): the latest night of the site that read its scan (its `axe` summary
 * is set). A night of the checks alone, when the scan wrote no findings document, sighted no finding of the scan, and
 * as the audit it would make every finding count.
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @param {'docs'|'website'} site The site.
 * @returns {{runId: string, seenAt: string|null, headSha: string|null, keys: Set<string>, nodes: Map<string, number|null>}|null}
 *   The audit: the key of every finding it sighted, and the node count it recorded for each (`null` when none).
 */
export function siteAudit(ledger, site) {
  if (!Array.isArray(ledger?.rows) || !Array.isArray(ledger.nights)) {
    return null;
  }

  const night = ledger.nights
    .filter(entry => entry?.source === site && typeof entry.runId === 'string' && entry.axe !== null && typeof entry.axe === 'object')
    .reduce((latest, entry) => (latest === null || String(entry.seenAt ?? '') >= String(latest.seenAt ?? '') ? entry : latest), null);

  if (night === null) {
    return null;
  }

  const sighted = ledger.rows.filter(row => row?.source === site && row.lastRun === night.runId);

  return {
    runId: night.runId,
    seenAt: night.seenAt ?? null,
    headSha: night.headSha ?? null,
    keys: new Set(sighted.map(driftKey)),
    nodes: new Map(sighted.map(row => [driftKey(row), Number.isSafeInteger(row.nodes) ? row.nodes : null])),
  };
}

/**
 * The drift predicate of a change run: a new finding of the comparison the audit saw (`isDrift()`), and a grown one
 * the audit saw with at least as many nodes as the run counts (develop's docs grew it that far). A grown finding past
 * the audit's count, or on a row with no count, is not drift. Both counts are per ledger row: the ledger keeps one row
 * for every location whose element masks alike and sums their nodes, so the run's count is that sum too, over every
 * finding it reproduced. One location's growth is then not hidden by a sibling's nodes.
 *
 * @param {{keys: Set<string>, nodes?: Map<string, number|null>}|null} audit The audit (`siteAudit()`).
 * @param {{newViolations?: object[], grown?: object[]}|null} comparison The site's comparison.
 * @returns {(item: object) => boolean} Whether a counted finding is drift.
 */
export function driftOf(audit, comparison) {
  const fresh = new Set(comparison?.newViolations ?? []);
  const grown = new Set(comparison?.grown ?? []);
  // The run's nodes per ledger row, over what the ledger sums for an audit: the new findings and every location of a
  // known issue. A location with no count leaves its row's count unknown.
  const counted = new Map();

  for (const item of ['newViolations', 'grown', 'matched', 'improved'].flatMap(set => comparison?.[set] ?? [])) {
    const key = itemKey(item);
    const before = counted.has(key) ? counted.get(key) : 0;

    counted.set(key, before === null || !Number.isFinite(item.nodes) ? null : before + item.nodes);
  }

  return (item) => {
    if (fresh.has(item)) {
      return isDrift(audit, item);
    }
    if (!grown.has(item) || !isDrift(audit, item)) {
      return false;
    }

    const recorded = audit.nodes?.get(itemKey(item)) ?? null;
    const runs = counted.get(itemKey(item)) ?? null;

    return recorded !== null && runs !== null && recorded >= runs;
  };
}

/**
 * Whether a finding of the docs comparison is on develop's docs already: the audit saw its rule on its page, scheme
 * and element.
 *
 * @param {{keys: Set<string>}|null} audit The audit (`docsAudit()`).
 * @param {{rule: string, page: string, theme: string, target: string}} item The comparison item.
 * @returns {boolean} The verdict.
 */
export function isDrift(audit, item) {
  return audit !== null && audit.keys.has(itemKey(item));
}

/**
 * The ledger key of a comparison item: the ledger keeps a row's element masked, with its whitespace collapsed and
 * cut at 300 characters.
 *
 * @param {{rule: string, page: string, theme: string, target: string}} item The comparison item.
 * @returns {string} The key.
 */
function itemKey(item) {
  const text = String(maskSelector(item.target)).replace(/\s+/g, ' ').trim();
  const where = text.length > WHERE_LIMIT ? `${text.slice(0, WHERE_LIMIT - 1)}…` : text;

  return driftKey({ rule: item.rule, page: item.page, theme: item.theme, where });
}

/**
 * What the check run says about drift: how many of the counted findings it is and the remedy; that the audit could not
 * be read, or that there is none, so every finding counts; and that the audit is older than the staging deploy, so a
 * finding the docs gained since reads as this change's.
 *
 * @param {object} input What the poster read.
 * @param {{runId: string, seenAt: string|null}|null} input.audit The audit, or `null`.
 * @param {string|null} [input.problem] Why the ledger could not be read.
 * @param {number} input.drift How many new or grown findings are drift.
 * @param {number} input.counted How many new or grown findings there are.
 * @param {number} [input.grown] How many grown findings are not drift: grown past the audit's count, or on a row with
 *   no count.
 * @param {string|null} [input.deployedAt] When the deploy the run read finished, when known.
 * @param {'docs'|'website'} [input.site] The site.
 * @returns {string[]} The notes, one sentence each.
 */
export function driftNotes({ audit, problem = null, drift, counted, grown = 0, deployedAt = null, site = 'docs' }) {
  const words = SITE_DRIFT[site];
  const Audit = `${words.audit[0].toUpperCase()}${words.audit.slice(1)}`;

  if (problem !== null) {
    return [`${Audit} could not be read (${problem}), so every new or grown finding counts at its severity.`];
  }
  if (audit === null) {
    return [`The findings ledger holds ${words.none}, so every new or grown finding counts at its severity: dispatch one, \`${words.command}\`.`];
  }

  const notes = [];
  const when = audit.seenAt ? ` of ${audit.seenAt.slice(0, 10)}` : '';

  if (drift > 0) {
    const refresh = words.refresh ? `, \`${words.refresh} ${audit.runId}\`` : '';

    notes.push(`${drift} of the ${counted} new or grown findings are ${words.on}: ${words.audit}${when} (run ${audit.runId}) `
      + `saw them, each grown one with at least as many nodes. That is baseline drift, not this change, so each counts as a `
      + `warning at most: refresh ${words.baseline} from that audit${refresh} (tests/AGENTS.md, "${words.section}").`);
  }
  if (grown > 0) {
    notes.push(`${grown === 1 ? 'A grown finding counts' : `${grown} grown findings count`} at ${grown === 1 ? 'its' : 'their'} severity: `
      + `this run counts more nodes than ${words.audit} recorded, or its row there has no count (recorded before the ledger `
      + 'kept node counts).');
  }
  if (deployedAt && audit.seenAt && Date.parse(deployedAt) > Date.parse(audit.seenAt)) {
    notes.push(`${Audit}${when} is older than ${words.deploy} this run read (${deployedAt.slice(0, 16).replace('T', ' ')} UTC), so a `
      + `finding the site gained since reads as this change's: dispatch the audit, \`${words.command}\`, and re-run this job.`);
  }

  return notes;
}
