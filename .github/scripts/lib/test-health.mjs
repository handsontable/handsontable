/**
 * The cross-run flake ledger: the pure half.
 *
 * Every red `Tests` or `Develop` run leaves two kinds of evidence behind as
 * artifacts: the Playwright JSON report of each failed leg (`playwright-report-*`,
 * which names every test that was flaky or failed) and the Puppeteer runner's
 * failed-specs record (`puppeteer-failed-specs-*`, one entry per failed Jasmine
 * spec with its file and its isolation verdict). Nothing used to aggregate them
 * across runs, so every flake was rediscovered from scratch and recurrence
 * stayed anecdotal.
 *
 * These helpers turn those artifacts into ledger entries, merge them into the
 * ledger that lives on `gh-pages` (`test-health/ledger.json`), prune it, and
 * aggregate it per test into the summary the page renders: how often a test
 * flaked in the last 7 and 30 days, on which legs, when it was last seen, and
 * whether it has crossed the "needs a ticket" line the flakiness playbook draws
 * at two recurrences in distinct runs.
 *
 * No I/O in here. `scripts/test-health-collect.mjs` reads the artifacts and
 * writes the files; `.github/workflows/test-health.yml` runs it.
 */

export const LEDGER_VERSION = 1;

/**
 * How long an entry stays in the ledger. A flake not seen for this long has
 * either been fixed or migrated; keeping it would only grow the file.
 */
export const RETENTION_DAYS = 90;

/**
 * The playbook's line: a test that flaked in this many DISTINCT runs within the
 * long window gets a migration or fix ticket. Two failures in one run (the two
 * `-min` legs, say) are one recurrence, not two.
 */
export const TICKET_THRESHOLD_RUNS = 2;

export const SHORT_WINDOW_DAYS = 7;
export const LONG_WINDOW_DAYS = 30;

/**
 * Where the Playwright JSON reporter writes inside the `tests` package, and so
 * where it sits inside a `playwright-report-*` artifact (the upload strips the
 * common `tests/` prefix). `tests/playwright.config.ts` and `e2e.yml` agree on
 * this path, and `__tests__/test-health.test.mjs` asserts that they do.
 */
export const PLAYWRIGHT_JSON_REPORT = 'test-results/report.json';

export const PLAYWRIGHT_ARTIFACT_PREFIX = 'playwright-report-';
export const JASMINE_ARTIFACT_PREFIX = 'puppeteer-failed-specs-';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {object} RunContext
 * @property {string} runId The workflow run id.
 * @property {number} runAttempt The attempt of that run the evidence came from.
 * @property {string} runUrl The attempt's page on GitHub.
 * @property {string} workflow The workflow name (`Tests`, `Develop`).
 * @property {string} branch The head branch.
 * @property {string} headSha The head commit.
 * @property {string} event What started the run (`pull_request`, `push`).
 * @property {string} seenAt When the run completed, ISO 8601.
 */

/**
 * @typedef {object} Entry
 * @property {'playwright'|'jasmine'} tier Which suite the test belongs to.
 * @property {string} leg The Playwright project (`e2e-classic-min`) or the Jasmine leg (`UMD (theme: main)`).
 * @property {string|null} file The spec file, relative to its package.
 * @property {number|null} line The test's line, when the report has it.
 * @property {string} title The test's full title path.
 * @property {'flaky'|'failed'} status `flaky` passed on retry; `failed` did not.
 * @property {number} attempts How many times the test ran in that leg.
 * @property {string|null} error The first line of the first failure message.
 * @property {string|null} isolation The Jasmine isolation verdict, when probed.
 * @property {string|null} quarantine The Playwright quarantine entry (`DEV-1234 until 2026-10-08 — why`), when the
 * test carries one (`tests/fixtures/quarantine.ts`).
 * @property {'ci'|'seed'} source `ci` for a collected artifact, `seed` for a hand-recorded entry.
 * @property {string} [note] Free text on a seed entry.
 */

