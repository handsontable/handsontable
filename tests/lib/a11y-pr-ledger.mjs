/**
 * New and known on a pull request: the findings ledger as the baseline of the checks beyond axe.
 *
 * A pull request runs the short suite of the checks beyond axe (`pullRequest` in `EVIDENCE_CHECKS`), and every
 * page of the catalog carries findings the weekly audit already knows. Counted as they stand, those would turn every
 * pull request's check runs red. So on a pull request each finding is looked up in the findings ledger
 * (`test-health/a11y.json` on `gh-pages`, written by `.github/scripts/lib/a11y-ledger.mjs` from the audits) by the
 * key the ledger gives its row (`ledgerKey()`):
 *
 * - **known**: the row is open (new, persisting or flapping). It does not count.
 * - **regression**: the row is resolved. A fix the audit saw has come undone.
 * - **new**: there is no row.
 *
 * Two limits, which the report states. The ledger is as old as the latest audit, so a defect merged to develop since
 * then reads as new on the next pull request; and a row is keyed by the element's selector, so a renamed class makes a
 * known finding read as new. A new finding on a page whose sources the pull request does not touch
 * (`pagesTouched()`) is therefore marked as on a page it did not change, and counts as a warning at most.
 *
 * Pure, and never imports from `tests/a11y/`: the verdict jobs check out `tests/lib` alone. The script that reads the
 * ledger and the pull request's files passes the page list and the coverage map in.
 */
import { maskSelector } from './a11y-issues.mjs';

export { LEDGER_URL } from './a11y-docs-drift.mjs';
// The longest element the ledger keeps (`A11Y_LIMITS.where` of `.github/scripts/lib/a11y-ledger.mjs`).
const WHERE_LIMIT = 300;

/**
 * A value as the ledger cuts it: whitespace folded, at most `max` characters, an ellipsis where it was cut.
 *
 * @param {unknown} value The value.
 * @param {number} max The limit.
 * @returns {string} The text.
 */
function cut(value, max) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * The key the ledger gives a check's finding: its source, check, kind, rule, cause, page, theme, state, variant and
 * the masked selector, the step or both. The ledger's `findingKey()` of the same finding gives the same string, and
 * `.github/scripts/__tests__/a11y-pr-ledger.test.mjs` holds the two together.
 *
 * @param {string} source The finding source (`checks`).
 * @param {string} check The check id.
 * @param {object} finding The evidence finding.
 * @returns {string} The key.
 */
export function ledgerKey(source, check, finding) {
  const selector = typeof finding.selector === 'string' ? maskSelector(finding.selector) : null;
  const step = typeof finding.step === 'string' ? cut(finding.step, WHERE_LIMIT) : null;
  const where = cut(selector !== null && step !== null ? `${selector} @ ${step}` : (selector ?? step), WHERE_LIMIT);

  return [source, check, finding.kind, finding.rule ?? '', finding.cause ?? '', finding.page, finding.theme ?? '', finding.state ?? '',
    finding.variant ?? '', where].join('|');
}

/**
 * The ledger's rows of one source, by key, and the audit they come from.
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @param {string} [source] The finding source.
 * @returns {{statuses: Map<string, string>, auditAt: string|null, auditRun: string|null}} The index.
 */
export function ledgerIndex(ledger, source = 'checks') {
  if (!Array.isArray(ledger?.rows)) {
    throw new Error('the ledger has no rows list');
  }

  const statuses = new Map();

  for (const row of ledger.rows) {
    if (row?.source === source && typeof row.key === 'string') {
      statuses.set(row.key, row.status);
    }
  }

  return { statuses, auditAt: ledger.latest?.a11y?.seenAt ?? null, auditRun: ledger.latest?.a11y?.runId ?? null };
}

/**
 * Whether a finding is known, a regression or new, by its ledger row.
 *
 * @param {{statuses: Map<string, string>}} index The index (`ledgerIndex()`).
 * @param {string} source The finding source.
 * @param {string} check The check id.
 * @param {object} finding The evidence finding.
 * @returns {'known'|'regression'|'new'} The class.
 */
export function ledgerClass(index, source, check, finding) {
  const status = index.statuses.get(ledgerKey(source, check, finding));

  if (status === undefined) {
    return 'new';
  }

  return status === 'resolved' ? 'regression' : 'known';
}

/**
 * The catalog pages whose sources a pull request's changed files touch, or every page when a change reaches all of
 * them. A page's sources are its fixture under `tests/fixtures/demo/` and the plugin and editor folders the coverage
 * map lists it under. Shared code (anything else under `handsontable/src/`) and the checks themselves (`tests/a11y/`,
 * `tests/lib/`) touch every page. This is a hint for the report, not a scope: the run measures every page.
 *
 * @param {string[]} files The changed paths, from the repository root.
 * @param {object} input What the pages are made of.
 * @param {Array<{id: string, fixture: string}>} input.pages The catalog (`A11Y_PAGES`).
 * @param {Record<string, object>} input.plugins `PLUGIN_COVERAGE` of `tests/a11y/coverage.mjs`.
 * @param {Record<string, object>} input.editors `EDITOR_COVERAGE`.
 * @returns {Set<string>|'all'} The page ids touched.
 */
export function pagesTouched(files, { pages, plugins, editors }) {
  const touched = new Set();
  const covered = (map, name) => (Array.isArray(map[name]?.pages) ? map[name].pages : []);

  for (const file of files) {
    const folder = /^handsontable\/src\/(plugins|editors)\/([^/]+)\//.exec(file);

    if (folder) {
      covered(folder[1] === 'plugins' ? plugins : editors, folder[2]).forEach(id => touched.add(id));
    } else if (/^handsontable\/src\//.test(file) || /^tests\/(a11y|lib)\//.test(file)) {
      return 'all';
    } else if (file.startsWith('tests/fixtures/demo/')) {
      pages.filter(page => file === `tests/fixtures/demo/${page.fixture}`).forEach(page => touched.add(page.id));
    }
  }

  return touched;
}

/**
 * The pull request's ledger input of the evidence check run (`buildEvidenceCheckRun()`): a classifier that gives a
 * finding its ledger class and says whether its page is one the pull request did not change.
 *
 * @param {object} input The input.
 * @param {{statuses: Map<string, string>, auditAt: string|null}} input.index The index (`ledgerIndex()`).
 * @param {Set<string>|'all'|null} input.touched The pages the pull request touches (`pagesTouched()`), or `null` when
 * its changed files are unknown.
 * @param {string} [input.source] The finding source.
 * @returns {{classify: (check: string, finding: object) => {ledger: string, untouched: boolean}, auditAt: string|null, filesRead: boolean}} The input.
 */
export function prLedgerOf({ index, touched, source = 'checks' }) {
  return {
    auditAt: index.auditAt,
    filesRead: touched !== null && touched !== undefined,
    classify: (check, finding) => ({
      ledger: ledgerClass(index, source, check, finding),
      untouched: touched instanceof Set && !touched.has(finding.page),
    }),
  };
}
