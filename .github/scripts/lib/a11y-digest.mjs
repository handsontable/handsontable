/**
 * The accessibility digest: the pure half.
 *
 * The findings ledger (`./a11y-ledger.mjs`, `test-health/a11y.json` on `gh-pages`) says what is open, and its page
 * says how the findings fared over time. Nothing told anyone when that changed. The digest compares two states of the
 * ledger, the published file now and the one published a week before, and says what improved (findings resolved,
 * fix tasks cleared), what declined (new findings, findings that came back, fix tasks with findings again), how long
 * the triage queue is, and what is outstanding per surface, with the page's own headline numbers.
 *
 * The rules that keep it honest:
 *
 * - It names what it compares: the latest night of each workflow in both states. A workflow with no new night was not
 *   audited in the window, and its rows are left out of improved and declined: nothing measured them. The digest never
 *   assumes the week's audit finished.
 * - A new finding is a decline only when the earlier state had measured its target and found nothing there. A finding
 *   on a target nothing had measured (a workflow's first night, a new check, scenario or page, a target that had a
 *   tooling problem then) is newly measured: a baseline. The earlier state's latest night of each workflow keeps its
 *   coverage, which is what says so; where it does not say, the finding counts as a decline, so nothing is hidden.
 * - Both states are read with the catalog as it is today, so a cluster renamed or split between the two is one cluster
 *   in both, and a row is compared with itself by its key.
 * - Findings in clusters the catalog marks as not a defect are counted apart, like on the page.
 * - A task id is named here and nowhere public: the digest goes to the team's Slack, and the test-health page names
 *   no task. It is linked only with the trackers' address, and every text that reaches Slack is escaped for it.
 *
 * No I/O in here. `scripts/a11y-digest.mjs` reads the two files and writes the payload; `.github/workflows/a11y-digest.yml`
 * runs it. The policy is `tests/AGENTS.md`, "A11y: the weekly digest".
 */

import {
  A11Y_SURFACES,
  NIGHT_SOURCES,
  SOURCES_OF_WORKFLOW,
  countsAtTarget,
  fixProgress,
  migrateA11yLedger,
  nightMeasured,
  nightSourceOf,
  surfaceOf,
} from './a11y-ledger.mjs';
import { TRIAGE_ID, clusterOf, findingShape } from '../../../tests/lib/a11y-issues.mjs';

/**
 * How far back the digest looks for the state it compares with.
 */
export const DIGEST_DAYS = 7;
/**
 * How many clusters a list names before it sums up the rest.
 */
export const DIGEST_LISTED = 5;
/**
 * The longest cluster title a line carries.
 */
export const DIGEST_TITLE = 90;
export const DIGEST_PAGE_URL = 'https://handsontable.github.io/handsontable/test-health/#a11y-fix-title';

const SURFACE_NAMES = Object.freeze({ grid: 'Grid', docs: 'Docs site', website: 'Website' });
const SURFACE_OF_NIGHT = Object.freeze({ a11y: 'grid', reader: 'grid', docs: 'docs', website: 'website' });

/**
 * The workflow that records a night source, by its name.
 *
 * @param {string} source The night source.
 * @returns {string} The workflow's name.
 */
function workflowOf(source) {
  return Object.keys(SOURCES_OF_WORKFLOW).find(workflow => SOURCES_OF_WORKFLOW[workflow].includes(source)) ?? source;
}

/**
 * The latest night of each source a ledger holds, from its history, which keeps a night long after the night's own
 * record is gone.
 *
 * @param {object|null} doc The ledger.
 * @returns {Map<string, {runId: string, seenAt: string}>} The latest night per source.
 */
function latestNights(doc) {
  const latest = new Map();

  for (const entry of doc?.history ?? []) {
    const known = latest.get(entry.source);

    if (!known || Date.parse(entry.seenAt) > Date.parse(known.seenAt)) {
      latest.set(entry.source, { runId: entry.runId, seenAt: entry.seenAt });
    }
  }

  return latest;
}

