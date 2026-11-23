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
 * known finding read as new. A new finding on a catalog page whose sources the pull request does not touch
 * (`pagesTouched()`) is therefore marked as on a page it did not change, and counts as a warning at most. A regression
 * is never marked: a resolved row is the audit's own evidence that the finding was gone. Every doubt goes toward
 * counting: a page outside the catalog, a change to shared code and an unread file list mark nothing.
 *
 * Pure but for `sharedSourceFolders()`, which reads the source tree. This module reaches `tests/a11y/` through
 * `a11y-issues.mjs` (`maskSelector()`), so `a11y-evidence.mjs`, which the sparse verdict jobs load, must never import
 * it: the report script builds the classifier here (`prLedgerOf()`) and passes it in.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
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

// The checks' own code: a change here can move any finding, so it touches every page.
const CHECK_TOOLING = /^tests\/(?:a11y|lib|reporters|support)\/|^tests\/playwright[^/]*\.config\.ts$|^tests\/package\.json$/;

/**
 * The catalog pages whose sources a pull request's changed files touch, or every page when a change reaches all of
 * them. A page's sources are its fixture under `tests/fixtures/demo/` and the plugin and editor folders the coverage
 * map lists it under. Every page is touched by shared code: any other `handsontable/src/` file, a plugin or editor
 * folder with no `pages` in the coverage map (no entry, `none` or `gap`), and one another folder of its kind imports
 * (`shared`: `baseEditor`, `textEditor`, `dropdownMenu` under `filters`); by the checks' own code; and by any fixture
 * file that is not a page's `.html` (a shared script or stylesheet). This is a hint for the report, not a scope: the run
 * measures every page.
 *
 * @param {string[]} files The changed paths, from the repository root.
 * @param {object} input What the pages are made of.
 * @param {Array<{id: string, fixture: string}>} input.pages The catalog (`A11Y_PAGES`).
 * @param {Record<string, object>} input.plugins `PLUGIN_COVERAGE` of `tests/a11y/coverage.mjs`.
 * @param {Record<string, object>} input.editors `EDITOR_COVERAGE`.
 * @param {{plugins: Set<string>, editors: Set<string>}} [input.shared] The folders another folder of their kind imports
 * (`sharedSourceFolders()`).
 * @returns {Set<string>|'all'} The page ids touched.
 */
export function pagesTouched(files, { pages, plugins, editors, shared = { plugins: new Set(), editors: new Set() } }) {
  const touched = new Set();

  for (const file of files) {
    const folder = /^handsontable\/src\/(plugins|editors)\/([^/]+)\//.exec(file);

    if (folder) {
      const [, kind, name] = folder;
      const covered = (kind === 'plugins' ? plugins : editors)[name]?.pages;

      if (!Array.isArray(covered) || shared[kind].has(name)) {
        return 'all';
      }
      covered.forEach(id => touched.add(id));
    } else if (/^handsontable\/src\//.test(file) || CHECK_TOOLING.test(file)) {
      return 'all';
    } else if (file.startsWith('tests/fixtures/')) {
      if (!/^tests\/fixtures\/demo\/[^/]+\.html$/.test(file)) {
        return 'all';
      }
      pages.filter(page => file === `tests/fixtures/demo/${page.fixture}`).forEach(page => touched.add(page.id));
    }
  }

  return touched;
}

/**
 * The plugin and editor folders that another folder of their kind imports from (`baseEditor` and `textEditor`, which
 * twelve editors extend; `filters`, which `dataProvider` reads), read from the source tree, so a new subclass needs no
 * list to follow it. A test file is not an importer.
 *
 * @param {string} srcRoot The `handsontable/src` folder.
 * @returns {{plugins: Set<string>, editors: Set<string>}} The shared folders.
 */
export function sharedSourceFolders(srcRoot) {
  const shared = { plugins: new Set(), editors: new Set() };
  const sources = dir => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sources(file);
    }

    return /\.(?:ts|js|mjs)$/.test(entry.name) && !/\.(?:unit|spec|types)\./.test(entry.name) ? [file] : [];
  });

  for (const kind of ['plugins', 'editors']) {
    const root = path.join(srcRoot, kind);
    const folders = readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name !== '__tests__')
      .map(entry => entry.name);

    for (const folder of folders) {
      for (const file of sources(path.join(root, folder))) {
        for (const [, specifier] of readFileSync(file, 'utf8').matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
          const [top] = path.relative(root, path.resolve(path.dirname(file), specifier)).split(path.sep);

          if (top !== folder && folders.includes(top)) {
            shared[kind].add(top);
          }
        }
      }
    }
  }

  return shared;
}

/**
 * The pull request's ledger input of the evidence check run (`buildEvidenceCheckRun()`): a classifier that gives a
 * finding its ledger class and says whether its page is one the pull request did not change.
 *
 * @param {object} input The input.
 * @param {{statuses: Map<string, string>, auditAt: string|null}} input.index The index (`ledgerIndex()`).
 * @param {Set<string>|'all'|null} input.touched The pages the pull request touches (`pagesTouched()`), or `null` when
 * its changed files are unknown.
 * @param {Set<string>} [input.catalog] The ids of the catalog pages (`A11Y_PAGES`): only these can be marked, because
 * `pagesTouched()` knows the sources of no other page (the pointer check's drag pages, the keyboard walker's shortcut
 * page). Without it, nothing is marked.
 * @param {string} [input.source] The finding source.
 * @returns {{classify: (check: string, finding: object) => {ledger: string, untouched: boolean}, auditAt: string|null, filesRead: boolean}} The input.
 */
export function prLedgerOf({ index, touched, catalog = new Set(), source = 'checks' }) {
  return {
    auditAt: index.auditAt,
    filesRead: touched !== null && touched !== undefined,
    classify: (check, finding) => {
      const ledger = ledgerClass(index, source, check, finding);

      // Only a new finding can be the ledger's staleness; a regression always counts.
      return { ledger, untouched: ledger === 'new' && touched instanceof Set && catalog.has(finding.page) && !touched.has(finding.page) };
    },
  };
}