/**
 * The run fields the ledger keeps, from a `workflow_run` payload or the
 * `GET /repos/{owner}/{repo}/actions/runs/{run_id}` response (same shape).
 *
 * @param {object} run The run object.
 * @returns {RunContext} The context every entry of this run carries.
 */
export function runContextFromRun(run) {
  const runAttempt = Number(run.run_attempt ?? 1);
  const baseUrl = String(run.html_url ?? '');

  return {
    runId: String(run.id),
    runAttempt,
    runUrl: runAttempt > 1 && baseUrl ? `${baseUrl}/attempts/${runAttempt}` : baseUrl,
    workflow: String(run.name ?? ''),
    branch: String(run.head_branch ?? ''),
    headSha: String(run.head_sha ?? ''),
    event: String(run.event ?? ''),
    seenAt: String(run.updated_at ?? run.run_started_at ?? run.created_at ?? ''),
  };
}

/**
 * Which kind of evidence an artifact holds, by its name.
 *
 * @param {string} name The artifact name.
 * @returns {'playwright'|'jasmine'|null} The tier, or `null` for an unrelated artifact.
 */
export function classifyArtifact(name) {
  if (name.startsWith(PLAYWRIGHT_ARTIFACT_PREFIX)) {
    return 'playwright';
  }
  if (name.startsWith(JASMINE_ARTIFACT_PREFIX)) {
    return 'jasmine';
  }

  return null;
}

/**
 * The first line of a failure message, trimmed to a length the page can show.
 *
 * @param {string|null|undefined} message The message.
 * @returns {string|null} The first line, or `null` for no message.
 */
function firstLine(message) {
  if (!message) {
    return null;
  }
  // Strip ANSI colour codes: Playwright's messages carry them.
  // eslint-disable-next-line no-control-regex
  const plain = String(message).replace(/\[[0-9;]*m/g, '');
  const line = plain.split('\n').find(part => part.trim() !== '') ?? '';

  return line.length > 300 ? `${line.slice(0, 297)}...` : line;
}

/**
 * The first error message among a Playwright test's results.
 *
 * @param {Array<{error?: {message?: string}, errors?: Array<{message?: string}>}>} results The results.
 * @returns {string|null} The first line of the first message, or `null`.
 */
function firstPlaywrightError(results) {
  for (const result of results) {
    const message = result.error?.message ?? result.errors?.[0]?.message;

    if (message) {
      return firstLine(message);
    }
  }

  return null;
}

/**
 * The quarantine annotation text of a Playwright test, when it carries one.
 *
 * @param {Array<{type: string, description?: string}>|undefined} annotations The test's annotations.
 * @returns {string|null} The description, or `null`.
 */
function quarantineOf(annotations) {
  const annotation = (annotations ?? []).find(candidate => candidate.type === 'quarantine');

  return annotation?.description ?? null;
}

/**
 * Entries for every flaky or failed test in a Playwright JSON report.
 *
 * The report nests suites: a file-level suite (whose title IS the file path)
 * holds the `describe` suites, which hold the specs; a spec holds one test per
 * project. `test.status` is Playwright's outcome: `expected`, `unexpected`,
 * `flaky` or `skipped`. `flaky` means the test failed and then passed on retry;
 * with `failOnFlakyTests` on, that is what makes a CI leg red — unless the test
 * is quarantined (`tests/fixtures/quarantine.ts`), in which case the leg stays
 * green and the entry says so.
 *
 * @param {object} report The parsed `report.json`.
 * @param {RunContext} run The run the report came from.
 * @returns {Entry[]} The entries, in report order.
 */
export function parsePlaywrightReport(report, run) {
  const entries = [];

  const walk = (suite, titles) => {
    const path = suite.title && suite.title !== suite.file ? [...titles, suite.title] : titles;

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status !== 'flaky' && test.status !== 'unexpected') {
          continue;
        }

        entries.push({
          tier: 'playwright',
          leg: String(test.projectName ?? ''),
          file: spec.file ?? suite.file ?? null,
          line: typeof spec.line === 'number' && spec.line > 0 ? spec.line : null,
          title: [...path, spec.title].join(' › '),
          status: test.status === 'flaky' ? 'flaky' : 'failed',
          attempts: (test.results ?? []).length,
          error: firstPlaywrightError(test.results ?? []),
          isolation: null,
          quarantine: quarantineOf(test.annotations),
          source: 'ci',
          ...run,
        });
      }
    }

    for (const child of suite.suites ?? []) {
      walk(child, path);
    }
  };

  for (const suite of report.suites ?? []) {
    walk(suite, []);
  }

  return entries;
}

