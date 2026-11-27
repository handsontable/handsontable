/**
 * New and known: the findings ledger as the baseline of a pull request's checks and of an audit's verdict.
 *
 * The findings ledger (`test-health/a11y.json` on `gh-pages`, written by `.github/scripts/lib/a11y-ledger.mjs` from the
 * audits) keeps one row per finding across audits. A finding is looked up there by the key the ledger gives its row
 * (`ledgerKey()`), for every row source: the checks beyond axe of the product and of the two sites, the three axe scans,
 * and the screen reader lanes.
 *
 * On a pull request (`ledgerClass()`, `prLedgerOf()`) the short suite of the checks beyond axe reads it, because every
 * page of the catalog carries findings the weekly audit already knows, and counted as they stand those would turn every
 * pull request's check runs red:
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
 * On an audit (`auditClass()`, `auditLedgerOf()`) every check run reads the ledger as the audit before left it: the
 * ledger is written after an audit run ends, so while the run posts its check runs it still holds the state before it.
 * Known debt is a warning at most, a regression and a new finding count, and a new finding on a target the latest audit
 * of its source did not measure (`ledgerMeasured()`, the ledger's own `nightMeasured()`) is **unmeasured**, a warning at
 * most. So the weekly audit turns red on what changed since the audit before and on a run that could not measure, never
 * on the debt that stands. A re-run of an audit after the ledger recorded its earlier attempt reads that attempt's rows
 * as they were before the run, so a re-run never reads its own findings as known.
 *
 * Pure but for `sharedSourceFolders()`, which reads the source tree. This module reaches `tests/a11y/` through
 * `a11y-issues.mjs` (`maskSelector()`, `catalogFinding()`), so `a11y-evidence.mjs` and `a11y-check-run.mjs`, which the
 * sparse verdict jobs load, must never import it: the scripts build the classifier here (`prLedgerOf()`,
 * `auditLedgerOf()`) and pass it in.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { READER_GOLDEN_DIFFERS, catalogFinding, maskSelector } from './a11y-issues.mjs';

export { LEDGER_URL } from './a11y-docs-drift.mjs';
// The longest element the ledger keeps (`A11Y_LIMITS.where` of `.github/scripts/lib/a11y-ledger.mjs`).
const WHERE_LIMIT = 300;
/**
 * The night each row source is recorded in (`SOURCE_OF_NIGHT` of `.github/scripts/lib/a11y-ledger.mjs`): the A11y
 * nightly's checks and axe scan, the screen reader nightly's lanes, and each site's scan and checks. A copy, because
 * tests/lib cannot import that module; `.github/scripts/__tests__/a11y-pr-ledger.test.mjs` holds the two equal.
 */
export const NIGHT_OF_SOURCE = Object.freeze({
  checks: 'a11y', axe: 'a11y', reader: 'reader', docs: 'docs', 'docs-checks': 'docs', website: 'website', 'website-checks': 'website',
});
// The sources whose findings are an axe scan's comparison items, and the ones that are a check's evidence findings.
const SCAN_SOURCES = ['axe', 'docs', 'website'];
const CHECK_SOURCES = ['checks', 'docs-checks', 'website-checks'];

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
 * The key the ledger gives a finding: its source, check, kind, rule, cause, page, theme, state, variant and where. The
 * ledger's `findingKey()` of the same finding gives the same string, and `.github/scripts/__tests__/a11y-pr-ledger.test.mjs`
 * holds the two together for every source.
 *
 * A finding is what the source's check run holds: a check's evidence finding (`checks`, `docs-checks`,
 * `website-checks`: the masked selector, the step or both), an axe scan's comparison item (`axe`, `docs`, `website`:
 * `{rule, page, theme, target}`, the masked target, under the scan's own check), or a screen reader step
 * (`reader`, with the project as the check: `{scenario, step, kind}`).
 *
 * @param {string} source The row source (`NIGHT_OF_SOURCE`).
 * @param {string} check The check id, or the reader project.
 * @param {object} finding The finding.
 * @returns {string} The key.
 */