/**
 * Rows counted per cluster, most first, as a list names them: the first `DIGEST_LISTED` clusters, and the rest summed.
 *
 * @param {object[]} rows The rows, sorted into their clusters.
 * @param {Map<string, object>} clusters The catalog's clusters by id.
 * @returns {{count: number, clusters: object[], more: {count: number, clusters: number}}} The list.
 */
function byCluster(rows, clusters) {
  const counts = new Map();

  for (const row of rows) {
    counts.set(row.cluster, (counts.get(row.cluster) ?? 0) + 1);
  }

  const sorted = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id, count]) => {
    const tracker = clusters.get(id)?.tracker ?? null;

    return { id, title: id === TRIAGE_ID ? 'Needs triage: not sorted into a cluster yet' : (clusters.get(id)?.title ?? id), count,
      trackers: Array.isArray(tracker) ? tracker : [tracker].filter(Boolean) };
  });
  const rest = sorted.slice(DIGEST_LISTED);

  return { count: rows.length, clusters: sorted.slice(0, DIGEST_LISTED), more: { count: rest.reduce((sum, item) => sum + item.count, 0), clusters: rest.length } };
}

/**
 * What changed between two states of the findings ledger.
 *
 * @param {object|null} beforeDoc The ledger as it was published `days` ago, any version, or `null` when there is none
 * (a first digest, or a ledger younger than the window).
 * @param {object|null} afterDoc The ledger as it is published now, any version.
 * @param {object} catalog The compiled cluster catalog, as it is today.
 * @param {object} [options] Options.
 * @param {number} [options.days] The window the two states are apart, for the text (`DIGEST_DAYS`).
 * @returns {object} The digest; `renderA11yDigest()` words it.
 */