/**
 * Entries for every failed spec in a Puppeteer runner record
 * (`handsontable/test/scripts/lib/failed-specs.mjs`, `toRecord()`).
 *
 * @param {object} record The parsed `failed-specs-<runId>.json`.
 * @param {RunContext} run The run the record came from.
 * @returns {Entry[]} The entries, in record order.
 */
export function parseJasmineRecord(record, run) {
  return (record.failed ?? []).map(spec => ({
    tier: 'jasmine',
    leg: String(record.leg ?? ''),
    file: spec.filePath ?? null,
    line: null,
    title: String(spec.fullName ?? spec.description ?? ''),
    status: 'failed',
    attempts: 1,
    error: firstLine(spec.messages?.[0]),
    isolation: spec.isolation ?? null,
    quarantine: null,
    source: 'ci',
    ...run,
  }));
}

/**
 * Entries from every relevant file of a run's downloaded artifacts. Files that
 * do not parse are reported as notes and skipped: a broken report must never
 * stop the rest of the run from being recorded.
 *
 * @param {Array<{artifact: string, path: string, text: string}>} files Each file with the artifact it came from
 * and its path inside that artifact.
 * @param {RunContext} run The run the artifacts belong to.
 * @returns {{entries: Entry[], notes: string[]}} The entries and one note per skipped file or empty artifact.
 */
export function collectArtifactFiles(files, run) {
  const entries = [];
  const notes = [];
  const seenArtifacts = new Set(files.map(file => file.artifact));

  for (const file of files) {
    const tier = classifyArtifact(file.artifact);
    const isReport = tier === 'playwright' && file.path.endsWith(PLAYWRIGHT_JSON_REPORT);
    const isRecord = tier === 'jasmine' && /(^|\/)failed-specs-[^/]*\.json$/.test(file.path);

    if (!isReport && !isRecord) {
      continue;
    }

    let parsed;

    try {
      parsed = JSON.parse(file.text);
    } catch (error) {
      notes.push(`${file.artifact}/${file.path}: not valid JSON (${error.message}), skipped`);
      continue;
    }

    entries.push(...(isReport ? parsePlaywrightReport(parsed, run) : parseJasmineRecord(parsed, run)));
  }

  for (const artifact of seenArtifacts) {
    if (classifyArtifact(artifact) === 'playwright'
      && !files.some(file => file.artifact === artifact && file.path.endsWith(PLAYWRIGHT_JSON_REPORT))) {
      notes.push(`${artifact}: no ${PLAYWRIGHT_JSON_REPORT} in the artifact `
        + '(a report from before the JSON reporter was configured), nothing recorded');
    }
  }

  return { entries, notes };
}

/**
 * What identifies a test across runs.
 *
 * @param {Entry} entry The entry.
 * @returns {string} The key.
 */
export function testKey(entry) {
  return `${entry.tier}|${entry.file ?? ''}|${entry.title}`;
}

/**
 * What identifies one observation: a test, on a leg, in one attempt of one
 * run. Collecting the same attempt twice therefore replaces rather than
 * duplicates.
 *
 * @param {Entry} entry The entry.
 * @returns {string} The key.
 */
export function entryKey(entry) {
  return `${testKey(entry)}|${entry.leg}|${entry.runId}|${entry.runAttempt}`;
}

/**
 * The empty ledger.
 *
 * @returns {{version: number, updatedAt: string|null, retentionDays: number, entries: Entry[]}} The ledger.
 */