export function ledgerKey(source, check, finding) {
  if (!Object.hasOwn(NIGHT_OF_SOURCE, source)) {
    throw new Error(`"${source}" is not a row source of the findings ledger; expected one of ${Object.keys(NIGHT_OF_SOURCE).join(', ')}`);
  }
  if (!CHECK_SOURCES.includes(source)) {
    // The catalog reads a scan's item and a reader step the way the ledger does (`catalogFinding()`): the scan's own
    // check, the axe kind and the masked target; or the scenario as the page and the step as where.
    const row = catalogFinding(source, check, finding);

    return [row.source, row.check, row.kind, row.rule ?? '', '', row.page, row.theme ?? '', '', '', cut(row.where, WHERE_LIMIT)].join('|');
  }

  const selector = typeof finding.selector === 'string' ? maskSelector(finding.selector) : null;
  const step = typeof finding.step === 'string' ? cut(finding.step, WHERE_LIMIT) : null;
  const where = cut(selector !== null && step !== null ? `${selector} @ ${step}` : (selector ?? step), WHERE_LIMIT);

  return [source, check, finding.kind, finding.rule ?? '', finding.cause ?? '', finding.page, finding.theme ?? '', finding.state ?? '',
    finding.variant ?? '', where].join('|');
}

/**
 * The ledger's rows of one source, by key, and the latest audit of the source's night: when and by which run it was
 * recorded, and what it measured (the coverage the ledger keeps on the latest night of each source only).
 *
 * @param {unknown} ledger The parsed `a11y.json`.
 * @param {string} [source] The row source.
 * @returns {{statuses: Map<string, string>, rows: Map<string, object>, auditAt: string|null, auditRun: string|null, coverage: object|null}} The index.
 */
export function ledgerIndex(ledger, source = 'checks') {
  if (!Array.isArray(ledger?.rows)) {
    throw new Error('the ledger has no rows list');
  }

  const statuses = new Map();
  const rows = new Map();

  for (const row of ledger.rows) {
    if (row?.source === source && typeof row.key === 'string') {
      statuses.set(row.key, row.status);
      rows.set(row.key, { status: row.status, firstRun: row.firstRun ?? null, lastRun: row.lastRun ?? null, gaps: row.gaps ?? 0,
        seenSinceGap: row.seenSinceGap ?? 0, resolvedAt: row.resolvedAt ?? null });
    }
  }

  const night = NIGHT_OF_SOURCE[source] ?? 'a11y';
  const latest = ledger.latest?.[night] ?? null;
  const record = Array.isArray(ledger.nights) && latest
    ? ledger.nights.find(entry => entry?.source === night && entry.runId === latest.runId) ?? null
    : null;
  const coverage = record?.coverage !== null && typeof record?.coverage === 'object' ? record.coverage : null;

  return { statuses, rows, auditAt: latest?.seenAt ?? null, auditRun: latest?.runId ?? null, coverage };
}

/**
 * Whether a finding is known, a regression or new, by its ledger row: the pull request's reading.
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
 * Whether the latest audit of a finding's source measured its target, the way the ledger's `nightMeasured()` reads the
 * night's coverage: a check's target (page, theme, variant) measured with every step taken, an axe scan that was
 * complete, a reader scenario's transcript read whole on its project (compared with a golden, for a golden difference).
 * `.github/scripts/__tests__/a11y-pr-ledger.test.mjs` holds the two together.
 *
 * @param {{coverage: object|null}} index The index (`ledgerIndex()`).
 * @param {string} source The finding source.
 * @param {string} check The check id, or the reader project.
 * @param {object} finding The finding, as `ledgerKey()` takes it.
 * @returns {boolean|null} The verdict, or `null` when the ledger keeps no coverage for the source's latest night.
 */
