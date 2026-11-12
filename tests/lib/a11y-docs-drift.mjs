/**
 * Baseline drift of the docs site scan: the pure half.
 *
 * A pull request's run of `Docs a11y` reads the staging deploy of develop, never the pull request's own docs, so a
 * finding it reports as new or grown against the docs baseline exists on develop's docs already, unless the pull
 * request's own scan code made it (a rule, the fingerprint, the page list). Docs merges add such drift every day,
 * and a red `A11y / docs-axe report` for it would be red on every pull request that touches the scan. So on a change
 * run, a new or grown finding that develop's latest docs audit also saw is drift: it counts as a warning at most, and
 * the check run names the remedy (refresh the docs baseline). A finding that audit did not see stays at its severity:
 * this change made it, or the docs gained it after the audit, which the check run says when the staging deploy is
 * newer than the audit. The latest audit is read from the findings ledger (`test-health/a11y.json` on `gh-pages`,
 * `.github/scripts/lib/a11y-ledger.mjs`): its docs rows sighted on the latest docs night. Policy: `tests/AGENTS.md`,
 * "A11y: the docs site scan". No I/O in here.
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
 * its findings are, and the baseline, the command that refreshes it from an audit (`null` where a person does it) and
 * the policy section a drift note points to.
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
 * and the key of every docs finding that night sighted. `null` when the ledger holds no docs night.
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @returns {{runId: string, seenAt: string|null, headSha: string|null, keys: Set<string>}|null} The audit.
 */
export function docsAudit(ledger) {
  return siteAudit(ledger, 'docs');
}

/**
 * A site's latest audit as the findings ledger records it (`docsAudit()` for the docs): the website's is its night
 * source `website`, and its rows' theme is the width.
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @param {'docs'|'website'} site The site.
 * @returns {{runId: string, seenAt: string|null, headSha: string|null, keys: Set<string>}|null} The audit.
 */
export function siteAudit(ledger, site) {
  const runId = ledger?.latest?.[site]?.runId;

  if (typeof runId !== 'string' || !Array.isArray(ledger.rows)) {
    return null;
  }

  const night = (Array.isArray(ledger.nights) ? ledger.nights : []).find(entry => entry?.source === site && entry.runId === runId);

  return {
    runId,
    seenAt: ledger.latest[site].seenAt ?? null,
    headSha: night?.headSha ?? null,
    keys: new Set(ledger.rows.filter(row => row?.source === site && row.lastRun === runId).map(driftKey)),
  };
}

/**
 * Whether a new or grown finding of the docs comparison is drift: the audit saw its rule on its page, scheme and
 * element.
 *
 * @param {{keys: Set<string>}|null} audit The audit (`docsAudit()`).
 * @param {{rule: string, page: string, theme: string, target: string}} item The comparison item.
 * @returns {boolean} The verdict.
 */
export function isDrift(audit, item) {
  // The ledger keeps a row's element masked, with its whitespace collapsed and cut at 300 characters.
  const text = String(maskSelector(item.target)).replace(/\s+/g, ' ').trim();
  const where = text.length > WHERE_LIMIT ? `${text.slice(0, WHERE_LIMIT - 1)}…` : text;

  return audit !== null && audit.keys.has(driftKey({ rule: item.rule, page: item.page, theme: item.theme, where }));
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
 * @param {string|null} [input.deployedAt] When the deploy the run read finished, when known.
 * @param {'docs'|'website'} [input.site] The site.
 * @returns {string[]} The notes, one sentence each.
 */
export function driftNotes({ audit, problem = null, drift, counted, deployedAt = null, site = 'docs' }) {
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
      + `saw them. That is baseline drift, not this change, so each counts as a warning at most: refresh ${words.baseline} `
      + `from that audit${refresh} (tests/AGENTS.md, "${words.section}").`);
  }
  if (deployedAt && audit.seenAt && Date.parse(deployedAt) > Date.parse(audit.seenAt)) {
    notes.push(`${Audit}${when} is older than ${words.deploy} this run read (${deployedAt.slice(0, 16).replace('T', ' ')} UTC), so a `
      + `finding the site gained since reads as this change's: dispatch the audit, \`${words.command}\`, and re-run this job.`);
  }

  return notes;
}