export function emptyLedger() {
  return { version: LEDGER_VERSION, updatedAt: null, retentionDays: RETENTION_DAYS, entries: [] };
}

/**
 * Merge new entries into a ledger: de-duplicate by `entryKey` (the newer copy
 * wins), drop everything older than the retention window, sort newest first.
 *
 * @param {object|null} ledger The ledger as read from `gh-pages`, or `null`.
 * @param {Entry[]} entries The entries to add.
 * @param {object} options Options.
 * @param {Date} options.now The current time.
 * @param {number} [options.retentionDays] Override of `RETENTION_DAYS`.
 * `updatedAt` moves only when the set of entries changed. The collector runs
 * after every completed run, and a run that adds nothing must leave the
 * published files byte-identical, or every run would commit a timestamp.
 *
 * @returns {{ledger: object, added: Entry[], pruned: number, changed: boolean}} The merged ledger, the
 * entries that were new to it, how many fell out of the window, and whether anything changed.
 */
export function mergeLedger(ledger, entries, { now, retentionDays = RETENTION_DAYS }) {
  const cutoff = now.getTime() - (retentionDays * DAY_MS);
  const byKey = new Map();

  for (const entry of ledger?.entries ?? []) {
    byKey.set(entryKey(entry), entry);
  }

  const added = [];

  for (const entry of entries) {
    const key = entryKey(entry);

    if (!byKey.has(key)) {
      added.push(entry);
    }
    byKey.set(key, entry);
  }

  const all = [...byKey.values()];
  const kept = all
    .filter(entry => Date.parse(entry.seenAt) >= cutoff)
    .sort((a, b) => Date.parse(b.seenAt) - Date.parse(a.seenAt) || testKey(a).localeCompare(testKey(b)));
  const pruned = all.length - kept.length;
  const changed = ledger === null || added.length > 0 || pruned > 0;

  return {
    ledger: {
      version: LEDGER_VERSION,
      updatedAt: changed ? now.toISOString() : ledger.updatedAt ?? now.toISOString(),
      retentionDays,
      entries: kept,
    },
    added,
    pruned,
    changed,
  };
}

/**
 * The per-test summary the page renders: counts over the short and the long
 * window, distinct runs over the long window, legs hit, last sighting, and the
 * "needs ticket" verdict.
 *
 * @param {object} ledger The ledger.
 * @param {object} options Options.
 * @param {Date} options.now The current time.
 * @param {number} [options.ticketThresholdRuns] Override of `TICKET_THRESHOLD_RUNS`.
 * @returns {object} The summary.
 */
export function aggregate(ledger, { now, ticketThresholdRuns = TICKET_THRESHOLD_RUNS }) {
  const shortCutoff = now.getTime() - (SHORT_WINDOW_DAYS * DAY_MS);
  const longCutoff = now.getTime() - (LONG_WINDOW_DAYS * DAY_MS);
  const groups = new Map();

  for (const entry of ledger.entries ?? []) {
    const key = testKey(entry);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(entry);
  }

  const rows = [...groups.entries()].map(([key, entries]) => {
    const sorted = [...entries].sort((a, b) => Date.parse(b.seenAt) - Date.parse(a.seenAt));
    const inLong = sorted.filter(entry => Date.parse(entry.seenAt) >= longCutoff);
    const inShort = inLong.filter(entry => Date.parse(entry.seenAt) >= shortCutoff);
    const runs30 = new Set(inLong.map(entry => entry.runId)).size;
    const last = sorted[0];

    return {
      key,
      tier: last.tier,
      file: last.file,
      line: last.line ?? null,
      title: last.title,
      count7: inShort.length,
      count30: inLong.length,
      countAll: sorted.length,
      runs30,
      legs: [...new Set(sorted.map(entry => entry.leg))].sort(),
      statuses: [...new Set(sorted.map(entry => entry.status))].sort(),
      isolation: [...new Set(sorted.map(entry => entry.isolation).filter(Boolean))].sort(),
      quarantine: last.quarantine ?? null,
      lastSeen: {
        seenAt: last.seenAt,
        runUrl: last.runUrl,
        branch: last.branch,
        leg: last.leg,
        status: last.status,
        error: last.error ?? null,
        source: last.source,
      },
      needsTicket: runs30 >= ticketThresholdRuns,
    };
  });

  rows.sort((a, b) => Number(b.needsTicket) - Number(a.needsTicket)
    || b.count30 - a.count30
    || Date.parse(b.lastSeen.seenAt) - Date.parse(a.lastSeen.seenAt)
    || a.key.localeCompare(b.key));

  return {
    version: LEDGER_VERSION,
    // The ledger's own change time, so an unchanged ledger renders identically.
    generatedAt: ledger.updatedAt ?? now.toISOString(),
    windows: { shortDays: SHORT_WINDOW_DAYS, longDays: LONG_WINDOW_DAYS },
    ticketThresholdRuns,
    retentionDays: ledger.retentionDays ?? RETENTION_DAYS,
    totals: {
      tests: rows.length,
      needsTicket: rows.filter(row => row.needsTicket).length,
      quarantined: rows.filter(row => row.quarantine).length,
      entries: (ledger.entries ?? []).length,
    },
    rows,
  };
}