export function a11yDigest(beforeDoc, afterDoc, catalog, { days = DIGEST_DAYS } = {}) {
  const after = migrateA11yLedger(afterDoc ?? null);
  const before = migrateA11yLedger(beforeDoc ?? null);

  if (after === null || (after.nights ?? []).length === 0) {
    return { days, empty: true };
  }

  const clusters = new Map(catalog.clusters.map(cluster => [cluster.id, cluster]));
  // Both states under today's catalog: a row keeps its key, and its cluster is the one the catalog names now.
  const sorted = doc => (doc?.rows ?? []).map(row => ({ ...row, cluster: clusterOf(row, catalog).id }));
  const afterRows = sorted(after);
  const beforeRows = sorted(before);
  const earlier = new Map(beforeRows.map(row => [row.key, row]));
  const isOpen = row => row.status !== 'resolved';
  const isDefect = row => !clusters.get(row.cluster)?.notDefect;
  const nightsBefore = latestNights(before);
  const nightsAfter = latestNights(after);
  const sources = NIGHT_SOURCES.map((source) => {
    const was = nightsBefore.get(source) ?? null;
    const is = nightsAfter.get(source) ?? null;
    let state = 'audited';

    if (is === null) {
      state = 'never';
    } else if (was === null) {
      state = 'first';
    } else if (was.runId === is.runId) {
      state = 'idle';
    }

    return { source, workflow: workflowOf(source), before: was, after: is, state };
  });
  const stateOf = new Map(sources.map(item => [item.source, item.state]));
  // Only what a night of the window measured can have improved or declined.
  const audited = afterRows.filter(row => stateOf.get(nightSourceOf(row)) === 'audited');
  const resolved = audited.filter(row => !isOpen(row) && earlier.has(row.key) && isOpen(earlier.get(row.key)));
  // The earlier state's latest night of each source, with what it measured.
  const measuredThen = new Map(NIGHT_SOURCES.map(source => [source, (before?.nights ?? []).find(night => night.source === source
    && night.runId === nightsBefore.get(source)?.runId) ?? null]));
  const unseen = audited.filter(row => isOpen(row) && !earlier.has(row.key));
  // New where the earlier night looked and found nothing; newly measured where it had not looked.
  const fresh = unseen.filter(row => nightMeasured(measuredThen.get(nightSourceOf(row)), row) !== false);
  const firstMeasured = unseen.filter(row => nightMeasured(measuredThen.get(nightSourceOf(row)), row) === false);
  const back = audited.filter(row => isOpen(row) && earlier.has(row.key) && !isOpen(earlier.get(row.key)));
  // A fix task is cleared when it had an open finding then and has none now, and has findings again the other way round.
  const openBy = (rows) => {
    const counts = new Map();

    for (const row of rows) {
      const tracker = clusters.get(row.cluster)?.tracker ?? null;

      for (const id of Array.isArray(tracker) ? tracker : [tracker].filter(Boolean)) {
        const entry = counts.get(id) ?? { open: 0, rows: 0 };

        entry.rows += 1;
        entry.open += Number(isOpen(row));
        counts.set(id, entry);
      }
    }

    return counts;
  };
  const tasksBefore = openBy(beforeRows);
  const tasksAfter = openBy(afterRows);
  const compareIds = (a, b) => a.localeCompare(b, 'en', { numeric: true });
  const cleared = [...tasksBefore].filter(([id, was]) => was.open > 0 && tasksAfter.get(id)?.open === 0).map(([id]) => id).sort(compareIds);
  // Only a finding that declined gives a cleared task findings again: one on a target nobody had measured is where
  // that target starts.
  const declinedTasks = new Set([...fresh, ...back].flatMap((row) => {
    const tracker = clusters.get(row.cluster)?.tracker ?? null;

    return Array.isArray(tracker) ? tracker : [tracker].filter(Boolean);
  }));
  const reopened = [...tasksBefore].filter(([id, was]) => was.open === 0 && (tasksAfter.get(id)?.open ?? 0) > 0 && declinedTasks.has(id))
    .map(([id]) => id).sort(compareIds);
  const triageNow = afterRows.filter(row => isOpen(row) && row.cluster === TRIAGE_ID);
  const triageThen = beforeRows.filter(row => isOpen(row) && row.cluster === TRIAGE_ID);
  const surfaces = A11Y_SURFACES.map((surface) => {
    const ofSurface = sources.filter(item => SURFACE_OF_NIGHT[item.source] === surface);
    const open = afterRows.filter(row => surfaceOf(row) === surface && isOpen(row) && isDefect(row));
    const openThen = beforeRows.filter(row => surfaceOf(row) === surface && isOpen(row) && isDefect(row));
    let state = 'idle';

    if (ofSurface.every(item => item.state === 'never')) {
      state = 'never';
    } else if (ofSurface.every(item => item.state === 'first' || item.state === 'never')) {
      state = 'first';
    } else if (ofSurface.some(item => item.state === 'audited' || item.state === 'first')) {
      state = 'audited';
    }

    return { surface, state, open: open.length, atTarget: open.filter(countsAtTarget).length, delta: before === null ? null : open.length - openThen.length };
  });

  return {
    days,
    empty: false,
    first: before === null,
    from: before?.updatedAt ?? null,
    to: after.updatedAt,
    sources,
    // Whether any night of the window can speak of a change.
    compared: before !== null && sources.some(item => item.state === 'audited'),
    improved: { resolved: byCluster(resolved.filter(isDefect), clusters), cleared },
    declined: { new: byCluster(fresh.filter(isDefect), clusters), back: byCluster(back.filter(isDefect), clusters), reopened },
    // A workflow recorded for the first time: its open findings are where it starts, not what it lost.
    firstAudits: sources.filter(item => item.state === 'first' && before !== null).map(item => ({
      source: item.source,
      workflow: item.workflow,
      open: afterRows.filter(row => nightSourceOf(row) === item.source && isOpen(row) && isDefect(row)).length,
    })),
    // Findings on targets the earlier state had not measured, per check: where they start, too.
    firstMeasured: {
      count: firstMeasured.filter(isDefect).length,
      checks: [...firstMeasured.filter(isDefect).reduce((counts, row) => counts.set(row.check, (counts.get(row.check) ?? 0) + 1), new Map())]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    },
    notDefect: {
      new: unseen.filter(row => !isDefect(row)).length,
      resolved: resolved.filter(row => !isDefect(row)).length,
      back: back.filter(row => !isDefect(row)).length,
    },
    triage: { open: triageNow.length, shapes: new Set(triageNow.map(findingShape)).size, delta: before === null ? null : triageNow.length - triageThen.length },
    surfaces,
    headline: fixProgress(after, catalog).headline,
  };
}

