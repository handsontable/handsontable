/**
 * Baseline drift of the docs site scan: the pure half.
 *
 * A pull request's run of `Docs a11y` reads the staging deploy of develop, never the pull request's own docs, so a
 * finding it reports as new or grown against the docs baseline exists on develop's docs already, unless the pull
 * request's own scan code made it (a rule, the fingerprint, the page list). Docs merges add such drift every day,
 * and a red `A11y / docs-axe report` for it would be red on every pull request that touches the scan. So on a change
 * run, a new finding that develop's latest docs audit also saw is drift: it counts as a warning at most, and the
 * check run names the remedy (refresh the docs baseline). A grown finding is never drift: the ledger keeps no node
 * count of a docs finding, so it cannot tell a finding develop's docs grew from one this change grew. A finding that
 * audit did not see stays at its severity: this change made it, or the docs gained it after the audit, which the
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
  if (!Array.isArray(ledger?.rows) || !Array.isArray(ledger.nights)) {
    return null;
  }

  const night = ledger.nights
    .filter(entry => entry?.source === 'docs' && typeof entry.runId === 'string' && entry.axe !== null && typeof entry.axe === 'object')
    .reduce((latest, entry) => (latest === null || String(entry.seenAt ?? '') >= String(latest.seenAt ?? '') ? entry : latest), null);

  if (night === null) {
    return null;
  }

  return {
    runId: night.runId,
    seenAt: night.seenAt ?? null,
    headSha: night.headSha ?? null,
    keys: new Set(ledger.rows.filter(row => row?.source === 'docs' && row.lastRun === night.runId).map(driftKey)),
  };
}

/**
 * The drift predicate of a change run: a new finding of the comparison that the audit saw (`isDrift()`). A grown
 * finding never is: the ledger keeps no node count of a docs finding, so the audit cannot say develop's docs grew it.
 *
 * @param {{keys: Set<string>}|null} audit The audit (`docsAudit()`).
 * @param {{newViolations?: object[]}|null} comparison The docs comparison.
 * @returns {(item: object) => boolean} Whether a counted finding is drift.
 */
export function driftOf(audit, comparison) {
  const fresh = new Set(comparison?.newViolations ?? []);

  return item => fresh.has(item) && isDrift(audit, item);
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
 * @param {number} input.drift How many new findings are drift.
 * @param {number} input.counted How many new findings there are.
 * @param {number} [input.grown] How many grown findings there are, which are never drift.
 * @param {string|null} [input.deployedAt] When the staging deploy the run read finished, when known.
 * @returns {string[]} The notes, one sentence each.
 */
export function driftNotes({ audit, problem = null, drift, counted, grown = 0, deployedAt = null }) {
  if (problem !== null) {
    return [`The develop docs audit could not be read (${problem}), so every new or grown finding counts at its severity.`];
  }
  if (audit === null) {
    return [`The findings ledger holds no develop docs audit, so every new or grown finding counts at its severity: dispatch one, \`${DOCS_AUDIT_COMMAND}\`.`];
  }

  const notes = [];
  const when = audit.seenAt ? ` of ${audit.seenAt.slice(0, 10)}` : '';

  if (drift > 0) {
    notes.push(`${drift} of the ${counted} new findings are on develop's docs already: the develop docs audit${when} (run ${audit.runId}) `
      + 'saw them. That is baseline drift, not this change, so each counts as a warning at most: refresh tests/a11y/docs/docs-baseline.json '
      + `from that audit, \`node tests/scripts/a11y-docs-baseline.mjs --run ${audit.runId}\` (tests/AGENTS.md, "A11y: the docs site scan").`);
  }
  if (grown > 0) {
    notes.push(`${grown === 1 ? 'The grown finding counts' : `The ${grown} grown findings count`} at ${grown === 1 ? 'its' : 'their'} severity: the ledger `
      + 'keeps no node count of a docs finding, so the audit cannot tell develop\'s docs growing it from this change growing it.');
  }
  if (deployedAt && audit.seenAt && Date.parse(deployedAt) > Date.parse(audit.seenAt)) {
    notes.push(`The develop docs audit${when} is older than the staging deploy this run read (${deployedAt.slice(0, 16).replace('T', ' ')} UTC), so a `
      + `finding the docs gained since reads as this change's: dispatch the audit, \`${DOCS_AUDIT_COMMAND}\`, and re-run this job.`);
  }

  return notes;
}