/**
 * The Markdown block for the collecting job's step summary: what this run
 * added, which tests now need a ticket, and where the page is.
 *
 * @param {object} input What happened.
 * @param {RunContext} input.run The run that was collected.
 * @param {Entry[]} input.added The entries new to the ledger.
 * @param {string[]} input.notes Notes from the collection (skipped files, empty artifacts).
 * @param {object} input.summary The aggregate.
 * @param {string} input.pageUrl Where the page is published.
 * @returns {string} The Markdown.
 */
export function renderStepSummary({ run, added, notes, summary, pageUrl }) {
  const lines = [`## Test health — run ${run.runId} (attempt ${run.runAttempt}, \`${run.branch}\`)`, ''];

  if (added.length === 0) {
    lines.push('Nothing new to record: no flaky or failed test in the artifacts this run left behind.');
  } else {
    lines.push(`Recorded ${added.length} new observation(s):`, '');

    for (const entry of added) {
      const where = entry.file ? ` (\`${entry.file}${entry.line ? `:${entry.line}` : ''}\`)` : '';
      const isolation = entry.isolation ? `, in isolation: ${entry.isolation}` : '';
      const quarantine = entry.quarantine ? `, quarantined (${entry.quarantine})` : '';

      lines.push(`- **${entry.status}** on \`${entry.leg}\`: ${entry.title}${where}${isolation}${quarantine}`);
    }
  }

  const needTicket = summary.rows.filter(row => row.needsTicket);

  if (needTicket.length > 0) {
    lines.push('', `${needTicket.length} test(s) have flaked in ${summary.ticketThresholdRuns}+ distinct runs `
      + `in the last ${summary.windows.longDays} days and need a fix or migration ticket:`, '');

    for (const row of needTicket) {
      lines.push(`- ${row.title} (\`${row.file ?? '?'}\`) — ${row.runs30} runs, legs: ${row.legs.join(', ')}`);
    }
  }

  if (notes.length > 0) {
    lines.push('', 'Notes:', '', ...notes.map(note => `- ${note}`));
  }

  lines.push('', `Ledger: ${pageUrl}`);

  return `${lines.join('\n')}\n`;
}

/**
 * The published page, from the template with the summary inlined. Inlining
 * keeps the page self-contained (it renders from a file as well as from
 * GitHub Pages) and spares it a fetch that a viewer's blocker could stop.
 *
 * @param {string} template The template with `__SUMMARY_JSON__` and `__GENERATED_AT__` placeholders.
 * @param {object} summary The aggregate.
 * @returns {string} The HTML.
 */
export function renderPage(template, summary) {
  // `</script>` inside a JSON string would end the script element early.
  const json = JSON.stringify(summary).replace(/<\//g, '<\\/');

  return template
    .replace('__SUMMARY_JSON__', () => json)
    .replace(/__GENERATED_AT__/g, summary.generatedAt);
}