/**
 * The address the trackers live at, as the message may link it: https, with nothing that could close a link. A task
 * id is appended to it. The digest goes to the team's Slack; the test-health page is public and names no task.
 *
 * @param {unknown} value The address.
 * @returns {string|null} The address, or `null`.
 */
export function trackerAddress(value) {
  return typeof value === 'string' && /^https:\/\/[\w.-]+(?:\/[\w./-]*)?$/.test(value) && value.length <= 200 ? value : null;
}

/**
 * Text as Slack's `mrkdwn` takes it: the three characters it reads as markup escaped, and whitespace folded.
 *
 * @param {unknown} value The text.
 * @returns {string} The escaped text.
 */
export function slackText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * A count with its noun.
 *
 * @param {number} count The count.
 * @param {string} one The singular.
 * @param {string} many The plural.
 * @returns {string} The phrase.
 */
function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * A change in a count, signed, or "no change".
 *
 * @param {number} delta The change.
 * @returns {string} The phrase.
 */
function signed(delta) {
  if (delta === 0) {
    return 'no change';
  }

  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

/**
 * The digest as the text of a Slack message (`mrkdwn`): what was compared, what improved, what declined, the triage
 * queue, what is outstanding per surface, and the page's headline numbers, with links to the page and the fix tasks.
 *
 * @param {object} digest The digest (`a11yDigest()`).
 * @param {object} [options] Options.
 * @param {string} [options.pageUrl] The page the digest links to.
 * @param {string|null} [options.trackerUrl] The address a task id is appended to; without one (`trackerAddress()`) a task
 * is named and not linked.
 * @returns {string} The text.
 */
export function renderA11yDigest(digest, { pageUrl = DIGEST_PAGE_URL, trackerUrl = null } = {}) {
  const address = trackerAddress(trackerUrl);
  const day = iso => String(iso ?? '').slice(0, 10);
  const task = id => (address ? `<${address}${id}|${id}>` : id);
  const page = `<${pageUrl}|Fix progress on the test-health page>`;

  if (digest.empty) {
    return `:bar_chart: *Accessibility findings: weekly digest*\nThe findings ledger holds no audit yet.\n${page}`;
  }

  const title = text => (text.length > DIGEST_TITLE ? `${text.slice(0, DIGEST_TITLE - 1)}…` : text);
  const listed = list => [
    ...list.clusters.map(item => `      ◦ ${item.count} · ${slackText(title(item.title))}`
      + `${item.trackers.length > 0 ? ` (${item.trackers.map(task).join(', ')})` : ''}`),
    ...(list.more.clusters > 0 ? [`      ◦ … and ${list.more.count} more in ${plural(list.more.clusters, 'cluster', 'clusters')}`] : []),
  ];
  const night = item => `${item.workflow} run ${item.after.runId} (${day(item.after.seenAt)})`;
  const compared = digest.sources.filter(item => item.state !== 'never').map((item) => {
    if (item.state === 'audited') {
      return `${night(item)} against run ${item.before.runId} (${day(item.before.seenAt)})`;
    }
    if (item.state === 'first') {
      return digest.first ? night(item) : `${night(item)}, its first audit`;
    }

    return `${item.workflow}: not audited in the window, latest run ${item.after.runId} (${day(item.after.seenAt)})`;
  });
  const { headline } = digest;
  const lines = [
    `:bar_chart: *Accessibility findings: weekly digest* (${digest.from ? `${day(digest.from)} to ` : ''}${day(digest.to)})`,
    `${digest.first ? 'The latest nights' : 'Compared'}: ${compared.join('; ')}.`,
  ];

  if (digest.first) {
    lines.push(`No earlier state of the ledger within reach, ${digest.days} days back, to compare with: this digest says where things stand.`);
  } else if (!digest.compared && digest.firstAudits.length === 0) {
    lines.push(`*No audit was collected in the last ${plural(digest.days, 'day', 'days')}*, so nothing can have improved or declined. Dispatch the audit, or check its schedule.`);
  } else {
    lines.push(
      '',
      '*Improved*',
      `• ${plural(digest.improved.resolved.count, 'finding', 'findings')} resolved`,
      ...listed(digest.improved.resolved),
      digest.improved.cleared.length > 0
        ? `• ${plural(digest.improved.cleared.length, 'fix task', 'fix tasks')} cleared, no open finding left: ${digest.improved.cleared.map(task).join(', ')}`
        : '• No fix task cleared',
      '',
      '*Declined*',
      `• ${plural(digest.declined.new.count, 'new finding', 'new findings')}`,
      ...listed(digest.declined.new),
      `• ${plural(digest.declined.back.count, 'finding', 'findings')} came back after being resolved`,
      ...listed(digest.declined.back),
      ...(digest.declined.reopened.length > 0
        ? [`• ${plural(digest.declined.reopened.length, 'fix task has', 'fix tasks have')} findings again: ${digest.declined.reopened.map(task).join(', ')}`]
        : []),
    );

    if (digest.firstAudits.length > 0 || digest.firstMeasured.count > 0) {
      const checks = digest.firstMeasured.checks.slice(0, DIGEST_LISTED).map(([check, count]) => `${slackText(check)} ${count}`);
      const rest = digest.firstMeasured.checks.length - checks.length;

      lines.push('', '*Newly measured*, a baseline and not a decline', ...[
        ...digest.firstAudits.map(item => `• ${item.workflow}, its first audit: ${plural(item.open, 'finding', 'findings')}`),
        ...(digest.firstMeasured.count > 0
          ? [`• ${plural(digest.firstMeasured.count, 'finding', 'findings')} on targets the earlier audit had not measured, a new check, scenario or page: `
            + `${checks.join(', ')}${rest > 0 ? `, and ${plural(rest, 'more check', 'more checks')}` : ''}`]
          : []),
      ]);
    }
    if (digest.notDefect.new + digest.notDefect.resolved + digest.notDefect.back > 0) {
      lines.push(`Not counted above, in clusters the catalog marks as not a defect: ${digest.notDefect.new} new, ${digest.notDefect.resolved} resolved, `
        + `${digest.notDefect.back} back.`);
    }
  }

  lines.push(
    '',
    `*Needs triage*: ${plural(digest.triage.open, 'finding', 'findings')} in ${plural(digest.triage.shapes, 'shape', 'shapes')}`
      + `${digest.triage.delta === null ? '' : ` (${signed(digest.triage.delta)})`}`,
    '',
    '*Outstanding*, open defect findings per surface',
    ...digest.surfaces.filter(item => item.state !== 'never').map((item) => {
      let change = item.delta === null ? '' : `, ${signed(item.delta)}`;

      if (item.state === 'first' && !digest.first) {
        change = ', first audit';
      } else if (item.state === 'idle' && !digest.first) {
        change = ', not audited in the window';
      }

      return `• ${SURFACE_NAMES[item.surface]}: ${item.open} (${item.atTarget} at the target level)${change}`;
    }),
    '',
    `*Fix progress*: ${headline.trackers.clear} of ${plural(headline.trackers.total, 'fix task', 'fix tasks')} with no open finding · `
      + `${headline.open} open (${headline.atTarget} at the target level) · ${headline.recent.resolved} resolved in the last 30 days · `
      + `${headline.cameBack} came back and still open · ${headline.medianDays === null
        ? 'no finding resolved yet'
        : `median ${plural(headline.medianDays, 'day', 'days')} from first seen to resolved, as fine as the gap between audits`}`,
    ...(headline.baseline
      ? [`Against the first full audit (${day(headline.baseline.startedAt)}): ${headline.baseline.open} open then, ${headline.baseline.new} new since, `
        + `${headline.baseline.back} came back, ${headline.baseline.resolved} resolved, ${headline.open} open now.`]
      : []),
    page,
  );

  return lines.join('\n');
}