export function ledgerMeasured(index, source, check, finding) {
  const coverage = index.coverage;

  if (coverage === null || coverage === undefined) {
    return null;
  }
  if (CHECK_SOURCES.includes(source)) {
    const targets = coverage.checks !== null && typeof coverage.checks === 'object' && Object.hasOwn(coverage.checks, check)
      ? coverage.checks[check]
      : [];

    return Array.isArray(targets) && targets.includes([finding.page, finding.theme, finding.variant ?? ''].join('|'));
  }
  if (SCAN_SOURCES.includes(source)) {
    return coverage.axe === true;
  }

  const row = catalogFinding(source, check, finding);
  const pairs = row.kind === READER_GOLDEN_DIFFERS ? coverage.golden : coverage.reader;

  return Array.isArray(pairs) && pairs.includes(`${check}|${row.page}`);
}

/**
 * How a finding of an audit reads against the ledger as the audit before left it:
 *
 * - **known**: its row is open. Known debt, a warning at most.
 * - **regression**: its row is resolved. It counts.
 * - **new**: it has no row, on a target the latest audit measured (or the ledger does not say). It counts.
 * - **unmeasured**: it has no row, on a target the latest audit did not measure (a page, a check, a variant or a
 *   scenario added since, or one that had a tooling problem). A warning at most: nothing was seen to work there.
 *
 * A row this run itself left (an earlier attempt of the run, recorded before a re-run of its failed jobs) is read as it
 * was before the run: one it first saw is new, one that came back on it a regression (the ledger's own test for a row
 * that returned on a night), one it resolved known (the ledger resolves only an open row, and gives it the night's time
 * as `resolvedAt`, so an attempt that missed a flaky finding does not make it a regression on the re-run), any other
 * known. A finding with no row on such a re-run is new, because the latest night's coverage is then the run's own and
 * says nothing about the audit before.
 *
 * @param {{rows: Map<string, object>, auditAt: string|null, auditRun: string|null, coverage: object|null}} index The index
 * (`ledgerIndex()`).
 * @param {string} source The finding source.
 * @param {string} check The check id, or the reader project.
 * @param {object} finding The finding, as `ledgerKey()` takes it.
 * @param {string|null} [runId] This run's id (`GITHUB_RUN_ID`), or `null` when unknown.
 * @returns {'known'|'regression'|'new'|'unmeasured'} The class.
 */
export function auditClass(index, source, check, finding, runId = null) {
  const row = index.rows.get(ledgerKey(source, check, finding));
  const thisRun = runId === null || runId === undefined || String(runId) === '' ? null : String(runId);

  if (row !== undefined && thisRun !== null && String(row.lastRun) === thisRun) {
    if (String(row.firstRun) === thisRun) {
      return 'new';
    }

    return row.gaps > 0 && row.seenSinceGap === 1 ? 'regression' : 'known';
  }

  const ownNight = thisRun !== null && String(index.auditRun) === thisRun;

  if (row !== undefined) {
    const resolvedByThisRun = ownNight && row.status === 'resolved' && row.resolvedAt !== null && row.resolvedAt === index.auditAt;

    return row.status === 'resolved' && !resolvedByThisRun ? 'regression' : 'known';
  }
  if (ownNight) {
    return 'new';
  }

  return ledgerMeasured(index, source, check, finding) === false ? 'unmeasured' : 'new';
}

/**
 * The audit's ledger input of a check run (`buildEvidenceCheckRun()`, `buildCheckRun()`, `buildReport()`): a classifier
 * that gives a finding its ledger class against the ledger as the audit before left it, and when and by which run that
 * audit was recorded.
 *
 * @param {object} input The input.
 * @param {object} input.index The index of the source's rows (`ledgerIndex()`).
 * @param {string} input.source The row source.
 * @param {string|null} [input.runId] This run's id (`GITHUB_RUN_ID`).
 * @returns {{classify: (check: string, finding: object) => {ledger: string}, auditAt: string|null, auditRun: string|null}} The input.
 */
export function auditLedgerOf({ index, source, runId = null }) {
  return {
    auditAt: index.auditAt,
    auditRun: index.auditRun,
    classify: (check, finding) => ({ ledger: auditClass(index, source, check, finding, runId) }),
  };
}

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
