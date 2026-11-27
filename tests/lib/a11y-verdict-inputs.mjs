/**
 * What the three posters of an accessibility check run (`scripts/a11y-check-run.mjs`,
 * `scripts/a11y-evidence-report.mjs`, `scripts/screenreader-report.mjs`) read from the run before they build
 * a verdict (`lib/a11y-verdict.mjs`): the counting scope from the event that started the run, the tracker
 * lookup from the cluster catalog (`tests/a11y/issues.json`), and the run's id to stamp on the check run.
 *
 * The one place here that reads a file. A catalog that does not load leaves every finding at its severity
 * (nothing is tracked) and says so in a note, so a broken catalog can make a change run red and never green.
 * On an audit the posters also read the findings ledger as the audit before left it (`auditLedgerInput()`); a ledger
 * that does not load leaves every open finding counted, with a note, so a broken ledger can make an audit red and
 * never green.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ISSUES_FILE, compileIssuesCatalog, trackedBy } from './a11y-issues.mjs';
import { LEDGER_URL, auditLedgerOf, ledgerIndex } from './a11y-pr-ledger.mjs';
import { countingScope } from './a11y-verdict.mjs';

/**
 * The verdict inputs of a run.
 *
 * @param {object} input The input.
 * @param {Record<string, string|undefined>} input.env The environment: `GITHUB_EVENT_NAME` (in a reusable workflow,
 * the caller's event) and `GITHUB_RUN_ID`.
 * @param {string} input.testsRoot The `tests/` folder.
 * @returns {{scope: 'audit'|'change', tracked: (source: string, check: string, item: object) => boolean, externalId: string|undefined, notes: string[]}} The inputs.
 */
export function verdictInputs({ env, testsRoot }) {
  const notes = [];
  let catalog = null;

  try {
    catalog = compileIssuesCatalog(JSON.parse(readFileSync(path.join(testsRoot, ISSUES_FILE), 'utf8')));
  } catch (error) {
    notes.push(`tests/${ISSUES_FILE} did not load, so no finding is read as tracked: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { scope: countingScope(env.GITHUB_EVENT_NAME), tracked: trackedBy(catalog), externalId: env.GITHUB_RUN_ID || undefined, notes };
}

/**
 * The findings ledger as an audit's baseline (`auditLedgerOf()` of `lib/a11y-pr-ledger.mjs`): read on an audit only,
 * from `A11Y_LEDGER_FILE` (a saved copy, for a dry run or a replay) or `A11Y_LEDGER_URL` (the published `a11y.json` by
 * default). The ledger is written after an audit run ends, so while the run posts its check runs it holds the state
 * the audit before left. `GITHUB_RUN_ID` lets a re-run read the rows its own earlier attempt left as they were before.
 *
 * @param {object} input The input.
 * @param {Record<string, string|undefined>} input.env The environment.
 * @param {'audit'|'change'} input.scope The counting scope (`verdictInputs()`).
 * @param {string} input.source The row source of the check runs (`checks`, `axe`, `reader`, `docs`, …).
 * @param {(url: string) => Promise<unknown>} [input.fetchJson] Reads a URL's JSON; the global `fetch` by default.
 * @returns {Promise<object|undefined>} `undefined` on a change run; the classifier, or `{problem}` when the ledger did
 * not load.
 */
export async function auditLedgerInput({ env, scope, source, fetchJson = readJson }) {
  if (scope !== 'audit') {
    return undefined;
  }

  const from = env.A11Y_LEDGER_FILE || env.A11Y_LEDGER_URL || LEDGER_URL;

  try {
    const ledger = env.A11Y_LEDGER_FILE ? JSON.parse(readFileSync(env.A11Y_LEDGER_FILE, 'utf8')) : await fetchJson(from);

    return auditLedgerOf({ index: ledgerIndex(ledger, source), source, runId: env.GITHUB_RUN_ID || null });
  } catch (error) {
    return { problem: `the findings ledger did not load from ${from} (${error instanceof Error ? error.message : String(error)})` };
  }
}

/**
 * Fetches a URL's JSON.
 *
 * @param {string} url The URL.
 * @returns {Promise<unknown>} The parsed body.
 */
async function readJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }

  return response.json();
}
